begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select extensions.plan(23);

insert into public.organizations (id, name, slug)
values
  ('21000000-0000-0000-0000-000000000001', 'Milestone Three One', 'milestone-three-one'),
  ('21000000-0000-0000-0000-000000000002', 'Milestone Three Two', 'milestone-three-two');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('31000000-0000-0000-0000-000000000001', 'm3-learner@example.test', now(), '{"full_name":"M3 Learner"}'),
  ('31000000-0000-0000-0000-000000000002', 'm3-instructor@example.test', now(), '{"full_name":"M3 Instructor"}'),
  ('31000000-0000-0000-0000-000000000003', 'm3-admin@example.test', now(), '{"full_name":"M3 Admin"}'),
  ('31000000-0000-0000-0000-000000000004', 'm3-other-admin@example.test', now(), '{"full_name":"M3 Other Admin"}');

update public.profiles
set organization_id = '21000000-0000-0000-0000-000000000001', account_status = 'active'
where id in (
  '31000000-0000-0000-0000-000000000001',
  '31000000-0000-0000-0000-000000000002',
  '31000000-0000-0000-0000-000000000003'
);

update public.profiles
set organization_id = '21000000-0000-0000-0000-000000000002', account_status = 'active'
where id = '31000000-0000-0000-0000-000000000004';

insert into public.user_roles (user_id, role)
values
  ('31000000-0000-0000-0000-000000000001', 'learner'),
  ('31000000-0000-0000-0000-000000000002', 'instructor'),
  ('31000000-0000-0000-0000-000000000003', 'admin'),
  ('31000000-0000-0000-0000-000000000004', 'admin');

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"31000000-0000-0000-0000-000000000003","role":"authenticated"}';

select extensions.lives_ok(
  $$insert into public.cohorts (
      id, organization_id, code, name, venue, start_at, end_at, status, created_by
    ) values (
      '41000000-0000-0000-0000-000000000001',
      '21000000-0000-0000-0000-000000000001',
      'M3-001', 'Milestone Three Cohort', 'Skills Lab',
      now() + interval '1 day', now() + interval '1 day 8 hours', 'scheduled',
      '31000000-0000-0000-0000-000000000003'
    )$$,
  'administrator can create a cohort in their organization'
);

select extensions.results_eq(
  $$select count(*) from public.audit_events where action = 'cohort.created'$$,
  array[1::bigint],
  'cohort creation produces one audit event'
);

select extensions.throws_ok(
  $$insert into public.cohorts (
      organization_id, code, name, start_at, end_at, created_by
    ) values (
      '21000000-0000-0000-0000-000000000002', 'M3-OTHER', 'Other cohort',
      now(), now() + interval '1 hour',
      '31000000-0000-0000-0000-000000000003'
    )$$,
  '42501', null,
  'administrator cannot create a cohort in another organization'
);

select extensions.lives_ok(
  $$insert into public.cohort_members (
      cohort_id, user_id, member_role, added_by
    ) values (
      '41000000-0000-0000-0000-000000000001',
      '31000000-0000-0000-0000-000000000001', 'learner',
      '31000000-0000-0000-0000-000000000003'
    )$$,
  'administrator can assign a same-organization learner'
);

select extensions.lives_ok(
  $$insert into public.cohort_members (
      cohort_id, user_id, member_role, added_by
    ) values (
      '41000000-0000-0000-0000-000000000001',
      '31000000-0000-0000-0000-000000000002', 'instructor',
      '31000000-0000-0000-0000-000000000003'
    )$$,
  'administrator can assign a same-organization instructor'
);

select extensions.results_eq(
  $$select count(*) from public.audit_events where action = 'cohort.member_assigned'$$,
  array[2::bigint],
  'member assignments produce audit events'
);

select extensions.lives_ok(
  $$update public.cohorts set status = 'active'
    where id = '41000000-0000-0000-0000-000000000001'$$,
  'administrator can update cohort lifecycle status'
);

select extensions.results_eq(
  $$select count(*) from public.audit_events where action = 'cohort.updated'$$,
  array[1::bigint],
  'cohort update produces an audit event'
);

