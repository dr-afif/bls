begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select extensions.plan(24);

-- Setup state
create temporary table quiz_test_state (
  name text primary key,
  value uuid not null
);
grant all on table quiz_test_state to authenticated;
grant all on table quiz_test_state to anon;

insert into quiz_test_state values
  ('org', (select id from public.organizations limit 1)),
  ('course', (select id from public.courses limit 1)),
  ('cohort', (select id from public.cohorts limit 1)),
  ('learner', (select id from auth.users where email = 'learner@bls.local')),
  ('instructor', (select id from auth.users where email = 'instructor@bls.local')),
  ('admin', (select id from auth.users where email = 'admin@bls.local')),
  ('other_admin', gen_random_uuid()),
  ('pre_test', (select id from public.quizzes where quiz_type = 'pre_test' limit 1)),
  ('post_test', (select id from public.quizzes where quiz_type = 'post_test' limit 1));

-- Create cross-org admin
insert into auth.users (id, email) values ((select value from quiz_test_state where name = 'other_admin'), 'cross_admin@bls.local');
insert into public.organizations (id, name, slug) values (gen_random_uuid(), 'Other Org', 'other-org');
insert into quiz_test_state (name, value) select 'other_org', id from public.organizations where slug = 'other-org';
update public.profiles set full_name = 'Cross Admin', account_status = 'active', organization_id = (select value from quiz_test_state where name = 'other_org') where id = (select value from quiz_test_state where name = 'other_admin');
insert into public.user_roles (user_id, role) values ((select value from quiz_test_state where name = 'other_admin'), 'admin');

-- 1. Authorization Tests
set local role anon;
select extensions.throws_ok(
  format($$select public.get_admin_cohort_aggregate_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'permission denied for function get_admin_cohort_aggregate_comparison', 'Anonymous cannot access'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'learner'), 'role', 'authenticated')::text, true);
select extensions.throws_ok(
  format($$select public.get_admin_cohort_aggregate_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'ACCESS_DENIED', 'Learner cannot access'
);

select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'instructor'), 'role', 'authenticated')::text, true);
select extensions.throws_ok(
  format($$select public.get_admin_cohort_aggregate_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'ACCESS_DENIED', 'Instructor cannot access'
);

select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'other_admin'), 'role', 'authenticated')::text, true);
select extensions.throws_ok(
  format($$select public.get_admin_cohort_aggregate_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  '42501', 'ACCESS_DENIED', 'Cross-organization admin cannot access'
);

select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'admin'), 'role', 'authenticated')::text, true);
select extensions.lives_ok(
  format($$select public.get_admin_cohort_aggregate_comparison('%s')$$, (select value from quiz_test_state where name = 'cohort')),
  'Same-organization admin can access'
);

-- Setup deterministic data for reporting tests
-- Clear existing attempts for the cohort to test from a clean slate
set local role postgres;
delete from public.quiz_attempts where cohort_id = (select value from quiz_test_state where name = 'cohort');
delete from public.cohort_members where cohort_id = (select value from quiz_test_state where name = 'cohort') and member_role = 'learner';

-- Create learners L1, L2, L3, L4, L5
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'l1@bls.local'),
  ('22222222-2222-2222-2222-222222222222', 'l2@bls.local'),
  ('33333333-3333-3333-3333-333333333333', 'l3@bls.local'),
  ('44444444-4444-4444-4444-444444444444', 'l4@bls.local'),
  ('55555555-5555-5555-5555-555555555555', 'l5@bls.local');

update public.profiles set full_name = 'L1', account_status = 'active', organization_id = (select value from quiz_test_state where name = 'org') where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set full_name = 'L2', account_status = 'active', organization_id = (select value from quiz_test_state where name = 'org') where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set full_name = 'L3', account_status = 'active', organization_id = (select value from quiz_test_state where name = 'org') where id = '33333333-3333-3333-3333-333333333333';
update public.profiles set full_name = 'L4', account_status = 'active', organization_id = (select value from quiz_test_state where name = 'org') where id = '44444444-4444-4444-4444-444444444444';
update public.profiles set full_name = 'L5', account_status = 'active', organization_id = (select value from quiz_test_state where name = 'org') where id = '55555555-5555-5555-5555-555555555555';

