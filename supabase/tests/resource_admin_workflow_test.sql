begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select extensions.plan(34);

select extensions.has_function(
  'public', 'create_resource_version_draft',
  array['uuid', 'text', 'text', 'jsonb', 'text', 'text', 'integer'],
  'administrator draft-version function exists'
);
select extensions.has_function(
  'public', 'replace_resource_classifications',
  array['uuid', 'resource_audience[]', 'uuid[]', 'uuid[]'],
  'atomic classification function exists'
);
select extensions.has_function(
  'public', 'approve_resource_version', array['uuid'],
  'version approval function exists'
);
select extensions.results_eq(
  $$select has_function_privilege(
    'anon',
    'public.create_resource_version_draft(uuid,text,text,jsonb,text,text,integer)',
    'EXECUTE'
  )$$,
  array[false], 'anonymous users cannot execute the draft-version function'
);
select extensions.results_eq(
  $$select has_function_privilege(
    'authenticated',
    'public.create_resource_version_draft(uuid,text,text,jsonb,text,text,integer)',
    'EXECUTE'
  )$$,
  array[true], 'authenticated callers can reach the guarded function'
);
select extensions.results_eq(
  $$select count(*) from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'course_resources_delete_admin' and cmd = 'DELETE'$$,
  array[1::bigint], 'private Storage has one draft cleanup policy'
);

insert into storage.objects (bucket_id, name, metadata)
values (
  'course-resources', 'invalid-workflow-object.pdf',
  '{"mimetype":"text/plain","size":128}'::jsonb
);
select extensions.is(
  private.resource_pdf_object_exists('invalid-workflow-object.pdf'), false,
  'review readiness rejects an object with invalid PDF metadata'
);

insert into public.organizations (id, name, slug)
values
  ('24000000-0000-0000-0000-000000000001', 'Workflow Test One', 'workflow-test-one'),
  ('24000000-0000-0000-0000-000000000002', 'Workflow Test Two', 'workflow-test-two');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('34000000-0000-0000-0000-000000000001', 'workflow-learner@example.test', now(), '{"full_name":"Workflow Learner"}'),
  ('34000000-0000-0000-0000-000000000002', 'workflow-admin@example.test', now(), '{"full_name":"Workflow Admin"}'),
  ('34000000-0000-0000-0000-000000000003', 'workflow-other-admin@example.test', now(), '{"full_name":"Other Workflow Admin"}');

update public.profiles
set organization_id = '24000000-0000-0000-0000-000000000001',
    account_status = 'active'
where id in (
  '34000000-0000-0000-0000-000000000001',
  '34000000-0000-0000-0000-000000000002'
);
update public.profiles
set organization_id = '24000000-0000-0000-0000-000000000002',
    account_status = 'active'
where id = '34000000-0000-0000-0000-000000000003';

insert into public.user_roles (user_id, role)
values
  ('34000000-0000-0000-0000-000000000001', 'learner'),
  ('34000000-0000-0000-0000-000000000002', 'admin'),
  ('34000000-0000-0000-0000-000000000003', 'admin');

insert into public.courses (id, organization_id, slug, title, status)
values
  ('64000000-0000-0000-0000-000000000001', '24000000-0000-0000-0000-000000000001', 'adult-bls', 'Workflow Adult BLS', 'published'),
  ('64000000-0000-0000-0000-000000000002', '24000000-0000-0000-0000-000000000002', 'adult-bls', 'Other Workflow BLS', 'published');

insert into public.bls_topics (id, organization_id, slug, name)
values (
  '65000000-0000-0000-0000-000000000001',
  '24000000-0000-0000-0000-000000000001',
  'workflow-cpr', 'Workflow CPR'
);
insert into public.teaching_stages (id, organization_id, slug, name)
values (
  '66000000-0000-0000-0000-000000000001',
  '24000000-0000-0000-0000-000000000001',
  'workflow-practice', 'Workflow practice'
);

