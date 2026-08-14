begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select extensions.plan(40);

select extensions.results_eq(
  $$select count(*) from storage.buckets where id = 'course-resources'$$,
  array[1::bigint], 'private course resource bucket exists'
);
select extensions.results_eq(
  $$select public from storage.buckets where id = 'course-resources'$$,
  array[false], 'course resource bucket is private'
);
select extensions.results_eq(
  $$select file_size_limit from storage.buckets where id = 'course-resources'$$,
  array[20971520::bigint], 'course resource bucket has a 20 MiB limit'
);
select extensions.results_eq(
  $$select allowed_mime_types::text from storage.buckets where id = 'course-resources'$$,
  array['{application/pdf}'::text], 'course resource bucket accepts PDF only'
);
select extensions.results_eq(
  $$select count(*) from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'course_resources_insert_admin' and cmd = 'INSERT'$$,
  array[1::bigint], 'course resource bucket has one administrator insert policy'
);
select extensions.results_eq(
  $$select count(*) from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like 'course_resources_%' and cmd = 'SELECT'$$,
  array[0::bigint], 'course resource bucket has no browser select policy'
);
select extensions.results_eq(
  $$select count(*) from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like 'course_resources_%' and cmd = 'UPDATE'$$,
  array[0::bigint], 'course resource bucket has no browser update policy'
);
select extensions.results_eq(
  $$select count(*) from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like 'course_resources_%' and cmd = 'DELETE'$$,
  array[0::bigint], 'course resource bucket has no browser delete policy'
);

insert into public.organizations (id, name, slug)
values
  ('23000000-0000-0000-0000-000000000001', 'Storage Test One', 'storage-test-one'),
  ('23000000-0000-0000-0000-000000000002', 'Storage Test Two', 'storage-test-two');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('33000000-0000-0000-0000-000000000001', 'storage-learner@example.test', now(), '{"full_name":"Storage Learner"}'),
  ('33000000-0000-0000-0000-000000000002', 'storage-instructor@example.test', now(), '{"full_name":"Storage Instructor"}'),
  ('33000000-0000-0000-0000-000000000003', 'storage-admin@example.test', now(), '{"full_name":"Storage Admin"}'),
  ('33000000-0000-0000-0000-000000000004', 'storage-expired@example.test', now(), '{"full_name":"Expired Storage Learner"}'),
  ('33000000-0000-0000-0000-000000000005', 'storage-suspended@example.test', now(), '{"full_name":"Suspended Storage Learner"}'),
  ('33000000-0000-0000-0000-000000000006', 'storage-other-admin@example.test', now(), '{"full_name":"Other Storage Admin"}');

update public.profiles
set organization_id = '23000000-0000-0000-0000-000000000001',
    account_status = 'active'
where id in (
  '33000000-0000-0000-0000-000000000001',
  '33000000-0000-0000-0000-000000000002',
  '33000000-0000-0000-0000-000000000003',
  '33000000-0000-0000-0000-000000000004'
);
update public.profiles
set organization_id = '23000000-0000-0000-0000-000000000001',
    account_status = 'suspended'
where id = '33000000-0000-0000-0000-000000000005';
update public.profiles
set organization_id = '23000000-0000-0000-0000-000000000002',
    account_status = 'active'
where id = '33000000-0000-0000-0000-000000000006';

insert into public.user_roles (user_id, role)
values
  ('33000000-0000-0000-0000-000000000001', 'learner'),
  ('33000000-0000-0000-0000-000000000002', 'instructor'),
  ('33000000-0000-0000-0000-000000000003', 'admin'),
  ('33000000-0000-0000-0000-000000000004', 'learner'),
  ('33000000-0000-0000-0000-000000000005', 'learner'),
  ('33000000-0000-0000-0000-000000000006', 'admin');

insert into public.courses (id, organization_id, slug, title, status)
values
  ('58000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', 'adult-bls', 'Storage Adult BLS', 'published'),
  ('58000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000002', 'adult-bls', 'Other Storage Adult BLS', 'published');

