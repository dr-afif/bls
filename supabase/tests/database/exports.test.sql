begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

-- Plan tests: 36 assertions
select extensions.plan(36);

-- Setup
create table if not exists exports_test_state (name text primary key, value uuid);
grant all on table exports_test_state to authenticated;
grant all on table exports_test_state to anon;

insert into exports_test_state (name, value) values ('org1', gen_random_uuid()), ('org2', gen_random_uuid());
insert into public.organizations (id, name, slug) values
  ((select value from exports_test_state where name = 'org1'), 'Test Org 1', 'test-org-1'),
  ((select value from exports_test_state where name = 'org2'), 'Test Org 2', 'test-org-2');

insert into exports_test_state (name, value) values ('course1', gen_random_uuid());
insert into public.courses (id, slug, title, organization_id) values
  ((select value from exports_test_state where name = 'course1'), 'test-course', 'Test Course', (select value from exports_test_state where name = 'org1'));

insert into exports_test_state (name, value) values
  ('cohort1', gen_random_uuid()),
  ('cohort_empty', gen_random_uuid()),
  ('cohort_other', gen_random_uuid()),
  ('cohort_completed', gen_random_uuid());

insert into public.cohorts (id, course_id, organization_id, name, code, status, start_at, end_at, description) values
  ((select value from exports_test_state where name = 'cohort1'), (select value from exports_test_state where name = 'course1'), (select value from exports_test_state where name = 'org1'), 'COHORT-1', 'COHORT-1', 'active', now(), now() + interval '1 day', 'Test Cohort 1'),
  ((select value from exports_test_state where name = 'cohort_empty'), (select value from exports_test_state where name = 'course1'), (select value from exports_test_state where name = 'org1'), 'EMPTY-COHORT', 'EMPTY-COHORT', 'active', now(), now() + interval '1 day', 'Empty Cohort'),
  ((select value from exports_test_state where name = 'cohort_other'), (select value from exports_test_state where name = 'course1'), (select value from exports_test_state where name = 'org1'), 'OTHER-COHORT', 'OTHER-COHORT', 'active', now(), now() + interval '1 day', 'Other Cohort'),
  ((select value from exports_test_state where name = 'cohort_completed'), (select value from exports_test_state where name = 'course1'), (select value from exports_test_state where name = 'org1'), 'COMPLETED-COHORT', 'COMPLETED-COHORT', 'completed', now() - interval '2 days', now() - interval '1 day', 'Completed Cohort');

insert into exports_test_state (name, value) values ('pretest1', gen_random_uuid()), ('posttest1', gen_random_uuid());
insert into public.quizzes (id, organization_id, course_id, slug, quiz_type, title) values
  ((select value from exports_test_state where name = 'pretest1'), (select value from exports_test_state where name = 'org1'), (select value from exports_test_state where name = 'course1'), 'pre-test', 'pre_test', 'Pre Test'),
  ((select value from exports_test_state where name = 'posttest1'), (select value from exports_test_state where name = 'org1'), (select value from exports_test_state where name = 'course1'), 'post-test', 'post_test', 'Post Test');

-- Users
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin1@bls.local'),
  ('22222222-2222-2222-2222-222222222222', 'admin2@bls.local'),
  ('33333333-3333-3333-3333-333333333333', 'inst1@bls.local'),
  ('44444444-4444-4444-4444-444444444444', 'learner1@bls.local'),
  ('55555555-5555-5555-5555-555555555555', 'learner2@bls.local'),
  ('66666666-6666-6666-6666-666666666666', 'learner3@bls.local'),
  ('77777777-7777-7777-7777-777777777777', 'inst_unassigned@bls.local'),
  ('88888888-8888-8888-8888-888888888888', 'learner4@bls.local'),
  ('99999999-9999-9999-9999-999999999999', 'learner_other@bls.local');