insert into public.resources (
  id, organization_id, course_id, slug, title, resource_type, status
)
values
  ('67000000-0000-0000-0000-000000000001', '24000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000001', 'workflow-guide', 'Workflow guide', 'guide', 'draft'),
  ('67000000-0000-0000-0000-000000000002', '24000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000001', 'workflow-pdf', 'Workflow PDF', 'pdf', 'draft'),
  ('67000000-0000-0000-0000-000000000003', '24000000-0000-0000-0000-000000000002', '64000000-0000-0000-0000-000000000002', 'other-workflow-guide', 'Other workflow guide', 'guide', 'draft');

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"34000000-0000-0000-0000-000000000001","role":"authenticated"}';
select extensions.throws_ok(
  $$select * from public.create_resource_version_draft(
    '67000000-0000-0000-0000-000000000001', 'Learner draft',
    'Learners must not create versions', '{"body":"blocked"}'::jsonb,
    null, 'AHA', 2025
  )$$,
  '42501', null, 'learner cannot create resource versions'
);

set local request.jwt.claims =
  '{"sub":"34000000-0000-0000-0000-000000000003","role":"authenticated"}';
select extensions.throws_ok(
  $$select * from public.create_resource_version_draft(
    '67000000-0000-0000-0000-000000000001', 'Cross-org draft',
    'Other administrators must be denied', '{"body":"blocked"}'::jsonb,
    null, 'AHA', 2025
  )$$,
  '42501', null, 'other-organization administrator cannot create a version'
);

set local request.jwt.claims =
  '{"sub":"34000000-0000-0000-0000-000000000002","role":"authenticated"}';
select extensions.results_eq(
  $$select version_number from public.create_resource_version_draft(
    '67000000-0000-0000-0000-000000000001', 'Workflow guide v1',
    'First controlled guide version', '{"body":"CPR steps"}'::jsonb,
    null, 'AHA Guidelines', 2025
  )$$,
  array[1], 'administrator creates the first gapless version'
);
select extensions.results_eq(
  $$select count(*) from public.resource_versions
    where resource_id = '67000000-0000-0000-0000-000000000001'
      and status = 'draft'$$,
  array[1::bigint], 'draft version is persisted'
);
select extensions.throws_ok(
  $$insert into public.resource_versions (
      resource_id, version_number, resource_type, title, summary, content
    ) values (
      '67000000-0000-0000-0000-000000000001', 2, 'guide',
      'Direct version', 'Direct writes are blocked', '{"body":"blocked"}'
    )$$,
  '42501', null, 'direct browser inserts cannot bypass version allocation'
);
select extensions.throws_ok(
  $$update public.resource_versions set status = 'approved'
    where resource_id = '67000000-0000-0000-0000-000000000001'$$,
  '42501', null, 'direct lifecycle updates are denied'
);

select extensions.lives_ok(
  $$select public.replace_resource_classifications(
    '67000000-0000-0000-0000-000000000001',
    array['learner','learner']::public.resource_audience[],
    array[
      '65000000-0000-0000-0000-000000000001',
      '65000000-0000-0000-0000-000000000001'
    ]::uuid[],
    array[]::uuid[]
  )$$,
  'classification replacement accepts and de-duplicates selections'
);
select extensions.results_eq(
  $$select count(*) from public.resource_audiences
    where resource_id = '67000000-0000-0000-0000-000000000001'$$,
  array[1::bigint], 'audience duplicates are removed'
);
select extensions.results_eq(
  $$select count(*) from public.resource_topics
    where resource_id = '67000000-0000-0000-0000-000000000001'$$,
  array[1::bigint], 'topic duplicates are removed'
);

