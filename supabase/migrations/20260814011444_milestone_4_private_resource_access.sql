insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'course-resources',
  'course-resources',
  false,
  20971520,
  array['application/pdf']::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.resource_access_events
  drop constraint if exists resource_access_events_action_check;

alter table public.resource_access_events
  add constraint resource_access_events_action_check check (
    action in (
      'opened', 'closed', 'signed_url_authorized', 'signed_url_issued',
      'video_played', 'video_paused', 'pdf_page_viewed'
    )
  );

create unique index resource_access_events_idempotency_idx
  on public.resource_access_events (
    user_id,
    resource_version_id,
    request_id,
    action
  )
  where action in ('signed_url_authorized', 'signed_url_issued');

create function private.user_can_read_resource(
  target_user_id uuid,
  target_resource_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.resources r
    join public.profiles p on p.id = target_user_id
    where r.id = target_resource_id
      and p.account_status = 'active'
      and (
        (
          exists (
            select 1
            from public.user_roles administrator_role
            where administrator_role.user_id = target_user_id
              and administrator_role.role in ('admin', 'super_admin')
          )
          and (
            p.organization_id = r.organization_id
            or exists (
              select 1
              from public.user_roles super_role
              where super_role.user_id = target_user_id
                and super_role.role = 'super_admin'
            )
          )
        )
        or (
          p.organization_id = r.organization_id
          and r.status = 'published'
          and r.current_version_id is not null
          and (r.available_from is null or r.available_from <= now())
          and (r.available_until is null or r.available_until > now())
          and exists (
            select 1
            from public.courses course
            where course.id = r.course_id
              and course.organization_id = r.organization_id
              and course.status = 'published'
          )
          and exists (
            select 1
            from public.course_entitlements entitlement
            where entitlement.user_id = target_user_id
              and entitlement.course_id = r.course_id
              and entitlement.organization_id = r.organization_id
              and entitlement.status = 'active'
              and (
                entitlement.starts_at is null
                or entitlement.starts_at <= now()
              )
              and (
                entitlement.expires_at is null
                or entitlement.expires_at > now()
              )
              and (
                entitlement.cohort_id is null
                or exists (
                  select 1
                  from public.cohort_members entitled_membership
                  where entitled_membership.cohort_id = entitlement.cohort_id
                    and entitled_membership.user_id = target_user_id
                    and entitled_membership.membership_status = 'active'
                )
              )
          )
          and (
            (
              exists (
                select 1
                from public.user_roles learner_role
                where learner_role.user_id = target_user_id
                  and learner_role.role = 'learner'
              )
              and exists (
                select 1
                from public.resource_audiences learner_audience
                where learner_audience.resource_id = r.id
                  and learner_audience.audience = 'learner'
              )
            )
            or (
              exists (
                select 1
                from public.user_roles instructor_role
                where instructor_role.user_id = target_user_id
                  and instructor_role.role = 'instructor'
              )
              and exists (
                select 1
                from public.cohort_members instructor_membership
                join public.cohorts instructor_cohort
                  on instructor_cohort.id = instructor_membership.cohort_id
                where instructor_membership.user_id = target_user_id
                  and instructor_membership.member_role = 'instructor'
                  and instructor_membership.membership_status = 'active'
                  and instructor_cohort.course_id = r.course_id
                  and instructor_cohort.status in ('scheduled', 'active')
              )
              and exists (
                select 1
                from public.resource_audiences instructor_audience
                where instructor_audience.resource_id = r.id
                  and instructor_audience.audience in ('learner', 'instructor')
              )
            )
          )
        )
      )
  );
$$;

create or replace function private.can_read_resource(target_resource_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.user_can_read_resource(
    (select auth.uid()),
    target_resource_id
  );
$$;

create function private.can_upload_resource_object(object_name text)
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
      and resource.status in ('draft', 'under_review')
      and resource.current_version_id is distinct from version.id
      and split_part(object_name, '/', 1) = resource.organization_id::text
      and split_part(object_name, '/', 2) = resource.id::text
      and split_part(object_name, '/', 3) = version.id::text
      and array_length(string_to_array(object_name, '/'), 1) = 4
      and private.is_admin_in_organization(resource.organization_id)
  );
$$;

revoke all on function private.user_can_read_resource(uuid, uuid) from public;
revoke all on function private.can_upload_resource_object(text) from public;
grant execute on function private.user_can_read_resource(uuid, uuid)
  to service_role;
grant execute on function private.can_upload_resource_object(text)
  to authenticated, service_role;

