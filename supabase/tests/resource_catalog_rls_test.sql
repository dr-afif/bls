begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select extensions.plan(31);

select extensions.has_table('public', 'courses', 'courses table exists');
select extensions.has_table('public', 'course_entitlements', 'course entitlements table exists');
select extensions.has_table('public', 'resources', 'resources table exists');
select extensions.has_table('public', 'resource_versions', 'resource versions table exists');
select extensions.has_table('public', 'bls_topics', 'BLS topics table exists');
select extensions.has_table('public', 'teaching_stages', 'teaching stages table exists');
select extensions.has_table('public', 'resource_audiences', 'resource audiences table exists');
select extensions.has_table('public', 'resource_topics', 'resource topics table exists');
select extensions.has_table('public', 'resource_access_events', 'resource access events table exists');

insert into public.organizations (id, name, slug)
values
  ('22000000-0000-0000-0000-000000000001', 'Resource Test One', 'resource-test-one'),
  ('22000000-0000-0000-0000-000000000002', 'Resource Test Two', 'resource-test-two');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('32000000-0000-0000-0000-000000000001', 'resource-learner@example.test', now(), '{"full_name":"Resource Learner"}'),
  ('32000000-0000-0000-0000-000000000002', 'resource-instructor@example.test', now(), '{"full_name":"Resource Instructor"}'),
  ('32000000-0000-0000-0000-000000000003', 'resource-admin@example.test', now(), '{"full_name":"Resource Admin"}'),
  ('32000000-0000-0000-0000-000000000004', 'resource-expired@example.test', now(), '{"full_name":"Expired Learner"}'),
  ('32000000-0000-0000-0000-000000000005', 'resource-other-admin@example.test', now(), '{"full_name":"Other Admin"}');

update public.profiles
set organization_id = '22000000-0000-0000-0000-000000000001',
    account_status = 'active'
where id in (
  '32000000-0000-0000-0000-000000000001',
  '32000000-0000-0000-0000-000000000002',
  '32000000-0000-0000-0000-000000000003',
  '32000000-0000-0000-0000-000000000004'
);
update public.profiles
set organization_id = '22000000-0000-0000-0000-000000000002',
    account_status = 'active'
where id = '32000000-0000-0000-0000-000000000005';

insert into public.user_roles (user_id, role)
values
  ('32000000-0000-0000-0000-000000000001', 'learner'),
  ('32000000-0000-0000-0000-000000000002', 'instructor'),
  ('32000000-0000-0000-0000-000000000003', 'admin'),
  ('32000000-0000-0000-0000-000000000004', 'learner'),
  ('32000000-0000-0000-0000-000000000005', 'admin');