select extensions.results_eq(
  $$select version_number from public.create_resource_version_draft(
    '67000000-0000-0000-0000-000000000002', 'Workflow PDF v1',
    'Private PDF workflow version', null, null, 'AHA Guidelines', 2025
  )$$,
  array[1], 'administrator creates a PDF draft'
);
select extensions.matches(
  (select storage_path from public.resource_versions
   where resource_id = '67000000-0000-0000-0000-000000000002'),
  '^24000000-0000-0000-0000-000000000001/67000000-0000-0000-0000-000000000002/[0-9a-f-]{36}/[0-9a-f-]{36}[.]pdf$',
  'PDF draft receives an exact immutable object path'
);
select extensions.results_eq(
  $$select file_state from public.get_resource_pdf_file_status(
    (select id from public.resource_versions
     where resource_id = '67000000-0000-0000-0000-000000000002')
  )$$,
  array['missing'], 'PDF status reports a missing private object'
);
select extensions.throws_ok(
  $$select public.submit_resource_version_for_review(
    (select id from public.resource_versions
     where resource_id = '67000000-0000-0000-0000-000000000002')
  )$$,
  '23514', 'The private PDF must be uploaded before review',
  'a missing private PDF cannot enter review'
);
select extensions.lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id, metadata)
    select 'course-resources', storage_path,
      '34000000-0000-0000-0000-000000000002',
      '{"mimetype":"application/pdf","size":1024}'::jsonb
    from public.resource_versions
    where resource_id = '67000000-0000-0000-0000-000000000002'$$,
  'administrator uploads only the server-allocated draft path'
);
select extensions.results_eq(
  $$select file_state from public.get_resource_pdf_file_status(
    (select id from public.resource_versions
     where resource_id = '67000000-0000-0000-0000-000000000002')
  )$$,
  array['ready'], 'PDF status reports the uploaded private object'
);
select extensions.lives_ok(
  $$select public.submit_resource_version_for_review(
    (select id from public.resource_versions
     where resource_id = '67000000-0000-0000-0000-000000000002')
  )$$,
  'uploaded PDF can enter review'
);
select extensions.throws_ok(
  $$update public.resource_versions set title = 'Changed during review'
    where resource_id = '67000000-0000-0000-0000-000000000002'$$,
  '23514', 'Content under review cannot be edited',
  'content under review is immutable'
);
select extensions.lives_ok(
  $$select public.record_resource_version_review(
    (select id from public.resource_versions
     where resource_id = '67000000-0000-0000-0000-000000000002'),
    now() + interval '1 year'
  )$$,
  'administrator records review evidence with a future date'
);
select extensions.lives_ok(
  $$select public.approve_resource_version(
    (select id from public.resource_versions
     where resource_id = '67000000-0000-0000-0000-000000000002')
  )$$,
  'reviewed PDF can be approved'
);
select extensions.throws_ok(
  $$select public.publish_resource_version(
    '67000000-0000-0000-0000-000000000002',
    (select id from public.resource_versions
     where resource_id = '67000000-0000-0000-0000-000000000002')
  )$$,
  '23514', 'Published resources require an audience and topic',
  'publication requires classifications'
);
select extensions.lives_ok(
  $$select public.replace_resource_classifications(
    '67000000-0000-0000-0000-000000000002',
    array['instructor']::public.resource_audience[],
    array['65000000-0000-0000-0000-000000000001']::uuid[],
    array['66000000-0000-0000-0000-000000000001']::uuid[]
  )$$,
  'administrator assigns publication classifications'
);
select extensions.lives_ok(
  $$select public.publish_resource_version(
    '67000000-0000-0000-0000-000000000002',
    (select id from public.resource_versions
     where resource_id = '67000000-0000-0000-0000-000000000002')
  )$$,
  'approved classified PDF can be published'
);
select extensions.results_eq(
  $$select status::text from public.resources
    where id = '67000000-0000-0000-0000-000000000002'$$,
  array['published'], 'publication updates the resource lifecycle'
);
select extensions.results_eq(
  $$select version_number from public.create_resource_version_draft(
    '67000000-0000-0000-0000-000000000002', 'Workflow PDF v2',
    'Replacement PDF draft', null, null, 'AHA Guidelines', 2025
  )$$,
  array[2], 'published resource accepts a gapless replacement draft'
);
select extensions.lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id, metadata)
    select 'course-resources', storage_path,
      '34000000-0000-0000-0000-000000000002',
      '{"mimetype":"application/pdf","size":1024}'::jsonb
    from public.resource_versions
    where resource_id = '67000000-0000-0000-0000-000000000002'
      and version_number = 2$$,
  'published resource accepts an exact-path replacement PDF upload'
);
select extensions.lives_ok(
  $$select public.retire_resource(
    '67000000-0000-0000-0000-000000000002'
  )$$,
  'published resource can be retired'
);
select extensions.results_eq(
  $$select count(*) from public.audit_events
    where organization_id = '24000000-0000-0000-0000-000000000001'
      and action in (
        'resource.version_created', 'resource.version_submitted',
        'resource.version_reviewed', 'resource.version_approved',
        'resource.published', 'resource.retired'
      )$$,
  array[8::bigint], 'resource lifecycle writes produce auditable events'
);

select * from extensions.finish();
rollback;