insert into public.user_roles (user_id, role) values
  ('11111111-1111-1111-1111-111111111111', 'learner'),
  ('22222222-2222-2222-2222-222222222222', 'learner'),
  ('33333333-3333-3333-3333-333333333333', 'learner'),
  ('44444444-4444-4444-4444-444444444444', 'learner'),
  ('55555555-5555-5555-5555-555555555555', 'learner');

insert into public.cohort_members (cohort_id, user_id, member_role, membership_status) values
  ((select value from quiz_test_state where name = 'cohort'), '11111111-1111-1111-1111-111111111111', 'learner', 'active'),
  ((select value from quiz_test_state where name = 'cohort'), '22222222-2222-2222-2222-222222222222', 'learner', 'active'),
  ((select value from quiz_test_state where name = 'cohort'), '33333333-3333-3333-3333-333333333333', 'learner', 'active'),
  ((select value from quiz_test_state where name = 'cohort'), '44444444-4444-4444-4444-444444444444', 'learner', 'active'),
  ((select value from quiz_test_state where name = 'cohort'), '55555555-5555-5555-5555-555555555555', 'learner', 'active');

-- L1: Pre 60, Post 80 (Gain 20) - Paired
-- L2: Pre 80, Post 70 (Gain -10) - Paired
-- L3: Pre 50, Post null - Missing post
-- L4: Pre null, Post 90 - Missing pre
-- L5: Pre null, Post null - Missing both

-- Insert Pre-Tests
insert into public.quiz_attempts (id, organization_id, course_id, cohort_id, quiz_id, quiz_version_id, learner_id, attempt_number, start_request_id, submission_request_id, expires_at, status, started_at, submitted_at, score_percent, score_points, max_points, passed) values
  ('10000000-0000-0000-0000-000000000001', (select value from quiz_test_state where name = 'org'), (select value from quiz_test_state where name = 'course'), (select value from quiz_test_state where name = 'cohort'), (select value from quiz_test_state where name = 'pre_test'), (select current_version_id from public.quizzes where id = (select value from quiz_test_state where name = 'pre_test')), '11111111-1111-1111-1111-111111111111', 1, gen_random_uuid(), gen_random_uuid(), now() + interval '1 hour', 'submitted', now() - interval '2 days', now() - interval '2 days', 60, 6, 10, false),
  ('20000000-0000-0000-0000-000000000002', (select value from quiz_test_state where name = 'org'), (select value from quiz_test_state where name = 'course'), (select value from quiz_test_state where name = 'cohort'), (select value from quiz_test_state where name = 'pre_test'), (select current_version_id from public.quizzes where id = (select value from quiz_test_state where name = 'pre_test')), '22222222-2222-2222-2222-222222222222', 1, gen_random_uuid(), gen_random_uuid(), now() + interval '1 hour', 'submitted', now() - interval '2 days', now() - interval '2 days', 80, 8, 10, true),
  ('30000000-0000-0000-0000-000000000003', (select value from quiz_test_state where name = 'org'), (select value from quiz_test_state where name = 'course'), (select value from quiz_test_state where name = 'cohort'), (select value from quiz_test_state where name = 'pre_test'), (select current_version_id from public.quizzes where id = (select value from quiz_test_state where name = 'pre_test')), '33333333-3333-3333-3333-333333333333', 1, gen_random_uuid(), gen_random_uuid(), now() + interval '1 hour', 'submitted', now() - interval '2 days', now() - interval '2 days', 50, 5, 10, false);

