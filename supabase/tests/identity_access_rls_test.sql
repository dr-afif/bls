begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select extensions.plan(15);

select extensions.has_table('public', 'profiles', 'profiles table exists');
select extensions.has_table('public', 'user_roles', 'user_roles table exists');
select extensions.has_table('public', 'cohorts', 'cohorts table exists');
select extensions.has_table('public', 'cohort_members', 'cohort_members table exists');
select extensions.has_table('public', 'audit_events', 'audit_events table exists');

insert into public.organizations (id, name, slug)
values
  ('20000000-0000-0000-0000-000000000001', 'Organisation One', 'organisation-one'),
  ('20000000-0000-0000-0000-000000000002', 'Organisation Two', 'organisation-two');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('30000000-0000-0000-0000-000000000001', 'learner-one@example.test', now(), '{"full_name":"Learner One"}'),
  ('30000000-0000-0000-0000-000000000002', 'learner-two@example.test', now(), '{"full_name":"Learner Two"}'),
  ('30000000-0000-0000-0000-000000000003', 'instructor@example.test', now(), '{"full_name":"Instructor One"}'),
  ('30000000-0000-0000-0000-000000000004', 'admin-one@example.test', now(), '{"full_name":"Admin One"}'),
  ('30000000-0000-0000-0000-000000000005', 'admin-two@example.test', now(), '{"full_name":"Admin Two"}');

update public.profiles
set organization_id = '20000000-0000-0000-0000-000000000001', account_status = 'active'
where id in (
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000004'
);

update public.profiles
set organization_id = '20000000-0000-0000-0000-000000000002', account_status = 'active'
where id = '30000000-0000-0000-0000-000000000005';

insert into public.user_roles (user_id, role)
values
  ('30000000-0000-0000-0000-000000000001', 'learner'),
  ('30000000-0000-0000-0000-000000000002', 'learner'),
  ('30000000-0000-0000-0000-000000000003', 'instructor'),
  ('30000000-0000-0000-0000-000000000004', 'admin'),
  ('30000000-0000-0000-0000-000000000005', 'admin');

insert into public.cohorts (id, organization_id, name, start_at, end_at, status)
values (
  '40000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Test Cohort', now(), now() + interval '8 hours', 'active'
);

insert into public.cohort_members (cohort_id, user_id, member_role)
values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'learner'),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'instructor');

insert into public.audit_events (actor_user_id, action, entity_type, organization_id)
values (
  '30000000-0000-0000-0000-000000000004', 'test.event', 'test',
  '20000000-0000-0000-0000-000000000001'
);

set local role anon;

select extensions.throws_ok(
  $$select count(*) from public.profiles$$,
  '42501', null,
  'anonymous users cannot read profiles'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}';

select extensions.results_eq(
  'select count(*) from public.profiles', array[1::bigint],
  'learner sees only their own profile'
);
select extensions.results_eq(
  'select count(*) from public.cohort_members', array[1::bigint],
  'learner sees only their own cohort membership'
);
select extensions.results_eq(
  'select count(*) from public.audit_events', array[0::bigint],
  'learner cannot read audit events'
);
select extensions.throws_ok(
  $$update public.profiles set account_status = 'active' where id = '30000000-0000-0000-0000-000000000001'$$,
  '42501', null,
  'learner cannot update protected account-status column'
);

set local request.jwt.claims =
  '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated"}';

select extensions.results_eq(
  'select count(*) from public.profiles', array[2::bigint],
  'instructor sees self and learner in assigned cohort'
);
select extensions.results_eq(
  'select count(*) from public.cohort_members', array[2::bigint],
  'instructor sees assigned cohort members'
);

set local request.jwt.claims =
  '{"sub":"30000000-0000-0000-0000-000000000004","role":"authenticated"}';

select extensions.results_eq(
  'select count(*) from public.profiles', array[4::bigint],
  'administrator sees profiles only in their organization'
);
select extensions.results_eq(
  'select count(*) from public.audit_events', array[1::bigint],
  'administrator sees audit events in their organization'
);
select extensions.throws_ok(
  $$insert into public.audit_events (action, entity_type) values ('forbidden.write', 'test')$$,
  '42501', null,
  'authenticated users cannot insert audit events directly'
);

select * from extensions.finish();
rollback;