create policy course_resources_insert_admin
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'course-resources'
  and private.can_upload_resource_object(name)
);

create function public.authorize_resource_pdf_access(
  target_user_id uuid,
  target_version_id uuid,
  target_request_id uuid
)
returns table (
  organization_id uuid,
  user_id uuid,
  resource_id uuid,
  resource_version_id uuid,
  object_path text,
  expires_in_seconds integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  authorized_organization uuid;
  authorized_resource uuid;
  authorized_path text;
begin
  if target_user_id is null
    or target_version_id is null
    or target_request_id is null then
    raise exception 'RESOURCE_ACCESS_INVALID_REQUEST' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(target_user_id::text, 4242)
  );

  select resource.organization_id, resource.id, version.storage_path
    into authorized_organization, authorized_resource, authorized_path
  from public.resource_versions version
  join public.resources resource on resource.id = version.resource_id
  where version.id = target_version_id
    and version.resource_type = 'pdf'
    and version.status in ('approved', 'published')
    and version.storage_path is not null
    and resource.current_version_id = version.id
    and private.user_can_read_resource(target_user_id, resource.id);

  if authorized_organization is null then
    raise exception 'RESOURCE_ACCESS_DENIED' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.resource_access_events existing
    where existing.user_id = target_user_id
      and existing.resource_version_id = target_version_id
      and existing.request_id = target_request_id
      and existing.action = 'signed_url_authorized'
  ) then
    return query select
      authorized_organization,
      target_user_id,
      authorized_resource,
      target_version_id,
      authorized_path,
      60;
    return;
  end if;

  if (
    select count(*)
    from public.resource_access_events recent
    where recent.user_id = target_user_id
      and recent.action = 'signed_url_authorized'
      and recent.created_at > now() - interval '60 seconds'
  ) >= 10 then
    raise exception 'RESOURCE_ACCESS_RATE_LIMITED' using errcode = 'P0001';
  end if;

  insert into public.resource_access_events (
    organization_id,
    user_id,
    resource_id,
    resource_version_id,
    action,
    request_id,
    metadata
  ) values (
    authorized_organization,
    target_user_id,
    authorized_resource,
    target_version_id,
    'signed_url_authorized',
    target_request_id,
    jsonb_build_object('expires_in_seconds', 60)
  );

  return query select
    authorized_organization,
    target_user_id,
    authorized_resource,
    target_version_id,
    authorized_path,
    60;
end;
$$;

create function public.record_resource_pdf_issuance(
  target_user_id uuid,
  target_version_id uuid,
  target_request_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  authorized_event public.resource_access_events%rowtype;
begin
  select * into authorized_event
  from public.resource_access_events event
  where event.user_id = target_user_id
    and event.resource_version_id = target_version_id
    and event.request_id = target_request_id
    and event.action = 'signed_url_authorized'
    and event.created_at > now() - interval '5 minutes';

  if authorized_event.id is null then
    raise exception 'RESOURCE_ACCESS_AUTHORIZATION_REQUIRED'
      using errcode = 'P0001';
  end if;

  insert into public.resource_access_events (
    organization_id,
    user_id,
    resource_id,
    resource_version_id,
    action,
    request_id,
    metadata
  ) values (
    authorized_event.organization_id,
    authorized_event.user_id,
    authorized_event.resource_id,
    authorized_event.resource_version_id,
    'signed_url_issued',
    authorized_event.request_id,
    jsonb_build_object('expires_in_seconds', 60)
  )
  on conflict (
    user_id,
    resource_version_id,
    request_id,
    action
  ) where action in ('signed_url_authorized', 'signed_url_issued')
  do nothing;
end;
$$;

revoke all on function public.authorize_resource_pdf_access(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.record_resource_pdf_issuance(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.authorize_resource_pdf_access(uuid, uuid, uuid)
  to service_role;
grant execute on function public.record_resource_pdf_issuance(uuid, uuid, uuid)
  to service_role;

comment on function private.user_can_read_resource(uuid, uuid) is
  'Explicit-user resource authorization for trusted service operations; browser policies use the auth-bound wrapper.';
comment on function private.can_upload_resource_object(text) is
  'Allows only an active same-organization administrator to insert the exact path of a matching draft PDF version.';
comment on function public.authorize_resource_pdf_access(uuid, uuid, uuid) is
  'Service-only, rate-limited and idempotent authorization for the current published PDF version.';
comment on function public.record_resource_pdf_issuance(uuid, uuid, uuid) is
  'Service-only idempotent append of successful signed PDF URL issuance without storing the URL.';
