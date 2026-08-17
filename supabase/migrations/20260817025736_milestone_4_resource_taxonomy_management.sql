-- Milestone 4 Phase 4.1: administrator-managed resource taxonomy.
--
-- Taxonomy rows remain organization-scoped and are retired through the
-- existing active flag rather than deleted. Browser roles keep their existing
-- RLS policies and receive no DELETE privilege.

revoke update (slug) on table public.bls_topics from authenticated;
revoke update (slug) on table public.teaching_stages from authenticated;

create function private.prevent_unsafe_resource_taxonomy_deactivation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not old.active or new.active then
    return new;
  end if;

  if tg_table_name = 'bls_topics' and exists (
    select 1
    from public.resource_topics assignment
    join public.resources resource on resource.id = assignment.resource_id
    where assignment.topic_id = old.id
      and resource.status = 'published'
      and not exists (
        select 1
        from public.resource_topics alternative_assignment
        join public.bls_topics alternative
          on alternative.id = alternative_assignment.topic_id
        where alternative_assignment.resource_id = resource.id
          and alternative_assignment.topic_id <> old.id
          and alternative.active
      )
  ) then
    raise exception 'Reassign published resources before deactivating this BLS topic'
      using errcode = '23514';
  end if;

  if tg_table_name = 'teaching_stages' and exists (
    select 1
    from public.resource_teaching_stages assignment
    join public.resources resource on resource.id = assignment.resource_id
    where assignment.teaching_stage_id = old.id
      and resource.status = 'published'
      and exists (
        select 1
        from public.resource_audiences audience
        where audience.resource_id = resource.id
          and audience.audience = 'instructor'
      )
      and not exists (
        select 1
        from public.resource_teaching_stages alternative_assignment
        join public.teaching_stages alternative
          on alternative.id = alternative_assignment.teaching_stage_id
        where alternative_assignment.resource_id = resource.id
          and alternative_assignment.teaching_stage_id <> old.id
          and alternative.active
      )
  ) then
    raise exception 'Reassign published instructor resources before deactivating this teaching stage'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_unsafe_resource_taxonomy_deactivation()
  from public;

create trigger bls_topics_prevent_unsafe_deactivation
before update of active on public.bls_topics
for each row execute function private.prevent_unsafe_resource_taxonomy_deactivation();

create trigger teaching_stages_prevent_unsafe_deactivation
before update of active on public.teaching_stages
for each row execute function private.prevent_unsafe_resource_taxonomy_deactivation();

create function private.audit_resource_taxonomy_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  taxonomy_kind text := case
    when tg_table_name = 'bls_topics' then 'topic'
    else 'teaching_stage'
  end;
  action_name text;
begin
  if actor is null then
    return new;
  end if;

  action_name := case
    when tg_op = 'INSERT' then 'resource_taxonomy.' || taxonomy_kind || '_created'
    when new.active and not old.active
      then 'resource_taxonomy.' || taxonomy_kind || '_activated'
    when not new.active and old.active
      then 'resource_taxonomy.' || taxonomy_kind || '_deactivated'
    else 'resource_taxonomy.' || taxonomy_kind || '_updated'
  end;

  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id,
    metadata, request_id
  ) values (
    actor,
    action_name,
    case when taxonomy_kind = 'topic' then 'bls_topic' else 'teaching_stage' end,
    new.id,
    new.organization_id,
    jsonb_build_object(
      'slug', new.slug,
      'name', new.name,
      'display_order', new.display_order,
      'active', new.active,
      'previous_name', case when tg_op = 'UPDATE' then old.name else null end,
      'previous_display_order',
        case when tg_op = 'UPDATE' then old.display_order else null end,
      'previous_active',
        case when tg_op = 'UPDATE' then old.active else null end
    ),
    gen_random_uuid()
  );

  return new;
end;
$$;

revoke all on function private.audit_resource_taxonomy_change() from public;

create trigger bls_topics_audit_change
after insert or update on public.bls_topics
for each row execute function private.audit_resource_taxonomy_change();

create trigger teaching_stages_audit_change
after insert or update on public.teaching_stages
for each row execute function private.audit_resource_taxonomy_change();

