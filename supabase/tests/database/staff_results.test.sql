begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select extensions.plan(12);

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

-- We need to find an active attempt or create one to test attempt details
-- Authenticate as learner to start attempt
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'learner'), 'role', 'authenticated')::text, true);

insert into quiz_test_state (name, value)
select 'attempt', (public.start_quiz_attempt(
  '18000000-0000-0000-0000-000000000001',
  gen_random_uuid()
) ->> 'attemptId')::uuid;

set local role postgres;

-- Now test instructor readiness
set local role anon;
select extensions.throws_ok(
  format($$select public.get_instructor_cohort_assessment_readiness('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'permission denied for function get_instructor_cohort_assessment_readiness', 'Anonymous cannot access readiness'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'learner'), 'role', 'authenticated')::text, true);
select extensions.throws_ok(
  format($$select public.get_instructor_cohort_assessment_readiness('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'ACCESS_DENIED', 'Learner cannot access readiness'
);

select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'instructor'), 'role', 'authenticated')::text, true);
select extensions.lives_ok(
  format($$select public.get_instructor_cohort_assessment_readiness('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  'Assigned instructor can access readiness'
);

-- Test admin results list
set local role anon;
select extensions.throws_ok(
  format($$select public.list_admin_quiz_results('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'permission denied for function list_admin_quiz_results', 'Anonymous cannot access admin results'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'instructor'), 'role', 'authenticated')::text, true);
select extensions.throws_ok(
  format($$select public.list_admin_quiz_results('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'ACCESS_DENIED', 'Instructor cannot access admin results'
);

select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'admin'), 'role', 'authenticated')::text, true);
select extensions.lives_ok(
  format($$select public.list_admin_quiz_results('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  'Same-org admin can access results'
);

-- Test admin attempt detail
set local role anon;
select extensions.throws_ok(
  format($$select public.get_admin_quiz_attempt_detail('%s')$$, (select value from quiz_test_state where name = 'attempt')),
  '42501', 'permission denied for function get_admin_quiz_attempt_detail', 'Anonymous cannot access attempt detail'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'learner'), 'role', 'authenticated')::text, true);
select extensions.throws_ok(
  format($$select public.get_admin_quiz_attempt_detail('%s')$$, (select value from quiz_test_state where name = 'attempt')),
  '42501', 'ACCESS_DENIED', 'Learner cannot access attempt detail'
);

select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'instructor'), 'role', 'authenticated')::text, true);
select extensions.throws_ok(
  format($$select public.get_admin_quiz_attempt_detail('%s')$$, (select value from quiz_test_state where name = 'attempt')),
  '42501', 'ACCESS_DENIED', 'Instructor cannot access attempt detail'
);

select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'admin'), 'role', 'authenticated')::text, true);
select extensions.lives_ok(
  format($$select public.get_admin_quiz_attempt_detail('%s')$$, (select value from quiz_test_state where name = 'attempt')),
  'Same-org admin can access attempt detail'
);
select extensions.is(
  (public.get_admin_quiz_attempt_detail((select value from quiz_test_state where name = 'attempt')))->>'attemptId',
  (select value from quiz_test_state where name = 'attempt')::text,
  'Attempt detail matches ID'
);

-- Test instructor post-test release (unassigned instructor)
-- I will create a new instructor unassigned to this cohort
set local role postgres;
insert into auth.users (id, email) values (gen_random_uuid(), 'other_inst@bls.local');
insert into quiz_test_state (name, value) values ('other_inst', (select id from auth.users where email = 'other_inst@bls.local'));
update public.profiles set organization_id = (select organization_id from public.cohorts where id = (select value from quiz_test_state where name = 'cohort')), full_name = 'Other Inst', account_status = 'active' where id = (select value from quiz_test_state where name = 'other_inst');
insert into public.user_roles (user_id, role) values ((select value from quiz_test_state where name = 'other_inst'), 'instructor');

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'other_inst'), 'role', 'authenticated')::text, true);
select extensions.throws_ok(
  format($$select public.release_cohort_post_test('%s', (select current_version_id from public.quizzes limit 1), gen_random_uuid())$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'QUIZ_RELEASE_DENIED', 'Unassigned instructor cannot release post test'
);

select * from extensions.finish();
rollback;