insert into public.courses (id, organization_id, slug, title, status)
values
  ('52000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'adult-bls', 'Adult BLS One', 'published'),
  ('52000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', 'adult-bls', 'Adult BLS Two', 'published');

insert into public.cohorts (
  id, organization_id, course_id, code, name, start_at, end_at, status
)
values (
  '42000000-0000-0000-0000-000000000001',
  '22000000-0000-0000-0000-000000000001',
  '52000000-0000-0000-0000-000000000001',
  'RESOURCE-01', 'Resource Test Cohort', now() - interval '1 day',
  now() + interval '1 day', 'active'
);

insert into public.cohort_members (cohort_id, user_id, member_role)
values
  ('42000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', 'learner'),
  ('42000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000002', 'instructor');

insert into public.course_entitlements (
  id, organization_id, user_id, course_id, cohort_id, access_type,
  starts_at, expires_at, status
)
values
  ('57000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000001', 'fixed_window', now() - interval '1 day', now() + interval '1 day', 'active'),
  ('57000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000002', '52000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000001', 'fixed_window', now() - interval '1 day', now() + interval '1 day', 'active'),
  ('57000000-0000-0000-0000-000000000003', '22000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000004', '52000000-0000-0000-0000-000000000001', null, 'fixed_window', now() - interval '2 days', now() - interval '1 day', 'active');

insert into public.bls_topics (id, organization_id, slug, name)
values (
  '55000000-0000-0000-0000-000000000001',
  '22000000-0000-0000-0000-000000000001',
  'cpr', 'CPR'
);
insert into public.teaching_stages (id, organization_id, slug, name)
values (
  '56000000-0000-0000-0000-000000000001',
  '22000000-0000-0000-0000-000000000001',
  'practice', 'Practice'
);

insert into public.resources (
  id, organization_id, course_id, slug, title, resource_type, status,
  available_until
)
values
  ('53000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-000000000001', 'learner-guide', 'Learner guide', 'guide', 'draft', null),
  ('53000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-000000000001', 'instructor-guide', 'Instructor guide', 'guide', 'draft', null),
  ('53000000-0000-0000-0000-000000000003', '22000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-000000000001', 'expired-guide', 'Expired guide', 'guide', 'draft', now() - interval '1 hour'),
  ('53000000-0000-0000-0000-000000000004', '22000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-000000000001', 'publish-candidate', 'Publish candidate', 'guide', 'draft', null);

insert into public.resource_versions (
  id, resource_id, version_number, resource_type, title, summary, content,
  reviewed_by, reviewed_at, approved_by, approved_at, status
)
values
  ('54000000-0000-0000-0000-000000000001', '53000000-0000-0000-0000-000000000001', 1, 'guide', 'Learner guide', 'Learner summary', '{"body":"learner"}', '32000000-0000-0000-0000-000000000003', now(), '32000000-0000-0000-0000-000000000003', now(), 'approved'),
  ('54000000-0000-0000-0000-000000000002', '53000000-0000-0000-0000-000000000002', 1, 'guide', 'Instructor guide', 'Instructor summary', '{"body":"instructor"}', '32000000-0000-0000-0000-000000000003', now(), '32000000-0000-0000-0000-000000000003', now(), 'approved'),
  ('54000000-0000-0000-0000-000000000003', '53000000-0000-0000-0000-000000000003', 1, 'guide', 'Expired guide', 'Expired summary', '{"body":"expired"}', '32000000-0000-0000-0000-000000000003', now(), '32000000-0000-0000-0000-000000000003', now(), 'approved'),
  ('54000000-0000-0000-0000-000000000004', '53000000-0000-0000-0000-000000000004', 1, 'guide', 'Publish candidate', 'Candidate summary', '{"body":"candidate"}', '32000000-0000-0000-0000-000000000003', now(), '32000000-0000-0000-0000-000000000003', now(), 'approved');

insert into public.resource_audiences (resource_id, audience)
values
  ('53000000-0000-0000-0000-000000000001', 'learner'),
  ('53000000-0000-0000-0000-000000000002', 'instructor'),
  ('53000000-0000-0000-0000-000000000003', 'learner'),
  ('53000000-0000-0000-0000-000000000004', 'learner');
insert into public.resource_topics (resource_id, topic_id)
values
  ('53000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000001'),
  ('53000000-0000-0000-0000-000000000002', '55000000-0000-0000-0000-000000000001'),
  ('53000000-0000-0000-0000-000000000003', '55000000-0000-0000-0000-000000000001'),
  ('53000000-0000-0000-0000-000000000004', '55000000-0000-0000-0000-000000000001');

update public.resources resource
set current_version_id = version.id, status = 'published'
from public.resource_versions version
where version.resource_id = resource.id
  and resource.id <> '53000000-0000-0000-0000-000000000004';

set local role anon;
select extensions.throws_ok(
  $$select count(*) from public.resources$$, '42501', null,
  'anonymous users cannot read resource metadata'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"32000000-0000-0000-0000-000000000001","role":"authenticated"}';
select extensions.results_eq(
  'select count(*) from public.resources', array[1::bigint],
  'learner sees only available published learner resources'
);
select extensions.results_eq(
  'select count(*) from public.resource_versions', array[1::bigint],
  'learner sees only current versions of readable resources'
);
select extensions.results_eq(
  'select count(*) from public.resource_audiences', array[1::bigint],
  'learner sees classifications only for readable resources'
);
select extensions.throws_ok(
  $$insert into public.resources (
      organization_id, course_id, slug, title, resource_type
    ) values (
      '22000000-0000-0000-0000-000000000001',
      '52000000-0000-0000-0000-000000000001',
      'learner-write', 'Learner write', 'guide'
    )$$,
  '42501', null, 'learner cannot create resources'
);
select extensions.throws_ok(
  $$select public.publish_resource_version(
      '53000000-0000-0000-0000-000000000004',
      '54000000-0000-0000-0000-000000000004'
    )$$,
  '42501', null, 'learner cannot publish resource versions'
);
select extensions.results_eq(
  'select count(*) from public.course_entitlements', array[1::bigint],
  'learner sees only their own entitlement'
);
select extensions.results_eq(
  'select count(*) from public.courses', array[1::bigint],
  'learner sees the course covered by their effective entitlement'
);

set local request.jwt.claims =
  '{"sub":"32000000-0000-0000-0000-000000000004","role":"authenticated"}';
select extensions.results_eq(
  'select count(*) from public.resources', array[0::bigint],
  'expired entitlement cannot read resources'
);

set local request.jwt.claims =
  '{"sub":"32000000-0000-0000-0000-000000000002","role":"authenticated"}';
select extensions.results_eq(
  'select count(*) from public.resources', array[2::bigint],
  'assigned instructor sees learner and instructor resources'
);
select extensions.results_eq(
  'select count(*) from public.resource_versions', array[2::bigint],
  'assigned instructor sees current versions for readable resources'
);

set local request.jwt.claims =
  '{"sub":"32000000-0000-0000-0000-000000000003","role":"authenticated"}';
select extensions.results_eq(
  'select count(*) from public.resources', array[4::bigint],
  'administrator sees all resources in their organization'
);
select extensions.results_eq(
  'select count(*) from public.course_entitlements', array[3::bigint],
  'administrator sees entitlements in their organization'
);
select extensions.throws_ok(
  $$select count(*) from public.resource_access_events$$,
  '42501', null, 'browser administrators cannot read raw access events directly'
);
select extensions.lives_ok(
  $$select public.publish_resource_version(
      '53000000-0000-0000-0000-000000000004',
      '54000000-0000-0000-0000-000000000004'
    )$$,
  'administrator can publish an approved classified resource version'
);
select extensions.results_eq(
  $$select status::text from public.resources
    where id = '53000000-0000-0000-0000-000000000004'$$,
  array['published'::text], 'publication sets the resource status'
);
select extensions.results_eq(
  $$select count(*) from public.audit_events
    where action = 'resource.published'
      and entity_id = '53000000-0000-0000-0000-000000000004'$$,
  array[1::bigint], 'publication creates an audit event'
);
select extensions.throws_ok(
  $$update public.resource_versions set title = 'Tampered title'
    where id = '54000000-0000-0000-0000-000000000001'$$,
  '23514', null, 'approved resource versions are immutable'
);
select extensions.throws_ok(
  $$insert into public.resources (
      organization_id, course_id, slug, title, resource_type,
      created_by, updated_by
    ) values (
      '22000000-0000-0000-0000-000000000002',
      '52000000-0000-0000-0000-000000000002',
      'cross-organization', 'Cross organization', 'guide',
      '32000000-0000-0000-0000-000000000003',
      '32000000-0000-0000-0000-000000000003'
    )$$,
  '42501', null, 'administrator cannot create resources in another organization'
);
select extensions.throws_ok(
  $$insert into public.course_entitlements (
      organization_id, user_id, course_id, access_type, status, granted_by
    ) values (
      '22000000-0000-0000-0000-000000000001',
      '32000000-0000-0000-0000-000000000005',
      '52000000-0000-0000-0000-000000000001', 'permanent', 'active',
      '32000000-0000-0000-0000-000000000003'
    )$$,
  '23514', null, 'cross-organization entitlements are rejected'
);
select extensions.throws_ok(
  $$insert into public.resource_access_events (
      organization_id, user_id, resource_id, resource_version_id, action
    ) values (
      '22000000-0000-0000-0000-000000000001',
      '32000000-0000-0000-0000-000000000001',
      '53000000-0000-0000-0000-000000000001',
      '54000000-0000-0000-0000-000000000001', 'opened'
    )$$,
  '42501', null, 'browser roles cannot insert resource access events directly'
);

set local request.jwt.claims =
  '{"sub":"32000000-0000-0000-0000-000000000005","role":"authenticated"}';
select extensions.results_eq(
  'select count(*) from public.resources', array[0::bigint],
  'administrator cannot see another organization resources'
);

select * from extensions.finish();
rollback;