update public.profiles set full_name = 'Admin 1', organization_id = (select value from exports_test_state where name = 'org1'), account_status = 'active' where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set full_name = 'Admin 2', organization_id = (select value from exports_test_state where name = 'org2'), account_status = 'active' where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set full_name = 'Inst 1', organization_id = (select value from exports_test_state where name = 'org1'), account_status = 'active' where id = '33333333-3333-3333-3333-333333333333';
update public.profiles set full_name = 'Learner 1', organization_id = (select value from exports_test_state where name = 'org1'), account_status = 'active' where id = '44444444-4444-4444-4444-444444444444';
update public.profiles set full_name = 'Learner 2', organization_id = (select value from exports_test_state where name = 'org1'), account_status = 'active' where id = '55555555-5555-5555-5555-555555555555';
update public.profiles set full_name = 'Learner 3', organization_id = (select value from exports_test_state where name = 'org1'), account_status = 'active' where id = '66666666-6666-6666-6666-666666666666';
update public.profiles set full_name = 'Inst Unassigned', organization_id = (select value from exports_test_state where name = 'org1'), account_status = 'active' where id = '77777777-7777-7777-7777-777777777777';
update public.profiles set full_name = 'Learner 4', organization_id = (select value from exports_test_state where name = 'org1'), account_status = 'active' where id = '88888888-8888-8888-8888-888888888888';
update public.profiles set full_name = 'Learner Other', organization_id = (select value from exports_test_state where name = 'org1'), account_status = 'active' where id = '99999999-9999-9999-9999-999999999999';

insert into public.user_roles (user_id, role) values
  ('11111111-1111-1111-1111-111111111111', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'admin'),
  ('33333333-3333-3333-3333-333333333333', 'instructor'),
  ('44444444-4444-4444-4444-444444444444', 'learner'),
  ('55555555-5555-5555-5555-555555555555', 'learner'),
  ('66666666-6666-6666-6666-666666666666', 'learner'),
  ('77777777-7777-7777-7777-777777777777', 'instructor'),
  ('88888888-8888-8888-8888-888888888888', 'learner'),
  ('99999999-9999-9999-9999-999999999999', 'learner');

insert into public.cohort_members (cohort_id, user_id, member_role, membership_status) values
  ((select value from exports_test_state where name = 'cohort1'), '33333333-3333-3333-3333-333333333333', 'instructor', 'active'),
  ((select value from exports_test_state where name = 'cohort1'), '44444444-4444-4444-4444-444444444444', 'learner', 'active'),
  ((select value from exports_test_state where name = 'cohort1'), '55555555-5555-5555-5555-555555555555', 'learner', 'active'),
  ((select value from exports_test_state where name = 'cohort1'), '66666666-6666-6666-6666-666666666666', 'learner', 'active'),
  ((select value from exports_test_state where name = 'cohort1'), '88888888-8888-8888-8888-888888888888', 'learner', 'active'),
  ((select value from exports_test_state where name = 'cohort_completed'), '44444444-4444-4444-4444-444444444444', 'learner', 'completed'),
  ((select value from exports_test_state where name = 'cohort_other'), '99999999-9999-9999-9999-999999999999', 'learner', 'active');

insert into exports_test_state (name, value) values ('quiz_v1', gen_random_uuid()), ('post_quiz_v1', gen_random_uuid());
insert into public.quiz_versions (id, quiz_id, version_number, title, instructions, passing_score_percent, time_limit_minutes, status, published_by, published_at) values
  ((select value from exports_test_state where name = 'quiz_v1'), (select value from exports_test_state where name = 'pretest1'), 1, 'Pre Test V1', 'Instr', 80, 60, 'published', '11111111-1111-1111-1111-111111111111', now()),
  ((select value from exports_test_state where name = 'post_quiz_v1'), (select value from exports_test_state where name = 'posttest1'), 1, 'Post Test V1', 'Instr', 80, 60, 'published', '11111111-1111-1111-1111-111111111111', now());
update public.quizzes set current_version_id = (select value from exports_test_state where name = 'quiz_v1') where id = (select value from exports_test_state where name = 'pretest1');
update public.quizzes set current_version_id = (select value from exports_test_state where name = 'post_quiz_v1') where id = (select value from exports_test_state where name = 'posttest1');