insert into public.cohorts (
  id, organization_id, course_id, code, name, start_at, end_at, status
)
values (
  '43000000-0000-0000-0000-000000000001',
  '23000000-0000-0000-0000-000000000001',
  '58000000-0000-0000-0000-000000000001',
  'STORAGE-01', 'Storage Test Cohort', now() - interval '1 day',
  now() + interval '1 day', 'active'
);

insert into public.cohort_members (cohort_id, user_id, member_role)
values
  ('43000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000001', 'learner'),
  ('43000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000002', 'instructor'),
  ('43000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000005', 'learner');

insert into public.course_entitlements (
  id, organization_id, user_id, course_id, cohort_id, access_type,
  starts_at, expires_at, status
)
values
  ('59000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000001', '58000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', 'fixed_window', now() - interval '1 day', now() + interval '1 day', 'active'),
  ('59000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000002', '58000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', 'fixed_window', now() - interval '1 day', now() + interval '1 day', 'active'),
  ('59000000-0000-0000-0000-000000000003', '23000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000004', '58000000-0000-0000-0000-000000000001', null, 'fixed_window', now() - interval '2 days', now() - interval '1 day', 'active'),
  ('59000000-0000-0000-0000-000000000004', '23000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000005', '58000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', 'fixed_window', now() - interval '1 day', now() + interval '1 day', 'active');

insert into public.resources (
  id, organization_id, course_id, slug, title, resource_type, status
)
values
  ('60000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', '58000000-0000-0000-0000-000000000001', 'learner-pdf', 'Learner PDF', 'pdf', 'draft'),
  ('60000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000001', '58000000-0000-0000-0000-000000000001', 'instructor-pdf', 'Instructor PDF', 'pdf', 'draft'),
  ('60000000-0000-0000-0000-000000000003', '23000000-0000-0000-0000-000000000001', '58000000-0000-0000-0000-000000000001', 'draft-pdf', 'Draft PDF', 'pdf', 'draft'),
  ('60000000-0000-0000-0000-000000000004', '23000000-0000-0000-0000-000000000002', '58000000-0000-0000-0000-000000000002', 'other-draft-pdf', 'Other Draft PDF', 'pdf', 'draft'),
  ('60000000-0000-0000-0000-000000000005', '23000000-0000-0000-0000-000000000001', '58000000-0000-0000-0000-000000000001', 'learner-guide', 'Learner Guide', 'guide', 'draft');