create or replace function public.replace_resource_classifications(
  target_resource_id uuid,
  target_audiences public.resource_audience[],
  target_topic_ids uuid[],
  target_teaching_stage_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_status public.resource_status;
  target_organization uuid;
begin
  perform 1
  from public.resources resource
  where resource.id = target_resource_id
  for update;

  perform private.require_resource_admin(target_resource_id);

  select resource.status, resource.organization_id
    into target_status, target_organization
  from public.resources resource
  where resource.id = target_resource_id;

  if target_status = 'archived' then
    raise exception 'Archived resource classifications cannot be changed'
      using errcode = '23514';
  end if;

  if coalesce(cardinality(target_audiences), 0) > 2
    or coalesce(cardinality(target_topic_ids), 0) > 50
    or coalesce(cardinality(target_teaching_stage_ids), 0) > 50 then
    raise exception 'Too many resource classifications'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(coalesce(target_topic_ids, array[]::uuid[])) requested(topic_id)
    left join public.bls_topics topic on topic.id = requested.topic_id
    where topic.id is null
      or topic.organization_id <> target_organization
      or (
        not topic.active
        and not exists (
          select 1 from public.resource_topics existing
          where existing.resource_id = target_resource_id
            and existing.topic_id = requested.topic_id
        )
      )
  ) then
    raise exception 'Topics must be active in the resource organization or already assigned'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from unnest(coalesce(
      target_teaching_stage_ids,
      array[]::uuid[]
    )) requested(stage_id)
    left join public.teaching_stages stage on stage.id = requested.stage_id
    where stage.id is null
      or stage.organization_id <> target_organization
      or (
        not stage.active
        and not exists (
          select 1 from public.resource_teaching_stages existing
          where existing.resource_id = target_resource_id
            and existing.teaching_stage_id = requested.stage_id
        )
      )
  ) then
    raise exception 'Teaching stages must be active in the resource organization or already assigned'
      using errcode = '23514';
  end if;

  if target_status = 'published' and (
    coalesce(cardinality(target_audiences), 0) = 0
    or not exists (
      select 1
      from unnest(coalesce(target_topic_ids, array[]::uuid[])) requested(topic_id)
      join public.bls_topics topic on topic.id = requested.topic_id
      where topic.active and topic.organization_id = target_organization
    )
  ) then
    raise exception 'Published resources require an audience and active topic'
      using errcode = '23514';
  end if;

  if target_status = 'published'
    and 'instructor'::public.resource_audience = any(coalesce(
      target_audiences,
      array[]::public.resource_audience[]
    ))
    and not exists (
      select 1
      from unnest(coalesce(
        target_teaching_stage_ids,
        array[]::uuid[]
      )) requested(stage_id)
      join public.teaching_stages stage on stage.id = requested.stage_id
      where stage.active and stage.organization_id = target_organization
    ) then
    raise exception 'Published instructor resources require an active teaching stage'
      using errcode = '23514';
  end if;

  delete from public.resource_audiences audience
  where audience.resource_id = target_resource_id;
  delete from public.resource_topics topic
  where topic.resource_id = target_resource_id;
  delete from public.resource_teaching_stages stage
  where stage.resource_id = target_resource_id;

  insert into public.resource_audiences (resource_id, audience, created_by)
  select target_resource_id, item.audience, actor
  from (
    select distinct unnest(coalesce(
      target_audiences,
      array[]::public.resource_audience[]
    )) as audience
  ) item;

  insert into public.resource_topics (
    resource_id, topic_id, display_order, created_by
  )
  select target_resource_id, item.topic_id,
    row_number() over (order by item.first_ordinality)::integer - 1, actor
  from (
    select unnested.topic_id, min(unnested.ordinality) as first_ordinality
    from unnest(coalesce(target_topic_ids, array[]::uuid[]))
      with ordinality as unnested(topic_id, ordinality)
    group by unnested.topic_id
  ) item;

  insert into public.resource_teaching_stages (
    resource_id, teaching_stage_id, display_order, created_by
  )
  select target_resource_id, item.stage_id,
    row_number() over (order by item.first_ordinality)::integer - 1, actor
  from (
    select unnested.stage_id, min(unnested.ordinality) as first_ordinality
    from unnest(coalesce(target_teaching_stage_ids, array[]::uuid[]))
      with ordinality as unnested(stage_id, ordinality)
    group by unnested.stage_id
  ) item;
end;
$$;

create or replace function public.publish_resource_version(
  target_resource_id uuid,
  target_version_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  version_row public.resource_versions%rowtype;
begin
  perform 1 from public.resources resource
  where resource.id = target_resource_id for update;
  perform private.require_resource_admin(target_resource_id);

  select version.* into version_row
  from public.resource_versions version
  where version.id = target_version_id
  for update;

  if version_row.resource_id is distinct from target_resource_id
    or version_row.status <> 'approved' then
    raise exception 'Only an approved version of this resource can be published'
      using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.resource_audiences audience
    where audience.resource_id = target_resource_id
  ) or not exists (
    select 1
    from public.resource_topics assignment
    join public.bls_topics topic on topic.id = assignment.topic_id
    where assignment.resource_id = target_resource_id
      and topic.active
  ) then
    raise exception 'Published resources require an audience and active topic'
      using errcode = '23514';
  end if;

  if exists (
    select 1 from public.resource_audiences audience
    where audience.resource_id = target_resource_id
      and audience.audience = 'instructor'
  ) and not exists (
    select 1
    from public.resource_teaching_stages assignment
    join public.teaching_stages stage
      on stage.id = assignment.teaching_stage_id
    where assignment.resource_id = target_resource_id
      and stage.active
  ) then
    raise exception 'Instructor resources require an active teaching stage'
      using errcode = '23514';
  end if;

  if version_row.resource_type = 'pdf'
    and not private.resource_pdf_object_exists(version_row.storage_path) then
    raise exception 'The private PDF is unavailable'
      using errcode = '23514';
  end if;

  update public.resources
  set current_version_id = target_version_id,
      status = 'published',
      updated_by = actor
  where id = target_resource_id;
end;
$$;

comment on function private.prevent_unsafe_resource_taxonomy_deactivation() is
  'Prevents taxonomy retirement from leaving published resources without an active topic or instructor stage.';
comment on function private.audit_resource_taxonomy_change() is
  'Appends actor-attributed audit events for resource taxonomy creation, edits, activation, and retirement.';