-- Attempts:
-- Learner 1: Older Pre-test 40% (submitted 3 hrs ago), Latest Pre-test 100% (submitted 1 hr ago), Post-test 100% (submitted now)
insert into public.quiz_attempts (id, organization_id, course_id, cohort_id, learner_id, quiz_id, quiz_version_id, attempt_number, status, start_request_id, submission_request_id, expires_at, submitted_at, score_points, max_points, score_percent, passed) values
  (gen_random_uuid(), (select value from exports_test_state where name = 'org1'), (select value from exports_test_state where name = 'course1'), (select value from exports_test_state where name = 'cohort1'), '44444444-4444-4444-4444-444444444444', (select value from exports_test_state where name = 'pretest1'), (select value from exports_test_state where name = 'quiz_v1'), 1, 'submitted', gen_random_uuid(), gen_random_uuid(), now(), now() - interval '3 hours', 1, 2, 40, false),
  (gen_random_uuid(), (select value from exports_test_state where name = 'org1'), (select value from exports_test_state where name = 'course1'), (select value from exports_test_state where name = 'cohort1'), '44444444-4444-4444-4444-444444444444', (select value from exports_test_state where name = 'pretest1'), (select value from exports_test_state where name = 'quiz_v1'), 2, 'submitted', gen_random_uuid(), gen_random_uuid(), now(), now() - interval '1 hour', 2, 2, 100, true),
  (gen_random_uuid(), (select value from exports_test_state where name = 'org1'), (select value from exports_test_state where name = 'course1'), (select value from exports_test_state where name = 'cohort1'), '44444444-4444-4444-4444-444444444444', (select value from exports_test_state where name = 'posttest1'), (select value from exports_test_state where name = 'post_quiz_v1'), 1, 'submitted', gen_random_uuid(), gen_random_uuid(), now(), now(), 2, 2, 100, true);

-- Learner 2: Pre-test tie-breaker: two attempts at exact same submitted_at timestamp:
-- Lower UUID with 20%, Higher UUID with 50%.
-- Also an in-progress post-test and a timed-out post-test (neither should count as submitted).
insert into exports_test_state (name, value) values
  ('l2_pre_low', 'aaaaaaaa-2222-2222-2222-222222222222'),
  ('l2_pre_high', 'bbbbbbbb-2222-2222-2222-222222222222');

insert into public.quiz_attempts (id, organization_id, course_id, cohort_id, learner_id, quiz_id, quiz_version_id, attempt_number, status, start_request_id, submission_request_id, expires_at, submitted_at, score_points, max_points, score_percent, passed) values
  ((select value from exports_test_state where name = 'l2_pre_low'), (select value from exports_test_state where name = 'org1'), (select value from exports_test_state where name = 'course1'), (select value from exports_test_state where name = 'cohort1'), '55555555-5555-5555-5555-555555555555', (select value from exports_test_state where name = 'pretest1'), (select value from exports_test_state where name = 'quiz_v1'), 1, 'submitted', gen_random_uuid(), gen_random_uuid(), now(), now() - interval '30 minutes', 1, 5, 20, false),
  ((select value from exports_test_state where name = 'l2_pre_high'), (select value from exports_test_state where name = 'org1'), (select value from exports_test_state where name = 'course1'), (select value from exports_test_state where name = 'cohort1'), '55555555-5555-5555-5555-555555555555', (select value from exports_test_state where name = 'pretest1'), (select value from exports_test_state where name = 'quiz_v1'), 2, 'submitted', gen_random_uuid(), gen_random_uuid(), now(), now() - interval '30 minutes', 1, 2, 50, false),
  (gen_random_uuid(), (select value from exports_test_state where name = 'org1'), (select value from exports_test_state where name = 'course1'), (select value from exports_test_state where name = 'cohort1'), '55555555-5555-5555-5555-555555555555', (select value from exports_test_state where name = 'posttest1'), (select value from exports_test_state where name = 'post_quiz_v1'), 1, 'in_progress', gen_random_uuid(), null, now() + interval '1 hour', null, null, 2, null, null),
  (gen_random_uuid(), (select value from exports_test_state where name = 'org1'), (select value from exports_test_state where name = 'course1'), (select value from exports_test_state where name = 'cohort1'), '55555555-5555-5555-5555-555555555555', (select value from exports_test_state where name = 'posttest1'), (select value from exports_test_state where name = 'post_quiz_v1'), 2, 'timed_out', gen_random_uuid(), null, now() - interval '10 minutes', null, null, 2, null, null);