insert into public.resource_versions (
  id, resource_id, version_number, resource_type, title, summary, content,
  storage_path, reviewed_by, reviewed_at, approved_by, approved_at, status
)
values
  ('61000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 1, 'pdf', 'Learner PDF', 'Learner PDF summary', null, '23000000-0000-0000-0000-000000000001/60000000-0000-0000-0000-000000000001/61000000-0000-0000-0000-000000000001/learner.pdf', '33000000-0000-0000-0000-000000000003', now(), '33000000-0000-0000-0000-000000000003', now(), 'approved'),
  ('61000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', 1, 'pdf', 'Instructor PDF', 'Instructor PDF summary', null, '23000000-0000-0000-0000-000000000001/60000000-0000-0000-0000-000000000002/61000000-0000-0000-0000-000000000002/instructor.pdf', '33000000-0000-0000-0000-000000000003', now(), '33000000-0000-0000-0000-000000000003', now(), 'approved'),
  ('61000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003', 1, 'pdf', 'Draft PDF', 'Draft PDF summary', null, '23000000-0000-0000-0000-000000000001/60000000-0000-0000-0000-000000000003/61000000-0000-0000-0000-000000000003/draft.pdf', null, null, null, null, 'draft'),
  ('61000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000004', 1, 'pdf', 'Other Draft PDF', 'Other Draft PDF summary', null, '23000000-0000-0000-0000-000000000002/60000000-0000-0000-0000-000000000004/61000000-0000-0000-0000-000000000004/other.pdf', null, null, null, null, 'draft'),
  ('61000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000005', 1, 'guide', 'Learner Guide', 'Learner guide summary', '{"body":"test"}', null, '33000000-0000-0000-0000-000000000003', now(), '33000000-0000-0000-0000-000000000003', now(), 'approved');

insert into public.resource_audiences (resource_id, audience)
values
  ('60000000-0000-0000-0000-000000000001', 'learner'),
  ('60000000-0000-0000-0000-000000000002', 'instructor'),
  ('60000000-0000-0000-0000-000000000005', 'learner');

insert into public.bls_topics (id, organization_id, slug, name)
values (
  '62000000-0000-0000-0000-000000000001',
  '23000000-0000-0000-0000-000000000001',
  'storage-topic',
  'Storage Topic'
);

insert into public.resource_topics (resource_id, topic_id)
values
  ('60000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000001'),
  ('60000000-0000-0000-0000-000000000002', '62000000-0000-0000-0000-000000000001'),
  ('60000000-0000-0000-0000-000000000005', '62000000-0000-0000-0000-000000000001');

update public.resources resource
set current_version_id = version.id, status = 'published'
from public.resource_versions version
where version.resource_id = resource.id
  and resource.id in (
    '60000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000005'
  );

set local role anon;
select extensions.results_eq(
  $$select count(*) from storage.objects where bucket_id = 'course-resources'$$,
  array[0::bigint], 'anonymous users cannot list private resource objects'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"33000000-0000-0000-0000-000000000001","role":"authenticated"}';
select extensions.results_eq(
  $$select count(*) from storage.objects where bucket_id = 'course-resources'$$,
  array[0::bigint], 'authenticated learners cannot list private resource objects'
);
select extensions.throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('course-resources', '23000000-0000-0000-0000-000000000001/60000000-0000-0000-0000-000000000003/61000000-0000-0000-0000-000000000003/draft.pdf', '33000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'learner cannot upload a resource object'
);

set local request.jwt.claims =
  '{"sub":"33000000-0000-0000-0000-000000000002","role":"authenticated"}';
select extensions.throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('course-resources', '23000000-0000-0000-0000-000000000001/60000000-0000-0000-0000-000000000003/61000000-0000-0000-0000-000000000003/draft.pdf', '33000000-0000-0000-0000-000000000002')$$,
  '42501', null, 'instructor cannot upload a resource object'
);

set local request.jwt.claims =
  '{"sub":"33000000-0000-0000-0000-000000000003","role":"authenticated"}';
select extensions.lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('course-resources', '23000000-0000-0000-0000-000000000001/60000000-0000-0000-0000-000000000003/61000000-0000-0000-0000-000000000003/draft.pdf', '33000000-0000-0000-0000-000000000003')$$,
  'same-organization administrator can insert the exact draft PDF path'
);
select extensions.results_eq(
  $$select count(*) from storage.objects where bucket_id = 'course-resources'$$,
  array[0::bigint], 'administrator still cannot list private resource objects'
);
select extensions.results_eq(
  $$with changed as (
      update storage.objects set name = name || '.changed'
      where bucket_id = 'course-resources' returning id
    ) select count(*) from changed$$,
  array[0::bigint], 'administrator cannot update private resource objects'
);
select extensions.throws_ok(
  $$delete from storage.objects where bucket_id = 'course-resources'$$,
  '42501', 'Direct deletion from storage tables is not allowed. Use the Storage API instead.',
  'direct SQL deletion is blocked by the protected Storage schema'
);
select extensions.throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('course-resources', 'malformed/draft.pdf', '33000000-0000-0000-0000-000000000003')$$,
  '42501', null, 'administrator cannot insert a malformed path'
);
select extensions.throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('course-resources', '23000000-0000-0000-0000-000000000001/60000000-0000-0000-0000-000000000001/61000000-0000-0000-0000-000000000001/learner.pdf', '33000000-0000-0000-0000-000000000003')$$,
  '42501', null, 'administrator cannot insert an approved current version path'
);

