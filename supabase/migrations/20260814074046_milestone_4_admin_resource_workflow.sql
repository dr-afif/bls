-- Milestone 4 Phase 4: server-owned resource lifecycle, safe PDF draft
-- cleanup, and administrator workflow primitives.

create index resources_admin_updated_idx
  on public.resources (organization_id, updated_at desc, id);

create index resource_versions_admin_history_idx
  on public.resource_versions (resource_id, created_at desc, id);

create index audit_events_resource_recent_idx
  on public.audit_events (organization_id, entity_type, entity_id, created_at desc);

-- Lifecycle status, version allocation, and classification replacement are
-- exposed only through the narrow functions below. Stable resource metadata
-- remains editable through the existing column-scoped grant and RLS policy.
revoke update (status, current_version_id)
  on table public.resources from authenticated;

revoke insert on table public.resource_versions from authenticated;
revoke update (
  storage_path, reviewed_by, reviewed_at, next_review_at,
  approved_by, approved_at, status
) on table public.resource_versions from authenticated;

revoke insert, update, delete on table public.resource_audiences
  from authenticated;
revoke insert, update, delete on table public.resource_topics
  from authenticated;
revoke insert, update, delete on table public.resource_teaching_stages
  from authenticated;

create or replace function private.require_resource_admin(
  target_resource_id uuid
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_organization uuid;
begin
  if actor is null or not private.is_active_user() then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select resource.organization_id into target_organization
  from public.resources resource
  where resource.id = target_resource_id;

  if target_organization is null
    or not private.is_admin_in_organization(target_organization) then
    raise exception 'Not authorized to manage this resource'
      using errcode = '42501';
  end if;

  return target_organization;
end;
$$;

create or replace function private.resource_pdf_object_exists(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select object_name is not null and exists (
    select 1
    from storage.objects object
    where object.bucket_id = 'course-resources'
      and object.name = object_name
  );
$$;

revoke all on function private.require_resource_admin(uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.resource_pdf_object_exists(text)
  from public, anon, authenticated, service_role;

-- A published resource may receive a new draft version. Upload and cleanup
-- remain exact-path and draft-only; no SELECT, UPDATE, or upsert permission is
-- added for browser users.
create or replace function private.can_upload_resource_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.resource_versions version
    join public.resources resource on resource.id = version.resource_id
    where object_name is not null
      and version.storage_path = object_name
      and version.resource_type = 'pdf'
      and version.status = 'draft'
      and resource.resource_type = 'pdf'
      and resource.status in ('draft', 'under_review', 'approved', 'published')
      and resource.current_version_id is distinct from version.id
      and split_part(object_name, '/', 1) = resource.organization_id::text
      and split_part(object_name, '/', 2) = resource.id::text
      and split_part(object_name, '/', 3) = version.id::text
      and array_length(string_to_array(object_name, '/'), 1) = 4
      and lower(storage.extension(object_name)) = 'pdf'
      and private.is_admin_in_organization(resource.organization_id)
  );
$$;

create function private.can_delete_resource_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.resource_versions version
    join public.resources resource on resource.id = version.resource_id
    where object_name is not null
      and version.storage_path = object_name
      and version.resource_type = 'pdf'
      and version.status = 'draft'
      and resource.current_version_id is distinct from version.id
      and split_part(object_name, '/', 1) = resource.organization_id::text
      and split_part(object_name, '/', 2) = resource.id::text
      and split_part(object_name, '/', 3) = version.id::text
      and array_length(string_to_array(object_name, '/'), 1) = 4
      and private.is_admin_in_organization(resource.organization_id)
  );
$$;

revoke all on function private.can_upload_resource_object(text) from public;
revoke all on function private.can_delete_resource_object(text) from public;
grant execute on function private.can_upload_resource_object(text)
  to authenticated, service_role;
grant execute on function private.can_delete_resource_object(text)
  to authenticated, service_role;

create policy course_resources_delete_admin
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'course-resources'
  and private.can_delete_resource_object(name)
);