-- Learner 3: Pre-test 90%, Post-test 70% (Negative learning gain: -20.00)
insert into public.quiz_attempts (id, organization_id, course_id, cohort_id, learner_id, quiz_id, quiz_version_id, attempt_number, status, start_request_id, submission_request_id, expires_at, submitted_at, score_points, max_points, score_percent, passed) values
  (gen_random_uuid(), (select value from exports_test_state where name = 'org1'), (select value from exports_test_state where name = 'course1'), (select value from exports_test_state where name = 'cohort1'), '66666666-6666-6666-6666-666666666666', (select value from exports_test_state where name = 'pretest1'), (select value from exports_test_state where name = 'quiz_v1'), 1, 'submitted', gen_random_uuid(), gen_random_uuid(), now(), now() - interval '2 hours', 9, 10, 90, true),
  (gen_random_uuid(), (select value from exports_test_state where name = 'org1'), (select value from exports_test_state where name = 'course1'), (select value from exports_test_state where name = 'cohort1'), '66666666-6666-6666-6666-666666666666', (select value from exports_test_state where name = 'posttest1'), (select value from exports_test_state where name = 'post_quiz_v1'), 1, 'submitted', gen_random_uuid(), gen_random_uuid(), now(), now(), 7, 10, 70, false);

-- Learner 4: No attempts at all.