set local request.jwt.claims =
  '{"sub":"33000000-0000-0000-0000-000000000006","role":"authenticated"}';
select extensions.throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('course-resources', '23000000-0000-0000-0000-000000000001/60000000-0000-0000-0000-000000000003/61000000-0000-0000-0000-000000000003/draft.pdf', '33000000-0000-0000-0000-000000000006')$$,
  '42501', null, 'other-organization administrator cannot insert the path'
);

set local request.jwt.claims =
  '{"sub":"33000000-0000-0000-0000-000000000001","role":"authenticated"}';
select extensions.throws_ok(
  $$select * from public.authorize_resource_pdf_access(
      '33000000-0000-0000-0000-000000000001',
      '61000000-0000-0000-0000-000000000001',
      '63000000-0000-0000-0000-000000000001'
    )$$,
  '42501', null, 'browser role cannot call service-only authorization function'
);
select extensions.throws_ok(
  $$select public.record_resource_pdf_issuance(
      '33000000-0000-0000-0000-000000000001',
      '61000000-0000-0000-0000-000000000001',
      '63000000-0000-0000-0000-000000000001'
    )$$,
  '42501', null, 'browser role cannot call service-only issuance function'
);

set local role service_role;
select extensions.results_eq(
  $$select object_path from public.authorize_resource_pdf_access(
      '33000000-0000-0000-0000-000000000001',
      '61000000-0000-0000-0000-000000000001',
      '63000000-0000-0000-0000-000000000001'
    )$$,
  array['23000000-0000-0000-0000-000000000001/60000000-0000-0000-0000-000000000001/61000000-0000-0000-0000-000000000001/learner.pdf'],
  'entitled learner receives only the authorized PDF path'
);
select extensions.results_eq(
  $$select count(*) from public.authorize_resource_pdf_access(
      '33000000-0000-0000-0000-000000000002',
      '61000000-0000-0000-0000-000000000001',
      '63000000-0000-0000-0000-000000000002'
    )$$,
  array[1::bigint], 'assigned instructor can access learner-audience PDF'
);
select extensions.results_eq(
  $$select count(*) from public.authorize_resource_pdf_access(
      '33000000-0000-0000-0000-000000000003',
      '61000000-0000-0000-0000-000000000001',
      '63000000-0000-0000-0000-000000000003'
    )$$,
  array[1::bigint], 'same-organization administrator can access current PDF'
);
select extensions.throws_ok(
  $$select * from public.authorize_resource_pdf_access(
      '33000000-0000-0000-0000-000000000004',
      '61000000-0000-0000-0000-000000000001',
      '63000000-0000-0000-0000-000000000004'
    )$$,
  'P0001', 'RESOURCE_ACCESS_DENIED', 'expired entitlement is denied'
);
select extensions.throws_ok(
  $$select * from public.authorize_resource_pdf_access(
      '33000000-0000-0000-0000-000000000005',
      '61000000-0000-0000-0000-000000000001',
      '63000000-0000-0000-0000-000000000005'
    )$$,
  'P0001', 'RESOURCE_ACCESS_DENIED', 'suspended learner is denied'
);
select extensions.throws_ok(
  $$select * from public.authorize_resource_pdf_access(
      '33000000-0000-0000-0000-000000000001',
      '61000000-0000-0000-0000-000000000002',
      '63000000-0000-0000-0000-000000000006'
    )$$,
  'P0001', 'RESOURCE_ACCESS_DENIED', 'learner is denied instructor-only PDF'
);
select extensions.throws_ok(
  $$select * from public.authorize_resource_pdf_access(
      '33000000-0000-0000-0000-000000000006',
      '61000000-0000-0000-0000-000000000001',
      '63000000-0000-0000-0000-000000000007'
    )$$,
  'P0001', 'RESOURCE_ACCESS_DENIED', 'other-organization administrator is denied'
);
select extensions.throws_ok(
  $$select * from public.authorize_resource_pdf_access(
      '33000000-0000-0000-0000-000000000003',
      '61000000-0000-0000-0000-000000000003',
      '63000000-0000-0000-0000-000000000008'
    )$$,
  'P0001', 'RESOURCE_ACCESS_DENIED', 'non-current draft PDF is denied'
);
select extensions.throws_ok(
  $$select * from public.authorize_resource_pdf_access(
      '33000000-0000-0000-0000-000000000003',
      '61000000-0000-0000-0000-000000000005',
      '63000000-0000-0000-0000-000000000009'
    )$$,
  'P0001', 'RESOURCE_ACCESS_DENIED', 'non-PDF version is denied'
);
select extensions.lives_ok(
  $$select * from public.authorize_resource_pdf_access(
      '33000000-0000-0000-0000-000000000001',
      '61000000-0000-0000-0000-000000000001',
      '63000000-0000-0000-0000-000000000001'
    )$$,
  'duplicate authorization request is idempotent'
);
select extensions.results_eq(
  $$select count(*) from public.resource_access_events
    where user_id = '33000000-0000-0000-0000-000000000001'
      and request_id = '63000000-0000-0000-0000-000000000001'
      and action = 'signed_url_authorized'$$,
  array[1::bigint], 'idempotent authorization creates one event'
);
select extensions.lives_ok(
  $$select public.record_resource_pdf_issuance(
      '33000000-0000-0000-0000-000000000001',
      '61000000-0000-0000-0000-000000000001',
      '63000000-0000-0000-0000-000000000001'
    )$$,
  'service can record successful signed URL issuance'
);
select extensions.lives_ok(
  $$select public.record_resource_pdf_issuance(
      '33000000-0000-0000-0000-000000000001',
      '61000000-0000-0000-0000-000000000001',
      '63000000-0000-0000-0000-000000000001'
    )$$,
  'duplicate issuance recording is idempotent'
);
select extensions.results_eq(
  $$select count(*) from public.resource_access_events
    where user_id = '33000000-0000-0000-0000-000000000001'
      and request_id = '63000000-0000-0000-0000-000000000001'
      and action = 'signed_url_issued'$$,
  array[1::bigint], 'idempotent issuance creates one event'
);
select extensions.results_eq(
  $$select count(*) from public.resource_access_events
    where action = 'signed_url_authorized'
      and (metadata ? 'signed_url' or metadata ? 'token' or metadata ? 'url')$$,
  array[0::bigint], 'authorization events contain no signed URL or token'
);
select extensions.results_eq(
  $$select count(*) from public.resource_access_events
    where action = 'signed_url_issued'
      and (metadata ? 'signed_url' or metadata ? 'token' or metadata ? 'url')$$,
  array[0::bigint], 'issuance events contain no signed URL or token'
);
select extensions.lives_ok(
  $test$do $block$
    declare request_number integer;
    begin
      for request_number in 10..18 loop
        perform * from public.authorize_resource_pdf_access(
          '33000000-0000-0000-0000-000000000001',
          '61000000-0000-0000-0000-000000000001',
          ('63000000-0000-0000-0000-' || lpad(request_number::text, 12, '0'))::uuid
        );
      end loop;
    end
  $block$;$test$,
  'first ten learner authorizations inside a minute are allowed'
);
select extensions.throws_ok(
  $$select * from public.authorize_resource_pdf_access(
      '33000000-0000-0000-0000-000000000001',
      '61000000-0000-0000-0000-000000000001',
      '63000000-0000-0000-0000-000000000019'
    )$$,
  'P0001', 'RESOURCE_ACCESS_RATE_LIMITED',
  'eleventh learner authorization inside a minute is rate limited'
);

set local role postgres;
select extensions.results_eq(
  $$select count(*) from storage.objects
    where bucket_id = 'course-resources'
      and name = '23000000-0000-0000-0000-000000000001/60000000-0000-0000-0000-000000000003/61000000-0000-0000-0000-000000000003/draft.pdf'$$,
  array[1::bigint], 'successful administrator insert created one object record'
);

select * from extensions.finish();
rollback;
