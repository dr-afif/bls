begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select extensions.plan(13);

-- Setup state
create temporary table quiz_test_state (
  name text primary key,
  value uuid not null
);
grant all on table quiz_test_state to authenticated;
grant all on table quiz_test_state to anon;

insert into quiz_test_state values
  ('learner', (select id from auth.users where email = 'learner@bls.local')),
  ('instructor', (select id from auth.users where email = 'instructor@bls.local')),
  ('admin', (select id from auth.users where email = 'admin@bls.local')),
  ('cohort', (select cm.cohort_id from public.cohort_members cm
    join auth.users u on u.id = cm.user_id
    where u.email = 'learner@bls.local' and cm.member_role = 'learner'
      and cm.membership_status = 'active' limit 1));

-- Test get_admin_cohort_learner_comparison
set local role anon;
select extensions.throws_ok(
  format($$select public.get_admin_cohort_learner_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'permission denied for function get_admin_cohort_learner_comparison', 'Anonymous cannot access learner comparison'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'learner'), 'role', 'authenticated')::text, true);
select extensions.throws_ok(
  format($$select public.get_admin_cohort_learner_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'ACCESS_DENIED', 'Learner cannot access learner comparison'
);

select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'instructor'), 'role', 'authenticated')::text, true);
select extensions.throws_ok(
  format($$select public.get_admin_cohort_learner_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'ACCESS_DENIED', 'Instructor cannot access learner comparison'
);

select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'admin'), 'role', 'authenticated')::text, true);
select extensions.lives_ok(
  format($$select public.get_admin_cohort_learner_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  'Same-org admin can access learner comparison'
);

-- Test get_admin_cohort_aggregate_comparison
set local role anon;
select extensions.throws_ok(
  format($$select public.get_admin_cohort_aggregate_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'permission denied for function get_admin_cohort_aggregate_comparison', 'Anonymous cannot access aggregate comparison'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'learner'), 'role', 'authenticated')::text, true);
select extensions.throws_ok(
  format($$select public.get_admin_cohort_aggregate_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'ACCESS_DENIED', 'Learner cannot access aggregate comparison'
);

select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'instructor'), 'role', 'authenticated')::text, true);
select extensions.throws_ok(
  format($$select public.get_admin_cohort_aggregate_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'ACCESS_DENIED', 'Instructor cannot access aggregate comparison'
);

select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'admin'), 'role', 'authenticated')::text, true);
select extensions.lives_ok(
  format($$select public.get_admin_cohort_aggregate_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  'Same-org admin can access aggregate comparison'
);

-- Test get_admin_cohort_topic_comparison
set local role anon;
select extensions.throws_ok(
  format($$select public.get_admin_cohort_topic_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'permission denied for function get_admin_cohort_topic_comparison', 'Anonymous cannot access topic comparison'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'learner'), 'role', 'authenticated')::text, true);
select extensions.throws_ok(
  format($$select public.get_admin_cohort_topic_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'ACCESS_DENIED', 'Learner cannot access topic comparison'
);

select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'instructor'), 'role', 'authenticated')::text, true);
select extensions.throws_ok(
  format($$select public.get_admin_cohort_topic_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'ACCESS_DENIED', 'Instructor cannot access topic comparison'
);

select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'admin'), 'role', 'authenticated')::text, true);
select extensions.lives_ok(
  format($$select public.get_admin_cohort_topic_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  'Same-org admin can access topic comparison'
);

-- Accuracy test
select extensions.is(
  jsonb_typeof(public.get_admin_cohort_aggregate_comparison((select value from quiz_test_state where name = 'cohort'))),
  'object',
  'Aggregate comparison returns an object'
);

select * from extensions.finish();
rollback;