-- Insert Post-Tests
insert into public.quiz_attempts (id, organization_id, course_id, cohort_id, quiz_id, quiz_version_id, learner_id, attempt_number, start_request_id, submission_request_id, expires_at, status, started_at, submitted_at, score_percent, score_points, max_points, passed) values
  ('10000000-0000-0000-0000-000000000011', (select value from quiz_test_state where name = 'org'), (select value from quiz_test_state where name = 'course'), (select value from quiz_test_state where name = 'cohort'), (select value from quiz_test_state where name = 'post_test'), (select current_version_id from public.quizzes where id = (select value from quiz_test_state where name = 'post_test')), '11111111-1111-1111-1111-111111111111', 2, gen_random_uuid(), gen_random_uuid(), now() + interval '1 hour', 'submitted', now() - interval '1 days', now() - interval '1 days', 80, 8, 10, true),
  ('20000000-0000-0000-0000-000000000012', (select value from quiz_test_state where name = 'org'), (select value from quiz_test_state where name = 'course'), (select value from quiz_test_state where name = 'cohort'), (select value from quiz_test_state where name = 'post_test'), (select current_version_id from public.quizzes where id = (select value from quiz_test_state where name = 'post_test')), '22222222-2222-2222-2222-222222222222', 1, gen_random_uuid(), gen_random_uuid(), now() + interval '1 hour', 'submitted', now() - interval '1 days', now() - interval '1 days', 70, 7, 10, false),
  ('40000000-0000-0000-0000-000000000014', (select value from quiz_test_state where name = 'org'), (select value from quiz_test_state where name = 'course'), (select value from quiz_test_state where name = 'cohort'), (select value from quiz_test_state where name = 'post_test'), (select current_version_id from public.quizzes where id = (select value from quiz_test_state where name = 'post_test')), '44444444-4444-4444-4444-444444444444', 1, gen_random_uuid(), gen_random_uuid(), now() + interval '1 hour', 'submitted', now() - interval '1 days', now() - interval '1 days', 90, 9, 10, true);

-- Add an earlier submitted attempt for L1 post-test (should be ignored due to DESC ordering)
insert into public.quiz_attempts (id, organization_id, course_id, cohort_id, quiz_id, quiz_version_id, learner_id, attempt_number, start_request_id, submission_request_id, expires_at, status, started_at, submitted_at, score_percent, score_points, max_points, passed) values
  ('10000000-0000-0000-0000-000000000000', (select value from quiz_test_state where name = 'org'), (select value from quiz_test_state where name = 'course'), (select value from quiz_test_state where name = 'cohort'), (select value from quiz_test_state where name = 'post_test'), (select current_version_id from public.quizzes where id = (select value from quiz_test_state where name = 'post_test')), '11111111-1111-1111-1111-111111111111', 1, gen_random_uuid(), gen_random_uuid(), now() + interval '1 hour', 'submitted', now() - interval '3 days', now() - interval '3 days', 20, 2, 10, false);

-- Add an in-progress attempt for L1 post-test (should be ignored)
insert into public.quiz_attempts (id, organization_id, course_id, cohort_id, quiz_id, quiz_version_id, learner_id, attempt_number, start_request_id, expires_at, status, started_at, score_percent, passed) values
  ('10000000-0000-0000-0000-000000000022', (select value from quiz_test_state where name = 'org'), (select value from quiz_test_state where name = 'course'), (select value from quiz_test_state where name = 'cohort'), (select value from quiz_test_state where name = 'post_test'), (select current_version_id from public.quizzes where id = (select value from quiz_test_state where name = 'post_test')), '11111111-1111-1111-1111-111111111111', 3, gen_random_uuid(), now() + interval '1 hour', 'in_progress', now(), null, false);

-- Test Learner Comparison Output
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', (select value from quiz_test_state where name = 'admin'), 'role', 'authenticated')::text, true);

select extensions.is(
  (public.get_admin_cohort_learner_comparison((select value from quiz_test_state where name = 'cohort'))
    ->0->'preTest'->>'scorePercent')::numeric,
  60::numeric,
  'L1 Pre score is 60'
);

select extensions.is(
  (public.get_admin_cohort_learner_comparison((select value from quiz_test_state where name = 'cohort'))
    ->0->'postTest'->>'scorePercent')::numeric,
  80::numeric,
  'L1 Post score is 80 (latest submitted attempt)'
);

select extensions.is(
  (public.get_admin_cohort_learner_comparison((select value from quiz_test_state where name = 'cohort'))
    ->0->>'learningGain')::numeric,
  20::numeric,
  'L1 Gain is +20'
);