create or replace function private.prevent_immutable_resource_version_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status in ('approved', 'published', 'retired', 'archived')
    or exists (
      select 1 from public.resources resource
      where resource.current_version_id = old.id
    ) then
    raise exception 'Approved or historically selected resource versions are immutable'
      using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'Only draft resource versions can be discarded'
        using errcode = '23514';
    end if;
    return old;
  end if;

  if new.resource_id <> old.resource_id
    or new.version_number <> old.version_number
    or new.resource_type <> old.resource_type then
    raise exception 'Resource version identity cannot be changed'
      using errcode = '23514';
  end if;

  if old.status = 'under_review' and row(
    new.title, new.summary, new.content, new.youtube_video_id,
    new.storage_path, new.content_hash, new.guideline_source,
    new.guideline_year
  ) is distinct from row(
    old.title, old.summary, old.content, old.youtube_video_id,
    old.storage_path, old.content_hash, old.guideline_source,
    old.guideline_year
  ) then
    raise exception 'Content under review cannot be edited'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_immutable_resource_version_change()
  from public;

create function public.create_resource_version_draft(
  target_resource_id uuid,
  draft_title text,
  draft_summary text,
  draft_content jsonb default null,
  draft_youtube_video_id text default null,
  draft_guideline_source text default null,
  draft_guideline_year integer default null
)
returns table (
  version_id uuid,
  version_number integer,
  storage_path text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_organization uuid;
  target_type public.resource_type;
  target_status public.resource_status;
  next_version integer;
  new_version_id uuid := gen_random_uuid();
  new_storage_path text;
begin
  perform 1
  from public.resources resource
  where resource.id = target_resource_id
  for update;

  target_organization := private.require_resource_admin(target_resource_id);

  select resource.resource_type, resource.status
    into target_type, target_status
  from public.resources resource
  where resource.id = target_resource_id;

  if target_status in ('retired', 'archived') then
    raise exception 'Retired or archived resources cannot receive new versions'
      using errcode = '23514';
  end if;

  select coalesce(max(version.version_number), 0) + 1
    into next_version
  from public.resource_versions version
  where version.resource_id = target_resource_id;

  if target_type = 'pdf' then
    new_storage_path := concat(
      target_organization::text, '/', target_resource_id::text, '/',
      new_version_id::text, '/', gen_random_uuid()::text, '.pdf'
    );
  end if;

  insert into public.resource_versions (
    id, resource_id, version_number, resource_type, title, summary,
    content, youtube_video_id, storage_path, guideline_source,
    guideline_year, status, created_by
  ) values (
    new_version_id, target_resource_id, next_version, target_type,
    trim(draft_title), trim(draft_summary),
    case when target_type in ('guide', 'checklist') then draft_content else null end,
    case when target_type = 'youtube_video'
      then nullif(trim(draft_youtube_video_id), '') else null end,
    new_storage_path, nullif(trim(draft_guideline_source), ''),
    draft_guideline_year, 'draft', actor
  );

  return query select new_version_id, next_version, new_storage_path;
end;
$$;

create function public.replace_resource_classifications(
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
begin
  perform 1
  from public.resources resource
  where resource.id = target_resource_id
  for update;

  perform private.require_resource_admin(target_resource_id);

  select resource.status into target_status
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

create function public.get_resource_pdf_file_status(target_version_id uuid)
returns table (file_state text, object_path text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_resource_id uuid;
  target_type public.resource_type;
  target_path text;
begin
  select version.resource_id, version.resource_type, version.storage_path
    into target_resource_id, target_type, target_path
  from public.resource_versions version
  where version.id = target_version_id;

  perform private.require_resource_admin(target_resource_id);

  return query select
    case
      when target_type <> 'pdf' then 'not_applicable'
      when private.resource_pdf_object_exists(target_path) then 'ready'
      else 'missing'
    end,
    target_path;
end;
$$;

create function public.submit_resource_version_for_review(
  target_version_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_resource_id uuid;
  target_status public.resource_status;
  target_type public.resource_type;
  target_path text;
begin
  select version.resource_id into target_resource_id
  from public.resource_versions version
  where version.id = target_version_id;

  perform 1 from public.resources resource
  where resource.id = target_resource_id for update;
  perform private.require_resource_admin(target_resource_id);

  select version.status, version.resource_type, version.storage_path
    into target_status, target_type, target_path
  from public.resource_versions version
  where version.id = target_version_id
  for update;

  if target_status <> 'draft' then
    raise exception 'Only draft versions can be submitted for review'
      using errcode = '23514';
  end if;

  if target_type = 'pdf'
    and not private.resource_pdf_object_exists(target_path) then
    raise exception 'The private PDF must be uploaded before review'
      using errcode = '23514';
  end if;

  update public.resource_versions
  set status = 'under_review'
  where id = target_version_id;
end;
$$;

create function public.record_resource_version_review(
  target_version_id uuid,
  target_next_review_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_resource_id uuid;
  target_status public.resource_status;
begin
  select version.resource_id into target_resource_id
  from public.resource_versions version
  where version.id = target_version_id;

  perform 1 from public.resources resource
  where resource.id = target_resource_id for update;
  perform private.require_resource_admin(target_resource_id);

  select version.status into target_status
  from public.resource_versions version
  where version.id = target_version_id
  for update;

  if target_status <> 'under_review' then
    raise exception 'Only versions under review can record review evidence'
      using errcode = '23514';
  end if;

  if target_next_review_at is null or target_next_review_at <= now() then
    raise exception 'Next review must be in the future'
      using errcode = '22023';
  end if;

  update public.resource_versions
  set reviewed_by = actor,
      reviewed_at = now(),
      next_review_at = target_next_review_at
  where id = target_version_id;
end;
$$;

create function public.approve_resource_version(target_version_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_resource_id uuid;
  target_version public.resource_versions%rowtype;
begin
  select version.resource_id into target_resource_id
  from public.resource_versions version
  where version.id = target_version_id;

  perform 1 from public.resources resource
  where resource.id = target_resource_id for update;
  perform private.require_resource_admin(target_resource_id);

  select version.* into target_version
  from public.resource_versions version
  where version.id = target_version_id
  for update;

  if target_version.status <> 'under_review'
    or target_version.reviewed_by is null
    or target_version.reviewed_at is null
    or target_version.next_review_at is null
    or target_version.next_review_at <= now()
    or target_version.guideline_source is null
    or target_version.guideline_year is null then
    raise exception 'Review and guideline evidence is incomplete'
      using errcode = '23514';
  end if;

  if target_version.resource_type = 'pdf'
    and not private.resource_pdf_object_exists(target_version.storage_path) then
    raise exception 'The private PDF is unavailable'
      using errcode = '23514';
  end if;

  update public.resource_versions
  set status = 'approved', approved_by = actor, approved_at = now()
  where id = target_version_id;
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
    select 1 from public.resource_topics topic
    where topic.resource_id = target_resource_id
  ) then
    raise exception 'Published resources require an audience and topic'
      using errcode = '23514';
  end if;

  if exists (
    select 1 from public.resource_audiences audience
    where audience.resource_id = target_resource_id
      and audience.audience = 'instructor'
  ) and not exists (
    select 1 from public.resource_teaching_stages stage
    where stage.resource_id = target_resource_id
  ) then
    raise exception 'Instructor resources require a teaching stage'
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

create function public.retire_resource(target_resource_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_status public.resource_status;
begin
  perform 1 from public.resources resource
  where resource.id = target_resource_id for update;
  perform private.require_resource_admin(target_resource_id);

  select resource.status into target_status
  from public.resources resource
  where resource.id = target_resource_id;

  if target_status <> 'published' then
    raise exception 'Only published resources can be retired'
      using errcode = '23514';
  end if;

  update public.resources
  set status = 'retired', updated_by = actor
  where id = target_resource_id;
end;
$$;

create function public.discard_resource_version_draft(target_version_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_resource_id uuid;
  target_organization uuid;
  target_version public.resource_versions%rowtype;
begin
  select version.resource_id into target_resource_id
  from public.resource_versions version
  where version.id = target_version_id;

  perform 1 from public.resources resource
  where resource.id = target_resource_id for update;
  target_organization := private.require_resource_admin(target_resource_id);

  select version.* into target_version
  from public.resource_versions version
  where version.id = target_version_id
  for update;

  if target_version.status <> 'draft'
    or exists (
      select 1 from public.resources resource
      where resource.current_version_id = target_version_id
    ) then
    raise exception 'Only an unreferenced draft version can be discarded'
      using errcode = '23514';
  end if;

  if target_version.resource_type = 'pdf'
    and private.resource_pdf_object_exists(target_version.storage_path) then
    raise exception 'Remove the private PDF before discarding its draft'
      using errcode = '23514';
  end if;

  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id,
    metadata, request_id
  ) values (
    actor, 'resource.version_discarded', 'resource_version',
    target_version_id, target_organization,
    jsonb_build_object(
      'resource_id', target_resource_id,
      'version_number', target_version.version_number
    ),
    gen_random_uuid()
  );

  delete from public.resource_versions
  where id = target_version_id;
end;
$$;

create or replace function private.audit_resource_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
begin
  if actor is null then return new; end if;
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id,
    metadata, request_id
  ) values (
    actor,
    case
      when tg_op = 'INSERT' then 'resource.created'
      when new.status = 'retired' and old.status <> 'retired'
        then 'resource.retired'
      when new.status = 'published'
        and (
          old.status <> 'published'
          or new.current_version_id is distinct from old.current_version_id
        ) then 'resource.published'
      else 'resource.updated'
    end,
    'resource', new.id, new.organization_id,
    jsonb_build_object(
      'course_id', new.course_id, 'slug', new.slug,
      'resource_type', new.resource_type, 'status', new.status,
      'current_version_id', new.current_version_id
    ),
    gen_random_uuid()
  );
  return new;
end;
$$;

create or replace function private.audit_resource_version_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_organization uuid;
begin
  if actor is null then return new; end if;
  select organization_id into target_organization
  from public.resources where id = new.resource_id;
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id,
    metadata, request_id
  ) values (
    actor,
    case
      when tg_op = 'INSERT' then 'resource.version_created'
      when new.status = 'under_review' and old.status = 'draft'
        then 'resource.version_submitted'
      when new.status = 'approved' and old.status <> 'approved'
        then 'resource.version_approved'
      when new.reviewed_at is distinct from old.reviewed_at
        then 'resource.version_reviewed'
      else 'resource.version_updated'
    end,
    'resource_version', new.id, target_organization,
    jsonb_build_object(
      'resource_id', new.resource_id, 'version_number', new.version_number,
      'status', new.status
    ),
    gen_random_uuid()
  );
  return new;
end;
$$;

revoke all on function private.audit_resource_change() from public;
revoke all on function private.audit_resource_version_change() from public;

revoke all on function public.create_resource_version_draft(
  uuid, text, text, jsonb, text, text, integer
) from public, anon;
revoke all on function public.replace_resource_classifications(
  uuid, public.resource_audience[], uuid[], uuid[]
) from public, anon;
revoke all on function public.get_resource_pdf_file_status(uuid)
  from public, anon;
revoke all on function public.submit_resource_version_for_review(uuid)
  from public, anon;
revoke all on function public.record_resource_version_review(uuid, timestamptz)
  from public, anon;
revoke all on function public.approve_resource_version(uuid)
  from public, anon;
revoke all on function public.publish_resource_version(uuid, uuid)
  from public, anon;
revoke all on function public.retire_resource(uuid)
  from public, anon;
revoke all on function public.discard_resource_version_draft(uuid)
  from public, anon;

grant execute on function public.create_resource_version_draft(
  uuid, text, text, jsonb, text, text, integer
) to authenticated, service_role;
grant execute on function public.replace_resource_classifications(
  uuid, public.resource_audience[], uuid[], uuid[]
) to authenticated, service_role;
grant execute on function public.get_resource_pdf_file_status(uuid)
  to authenticated, service_role;
grant execute on function public.submit_resource_version_for_review(uuid)
  to authenticated, service_role;
grant execute on function public.record_resource_version_review(uuid, timestamptz)
  to authenticated, service_role;
grant execute on function public.approve_resource_version(uuid)
  to authenticated, service_role;
grant execute on function public.publish_resource_version(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.retire_resource(uuid)
  to authenticated, service_role;
grant execute on function public.discard_resource_version_draft(uuid)
  to authenticated, service_role;

comment on function public.create_resource_version_draft(
  uuid, text, text, jsonb, text, text, integer
) is 'Allocates one immutable draft version and exact PDF object path after active same-organization administrator authorization.';
comment on function public.replace_resource_classifications(
  uuid, public.resource_audience[], uuid[], uuid[]
) is 'Atomically replaces resource audience, topic, and teaching-stage assignments for an authorized administrator.';
comment on function public.discard_resource_version_draft(uuid) is
  'Discards only an unreferenced draft after its private object is confirmed absent.';
