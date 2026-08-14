-- A Storage row alone is not sufficient review evidence. Confirm the object
-- was stored as a non-empty PDF within the bucket's 20 MiB limit.
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
      and lower(coalesce(object.metadata ->> 'mimetype', '')) = 'application/pdf'
      and coalesce(object.metadata ->> 'size', '') ~ '^[0-9]+$'
      and (object.metadata ->> 'size')::bigint between 1 and 20971520
  );
$$;

revoke all on function private.resource_pdf_object_exists(text)
  from public, anon, authenticated, service_role;

comment on function private.resource_pdf_object_exists(text) is
  'Confirms an exact private PDF object has valid MIME and non-empty size metadata within the 20 MiB bucket limit.';