select extensions.is(
  (public.get_admin_cohort_learner_comparison((select value from quiz_test_state where name = 'cohort'))
    ->1->>'learningGain')::numeric,
  -10::numeric,
  'L2 Gain is -10'
);

select extensions.is(
  (public.get_admin_cohort_learner_comparison((select value from quiz_test_state where name = 'cohort'))
    ->2->'postTest'->>'scorePercent'),
  null,
  'L3 Missing Post score is null'
);

select extensions.is(
  (public.get_admin_cohort_learner_comparison((select value from quiz_test_state where name = 'cohort'))
    ->2->>'learningGain'),
  null,
  'L3 Gain is null'
);

select extensions.is(
  (public.get_admin_cohort_learner_comparison((select value from quiz_test_state where name = 'cohort'))
    ->3->'preTest'->>'scorePercent'),
  null,
  'L4 Missing Pre score is null'
);

select extensions.is(
  (public.get_admin_cohort_learner_comparison((select value from quiz_test_state where name = 'cohort'))
    ->4->'preTest'->>'scorePercent'),
  null,
  'L5 Missing Pre score is null'
);

select extensions.is(
  (public.get_admin_cohort_learner_comparison((select value from quiz_test_state where name = 'cohort'))
    ->4->'postTest'->>'scorePercent'),
  null,
  'L5 Missing Post score is null'
);

-- Test Aggregate Output
select extensions.is(
  (public.get_admin_cohort_aggregate_comparison((select value from quiz_test_state where name = 'cohort'))
    ->>'totalLearners')::numeric,
  5::numeric,
  'Aggregate totalLearners is 5'
);

select extensions.is(
  (public.get_admin_cohort_aggregate_comparison((select value from quiz_test_state where name = 'cohort'))
    ->>'pairedResultCount')::numeric,
  2::numeric,
  'Aggregate pairedResultCount is 2'
);

select extensions.is(
  round((public.get_admin_cohort_aggregate_comparison((select value from quiz_test_state where name = 'cohort'))
    ->'preTest'->>'averageScorePercent')::numeric, 2),
  round(( (60 + 80 + 50) / 3.0 ), 2),
  'Pre-test average is correctly calculated'
);

select extensions.is(
  (public.get_admin_cohort_aggregate_comparison((select value from quiz_test_state where name = 'cohort'))
    ->'preTest'->>'medianScorePercent')::numeric,
  60::numeric,
  'Pre-test median of 50, 60, 80 is 60'
);

select extensions.is(
  (public.get_admin_cohort_aggregate_comparison((select value from quiz_test_state where name = 'cohort'))
    ->'preTest'->>'completionCount')::numeric,
  3::numeric,
  'Pre-test completion count is 3'
);

select extensions.is(
  round((public.get_admin_cohort_aggregate_comparison((select value from quiz_test_state where name = 'cohort'))
    ->'postTest'->>'averageScorePercent')::numeric, 2),
  round(( (80 + 70 + 90) / 3.0 ), 2),
  'Post-test average is correctly calculated'
);

select extensions.is(
  (public.get_admin_cohort_aggregate_comparison((select value from quiz_test_state where name = 'cohort'))
    ->'postTest'->>'medianScorePercent')::numeric,
  80::numeric,
  'Post-test median of 70, 80, 90 is 80'
);

select extensions.is(
  (public.get_admin_cohort_aggregate_comparison((select value from quiz_test_state where name = 'cohort'))
    ->'postTest'->>'passedCount')::numeric,
  2::numeric,
  'Post-test passed count is 2 (L1 and L4)'
);

select extensions.is(
  round((public.get_admin_cohort_aggregate_comparison((select value from quiz_test_state where name = 'cohort'))
    ->>'averageLearningGain')::numeric, 2),
  round(( (20 + -10) / 2.0 ), 2),
  'Average learning gain uses paired results (+20 and -10 avg to +5)'
);

-- Privacy assertions
select extensions.is(
  (public.get_admin_cohort_topic_comparison((select value from quiz_test_state where name = 'cohort'))::text like '%is_correct%'),
  false,
  'Topic comparison does not leak is_correct'
);

select * from extensions.finish();
rollback;