-- 1. Authorization tests
-- 1.1 Anonymous denied
set local role anon;
select extensions.throws_ok(
  'select public.get_admin_cohort_roster_export(''' || (select value from exports_test_state where name = 'cohort1') || ''', gen_random_uuid())',
  '42501',
  'permission denied for function get_admin_cohort_roster_export',
  'Anonymous denied roster export'
);

-- 1.2 Learner denied
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
select extensions.throws_ok(
  'select public.get_admin_cohort_roster_export(''' || (select value from exports_test_state where name = 'cohort1') || ''', gen_random_uuid())',
  '42501', 'ACCESS_DENIED',
  'Learner denied roster export'
);

-- 1.3 Unassigned instructor denied
select set_config('request.jwt.claims', '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}', true);
select extensions.throws_ok(
  'select public.get_admin_pre_post_export(''' || (select value from exports_test_state where name = 'cohort1') || ''', gen_random_uuid())',
  '42501', 'ACCESS_DENIED',
  'Unassigned instructor denied pre-post export'
);

-- 1.4 Assigned instructor denied
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select extensions.throws_ok(
  'select public.get_admin_cohort_roster_export(''' || (select value from exports_test_state where name = 'cohort1') || ''', gen_random_uuid())',
  '42501', 'ACCESS_DENIED',
  'Assigned instructor denied roster export'
);
select extensions.throws_ok(
  'select public.get_admin_assessment_results_export(''' || (select value from exports_test_state where name = 'cohort1') || ''', ''pre_test'', gen_random_uuid())',
  '42501', 'ACCESS_DENIED',
  'Assigned instructor denied assessment export'
);

-- 1.5 Cross-org admin denied
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select extensions.throws_ok(
  'select public.get_admin_pre_post_export(''' || (select value from exports_test_state where name = 'cohort1') || ''', gen_random_uuid())',
  '42501', 'ACCESS_DENIED',
  'Cross-org admin denied pre-post export'
);

-- 1.6 Same-org admin allowed
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select extensions.lives_ok(
  'select public.get_admin_cohort_roster_export(''' || (select value from exports_test_state where name = 'cohort1') || ''', gen_random_uuid())',
  'Same-org admin allowed roster export'
);
select extensions.lives_ok(
  'select public.get_admin_assessment_results_export(''' || (select value from exports_test_state where name = 'cohort1') || ''', ''pre_test'', gen_random_uuid())',
  'Same-org admin allowed assessment export'
);
select extensions.lives_ok(
  'select public.get_admin_pre_post_export(''' || (select value from exports_test_state where name = 'cohort1') || ''', gen_random_uuid())',
  'Same-org admin allowed pre-post export'
);


-- 2. Roster checks
create temp table roster_results as
  select public.get_admin_cohort_roster_export((select value from exports_test_state where name = 'cohort1'), gen_random_uuid()) as payload;

select extensions.is(
  (select jsonb_array_length(payload) from roster_results),
  4,
  'Roster returns exactly 4 enrolled learners in cohort1'
);
select extensions.is(
  (select payload->0->>'learnerName' from roster_results),
  'Learner 1',
  'Roster includes Learner 1'
);
select extensions.is(
  (select count(*)::integer from jsonb_array_elements((select payload from roster_results)) as elem where elem->>'learnerName' = 'Learner Other'),
  0,
  'Learners from other cohorts are excluded'
);

create temp table completed_roster_results as
  select public.get_admin_cohort_roster_export((select value from exports_test_state where name = 'cohort_completed'), gen_random_uuid()) as payload;

select extensions.is(
  (select jsonb_array_length(payload) from completed_roster_results),
  1,
  'Completed cohorts remain fully exportable'
);

create temp table empty_roster_results as
  select public.get_admin_cohort_roster_export((select value from exports_test_state where name = 'cohort_empty'), gen_random_uuid()) as payload;

select extensions.is(
  (select jsonb_array_length(payload) from empty_roster_results),
  0,
  'Zero-member cohort returns empty JSON array'
);

select extensions.is(
  (select count(*)::integer from jsonb_array_elements((select payload from roster_results)) as elem where elem ? 'phone' or elem ? 'dob' or elem ? 'staffId' or elem ? 'authMetadata'),
  0,
  'Roster excludes unrelated sensitive profile metadata'
);


-- 3. Assessment results checks
create temp table assessment_pre_results as
  select public.get_admin_assessment_results_export((select value from exports_test_state where name = 'cohort1'), 'pre_test', gen_random_uuid()) as payload;

create temp table assessment_post_results as
  select public.get_admin_assessment_results_export((select value from exports_test_state where name = 'cohort1'), 'post_test', gen_random_uuid()) as payload;

select extensions.is(
  (select jsonb_array_length(payload) from assessment_pre_results),
  4,
  'Pre-test export returns all 4 cohort learners'
);
select extensions.is(
  (select jsonb_array_length(payload) from assessment_post_results),
  4,
  'Post-test export returns all 4 cohort learners'
);

-- Older submitted attempt excluded: Learner 1 should have 100%, not 40%
select extensions.is(
  (select (payload->0->>'scorePercent')::numeric from assessment_pre_results),
  100.00,
  'Older submitted attempt excluded in favor of latest (100% vs 40%)'
);

-- Same-timestamp deterministic tie-break: Learner 2 should have 50%, not 20%
select extensions.is(
  (select (payload->1->>'scorePercent')::numeric from assessment_pre_results),
  50.00,
  'Same-timestamp tie-break deterministically selects highest UUID attempt (50% vs 20%)'
);

-- In-progress excluded: Learner 2 post-test status is not_submitted
select extensions.is(
  (select payload->1->>'status' from assessment_post_results),
  'not_submitted',
  'In-progress post-test attempt excluded'
);

-- Timed-out excluded: Learner 2 post-test score is null
select extensions.is(
  (select payload->1->>'scorePercent' from assessment_post_results) is null,
  true,
  'Timed-out post-test attempt excluded from scores'
);

-- Missing result remains missing
select extensions.is(
  (select payload->3->>'status' from assessment_pre_results),
  'not_submitted',
  'Unattempted learner status remains not_submitted'
);

-- Historical quiz version preserved
select extensions.is(
  (select (payload->0->>'quizVersionNumber')::integer from assessment_pre_results),
  1,
  'Historical quiz version number preserved'
);

-- Score/pass correct
select extensions.is(
  (select (payload->0->>'passed')::boolean from assessment_pre_results),
  true,
  'Learner 1 passed flag is true (100% >= 80%)'
);
select extensions.is(
  (select (payload->2->>'passed')::boolean from assessment_post_results),
  false,
  'Learner 3 post-test passed flag is false (70% < 80%)'
);

-- No answer leakage
select extensions.is(
  (select count(*)::integer from jsonb_array_elements((select payload from assessment_pre_results)) as elem where elem ? 'answers' or elem ? 'selectedOptionId' or elem ? 'correctOptionId'),
  0,
  'Assessment export contains no question answers or options'
);


-- 4. Combined pre/post checks
create temp table pre_post_results as
  select public.get_admin_pre_post_export((select value from exports_test_state where name = 'cohort1'), gen_random_uuid()) as payload;

select extensions.is(
  (select jsonb_array_length(payload) from pre_post_results),
  4,
  'Pre/post export returns all 4 learners'
);

-- Both pre and post: Learner 1 (100 to 100 = 0 gain)
select extensions.is(
  (select (payload->0->>'learningGainPercentagePoints')::numeric from pre_post_results),
  0.00,
  'Learner 1 paired learning gain is 0.00'
);

-- Pre only: Learner 2 (pre submitted, post not submitted -> null gain)
select extensions.is(
  (select payload->1->>'learningGainPercentagePoints' from pre_post_results) is null,
  true,
  'Learner 2 unpaired post-test yields null learning gain'
);

-- Negative learning gain: Learner 3 (pre 90, post 70 -> gain -20.00)
select extensions.is(
  (select (payload->2->>'learningGainPercentagePoints')::numeric from pre_post_results),
  -20.00,
  'Learner 3 paired learning gain is negative (-20.00 percentage points)'
);

-- Neither pre nor post: Learner 4
select extensions.is(
  (select payload->3->>'preTestStatus' from pre_post_results) = 'not_submitted' and
  (select payload->3->>'postTestStatus' from pre_post_results) = 'not_submitted' and
  (select payload->3->>'learningGainPercentagePoints' from pre_post_results) is null,
  true,
  'Learner 4 unattempted pre and post yields null gain'
);


-- 5. Audit log checks
select extensions.is(
  (select count(*)::integer from public.audit_events where action = 'cohort.roster_exported' and entity_id = (select value from exports_test_state where name = 'cohort1')),
  2,
  'Audit log contains 2 roster export events for cohort1'
);
select extensions.is(
  (select count(*)::integer from public.audit_events where action = 'cohort.assessment_results_exported' and entity_id = (select value from exports_test_state where name = 'cohort1')),
  3,
  'Audit log contains 3 assessment results export events for cohort1'
);
select extensions.is(
  (select count(*)::integer from public.audit_events where action = 'cohort.pre_post_comparison_exported' and entity_id = (select value from exports_test_state where name = 'cohort1')),
  2,
  'Audit log contains 2 pre-post comparison export events for cohort1'
);

select extensions.is(
  (select (metadata->>'row_count')::integer from public.audit_events where action = 'cohort.roster_exported' and entity_id = (select value from exports_test_state where name = 'cohort1') limit 1),
  4,
  'Audit event records correct row_count metadata'
);

select extensions.is(
  (select count(*)::integer from public.audit_events where entity_id = (select value from exports_test_state where name = 'cohort1') and (metadata ? 'learnerName' or metadata ? 'learnerEmail' or metadata ? 'scorePercent' or metadata ? 'answers' or metadata ? 'csv')),
  0,
  'Audit metadata excludes sensitive learner and score fields'
);

select * from extensions.finish();
rollback;