select extensions.lives_ok(
  $$update public.cohort_members set membership_status = 'removed'
    where cohort_id = '41000000-0000-0000-0000-000000000001'
      and user_id = '31000000-0000-0000-0000-000000000001'$$,
  'administrator can remove a cohort membership without deleting history'
);

select extensions.results_eq(
  $$select count(*) from public.audit_events
    where action = 'cohort.membership_status_changed'$$,
  array[1::bigint],
  'membership status change produces an audit event'
);

update public.cohort_members
set membership_status = 'active'
where cohort_id = '41000000-0000-0000-0000-000000000001'
  and user_id = '31000000-0000-0000-0000-000000000001';

select extensions.throws_ok(
  $$insert into public.cohort_members (
      cohort_id, user_id, member_role, added_by
    ) values (
      '41000000-0000-0000-0000-000000000001',
      '31000000-0000-0000-0000-000000000002', 'learner',
      '31000000-0000-0000-0000-000000000003'
    )$$,
  '23514', null,
  'membership role must match the assigned application role'
);

select extensions.throws_ok(
  $$insert into public.cohort_members (
      cohort_id, user_id, member_role, added_by
    ) values (
      '41000000-0000-0000-0000-000000000001',
      '31000000-0000-0000-0000-000000000004', 'instructor',
      '31000000-0000-0000-0000-000000000003'
    )$$,
  '23514', null,
  'cross-organization cohort assignment is rejected'
);

select extensions.lives_ok(
  $$update public.profiles set account_status = 'suspended'
    where id = '31000000-0000-0000-0000-000000000001'$$,
  'administrator can suspend a same-organization profile'
);

select extensions.results_eq(
  $$select account_status::text from public.profiles
    where id = '31000000-0000-0000-0000-000000000001'$$,
  array['suspended'::text],
  'profile status transition is persisted'
);

select extensions.results_eq(
  $$select count(*) from public.audit_events
    where action = 'profile.account_status_changed'$$,
  array[1::bigint],
  'profile status transition produces an audit event'
);

select extensions.throws_ok(
  $$update public.profiles set account_status = 'suspended'
    where id = '31000000-0000-0000-0000-000000000003'$$,
  '42501', null,
  'administrator cannot change their own account status'
);

set local request.jwt.claims =
  '{"sub":"31000000-0000-0000-0000-000000000002","role":"authenticated"}';

select extensions.results_eq(
  $$select count(*) from public.cohorts$$,
  array[1::bigint],
  'assigned instructor sees their cohort'
);

select extensions.results_eq(
  $$select count(*) from public.cohort_members$$,
  array[2::bigint],
  'assigned instructor sees the cohort roster'
);

select extensions.results_eq(
  $$with changed as (
      update public.cohorts set venue = 'Unauthorized change'
      where id = '41000000-0000-0000-0000-000000000001'
      returning id
    ) select count(*) from changed$$,
  array[0::bigint],
  'instructor cannot update cohort operations data'
);

set local request.jwt.claims =
  '{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}';

select extensions.results_eq(
  $$select count(*) from public.cohorts$$,
  array[0::bigint],
  'suspended learner cannot read their cohort'
);

select extensions.throws_ok(
  $$insert into public.cohorts (
      organization_id, code, name, start_at, end_at, created_by
    ) values (
      '21000000-0000-0000-0000-000000000001', 'M3-DENIED', 'Denied',
      now(), now() + interval '1 hour',
      '31000000-0000-0000-0000-000000000001'
    )$$,
  '42501', null,
  'learner cannot create cohorts'
);

set local request.jwt.claims =
  '{"sub":"31000000-0000-0000-0000-000000000004","role":"authenticated"}';

select extensions.results_eq(
  $$select count(*) from public.cohorts$$,
  array[0::bigint],
  'administrator cannot see another organization cohort'
);

select extensions.results_eq(
  $$with changed as (
      update public.profiles set account_status = 'active'
      where id = '31000000-0000-0000-0000-000000000001'
      returning id
    ) select count(*) from changed$$,
  array[0::bigint],
  'administrator cannot manage another organization profile'
);

select * from extensions.finish();
rollback;
