-- Serialize taxonomy deactivation with resource publication/classification
-- changes by locking the same parent resource rows first.

create or replace function private.prevent_unsafe_resource_taxonomy_deactivation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not old.active or new.active then
    return new;
  end if;

  if tg_table_name = 'bls_topics' then
    perform 1
    from public.resources resource
    join public.resource_topics assignment
      on assignment.resource_id = resource.id
    where assignment.topic_id = old.id
    order by resource.id
    for update of resource;

    if exists (
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
  end if;

  if tg_table_name = 'teaching_stages' then
    perform 1
    from public.resources resource
    join public.resource_teaching_stages assignment
      on assignment.resource_id = resource.id
    where assignment.teaching_stage_id = old.id
    order by resource.id
    for update of resource;

    if exists (
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
  end if;

  return new;
end;
$$;

comment on function private.prevent_unsafe_resource_taxonomy_deactivation() is
  'Locks affected resources and prevents taxonomy retirement from leaving published resources without an active topic or instructor stage.';
