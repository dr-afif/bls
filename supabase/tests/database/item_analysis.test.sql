begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

-- Plan tests
select extensions.plan(25);

-- Setup
create table if not exists item_analysis_test_state (name text primary key, value uuid);
grant all on table item_analysis_test_state to authenticated;
grant all on table item_analysis_test_state to anon;

insert into item_analysis_test_state (name, value) values ('org1', gen_random_uuid()), ('org2', gen_random_uuid());
insert into public.organizations (id, name, slug) values
  ((select value from item_analysis_test_state where name = 'org1'), 'Test Org 1', 'test-org-1'),
  ((select value from item_analysis_test_state where name = 'org2'), 'Test Org 2', 'test-org-2');

insert into item_analysis_test_state (name, value) values ('course1', gen_random_uuid());
insert into public.courses (id, slug, title, organization_id) values
  ((select value from item_analysis_test_state where name = 'course1'), 'test-course', 'Test Course', (select value from item_analysis_test_state where name = 'org1'));

insert into item_analysis_test_state (name, value) values ('cohort1', gen_random_uuid());
insert into public.cohorts (id, course_id, organization_id, name, code, status, start_at, end_at) values
  ((select value from item_analysis_test_state where name = 'cohort1'), (select value from item_analysis_test_state where name = 'course1'), (select value from item_analysis_test_state where name = 'org1'), 'Test Cohort 1', 'COHORT-1', 'active', now(), now() + interval '1 day');

insert into item_analysis_test_state (name, value) values ('pretest1', gen_random_uuid());
insert into public.quizzes (id, organization_id, course_id, slug, quiz_type, title) values
  ((select value from item_analysis_test_state where name = 'pretest1'), (select value from item_analysis_test_state where name = 'org1'), (select value from item_analysis_test_state where name = 'course1'), 'pre-test', 'pre_test', 'Pre Test');

-- Users
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin1@bls.local'),
  ('22222222-2222-2222-2222-222222222222', 'admin2@bls.local'),
  ('33333333-3333-3333-3333-333333333333', 'inst1@bls.local'),
  ('44444444-4444-4444-4444-444444444444', 'learner1@bls.local'),
  ('55555555-5555-5555-5555-555555555555', 'learner2@bls.local');

update public.profiles set full_name = 'Admin 1', organization_id = (select value from item_analysis_test_state where name = 'org1'), account_status = 'active' where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set full_name = 'Admin 2', organization_id = (select value from item_analysis_test_state where name = 'org2'), account_status = 'active' where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set full_name = 'Inst 1', organization_id = (select value from item_analysis_test_state where name = 'org1'), account_status = 'active' where id = '33333333-3333-3333-3333-333333333333';
update public.profiles set full_name = 'Learner 1', organization_id = (select value from item_analysis_test_state where name = 'org1'), account_status = 'active' where id = '44444444-4444-4444-4444-444444444444';
update public.profiles set full_name = 'Learner 2', organization_id = (select value from item_analysis_test_state where name = 'org1'), account_status = 'active' where id = '55555555-5555-5555-5555-555555555555';

insert into public.user_roles (user_id, role) values
  ('11111111-1111-1111-1111-111111111111', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'admin'),
  ('33333333-3333-3333-3333-333333333333', 'instructor'),
  ('44444444-4444-4444-4444-444444444444', 'learner'),
  ('55555555-5555-5555-5555-555555555555', 'learner');

insert into public.cohort_members (cohort_id, user_id, member_role) values
  ((select value from item_analysis_test_state where name = 'cohort1'), '33333333-3333-3333-3333-333333333333', 'instructor'),
  ((select value from item_analysis_test_state where name = 'cohort1'), '44444444-4444-4444-4444-444444444444', 'learner'),
  ((select value from item_analysis_test_state where name = 'cohort1'), '55555555-5555-5555-5555-555555555555', 'learner');

-- Access tests
select extensions.throws_ok(
  'select public.get_admin_cohort_item_analysis(''' || (select value from item_analysis_test_state where name = 'cohort1') || ''', ''pre_test'')',
  '42501', 'AUTH_REQUIRED',
  'Anonymous denied'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
select extensions.throws_ok(
  'select public.get_admin_cohort_item_analysis(''' || (select value from item_analysis_test_state where name = 'cohort1') || ''', ''pre_test'')',
  '42501', 'ACCESS_DENIED',
  'Learner denied'
);

select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select extensions.throws_ok(
  'select public.get_admin_cohort_item_analysis(''' || (select value from item_analysis_test_state where name = 'cohort1') || ''', ''pre_test'')',
  '42501', 'ACCESS_DENIED',
  'Instructor denied'
);

select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select extensions.throws_ok(
  'select public.get_admin_cohort_item_analysis(''' || (select value from item_analysis_test_state where name = 'cohort1') || ''', ''pre_test'')',
  '42501', 'ACCESS_DENIED',
  'Cross-org admin denied'
);

select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select extensions.lives_ok(
  'select public.get_admin_cohort_item_analysis(''' || (select value from item_analysis_test_state where name = 'cohort1') || ''', ''pre_test'')',
  'Same-org admin allowed'
);

-- Empty state test
select extensions.is(
  (select public.get_admin_cohort_item_analysis((select value from item_analysis_test_state where name = 'cohort1'), 'pre_test')->>'analyzedLearnerCount'),
  '0',
  'Empty state learner count is 0'
);

-- Create Question A version 1 and Question A version 2
set local role postgres;
insert into item_analysis_test_state (name, value) values ('q1', gen_random_uuid());
insert into public.questions (id, organization_id, course_id) values
  ((select value from item_analysis_test_state where name = 'q1'), (select value from item_analysis_test_state where name = 'org1'), (select value from item_analysis_test_state where name = 'course1'));

insert into item_analysis_test_state (name, value) values ('qv1', gen_random_uuid()), ('qv2', gen_random_uuid());
insert into item_analysis_test_state (name, value) values ('topic1', gen_random_uuid());
insert into public.bls_topics (id, organization_id, slug, name) values ((select value from item_analysis_test_state where name = 'topic1'), (select value from item_analysis_test_state where name = 'org1'), 'test-topic', 'Test Topic');

insert into public.question_versions (id, question_id, version_number, question_type, prompt, status) values
  ((select value from item_analysis_test_state where name = 'qv1'), (select value from item_analysis_test_state where name = 'q1'), 1, 'single_best_answer', 'Prompt V1', 'draft');

insert into item_analysis_test_state (name, value) values ('qv1_opt1', gen_random_uuid()), ('qv1_opt2', gen_random_uuid()), ('qv1_opt3', gen_random_uuid()), ('qv1_opt4', gen_random_uuid());
insert into public.question_options (id, question_version_id, option_text, display_order, is_correct) values
  ((select value from item_analysis_test_state where name = 'qv1_opt1'), (select value from item_analysis_test_state where name = 'qv1'), 'Option A V1', 1, true),
  ((select value from item_analysis_test_state where name = 'qv1_opt2'), (select value from item_analysis_test_state where name = 'qv1'), 'Option B V1', 2, false),
  ((select value from item_analysis_test_state where name = 'qv1_opt3'), (select value from item_analysis_test_state where name = 'qv1'), 'Option C V1', 3, false),
  ((select value from item_analysis_test_state where name = 'qv1_opt4'), (select value from item_analysis_test_state where name = 'qv1'), 'Option D V1', 4, false);

insert into public.question_version_topics (question_version_id, topic_id) values ((select value from item_analysis_test_state where name = 'qv1'), (select value from item_analysis_test_state where name = 'topic1'));

update public.question_versions set status = 'published', approved_by = '11111111-1111-1111-1111-111111111111', approved_at = now() where id = (select value from item_analysis_test_state where name = 'qv1');

insert into public.question_versions (id, question_id, version_number, question_type, prompt, status) values
  ((select value from item_analysis_test_state where name = 'qv2'), (select value from item_analysis_test_state where name = 'q1'), 2, 'single_best_answer', 'Prompt V2', 'draft');

insert into item_analysis_test_state (name, value) values ('qv2_opt1', gen_random_uuid()), ('qv2_opt2', gen_random_uuid());
insert into public.question_options (id, question_version_id, option_text, display_order, is_correct) values
  ((select value from item_analysis_test_state where name = 'qv2_opt1'), (select value from item_analysis_test_state where name = 'qv2'), 'Option A V2', 1, false),
  ((select value from item_analysis_test_state where name = 'qv2_opt2'), (select value from item_analysis_test_state where name = 'qv2'), 'Option B V2', 2, true);

insert into public.question_version_topics (question_version_id, topic_id) values ((select value from item_analysis_test_state where name = 'qv2'), (select value from item_analysis_test_state where name = 'topic1'));

update public.question_versions set status = 'published', approved_by = '11111111-1111-1111-1111-111111111111', approved_at = now() where id = (select value from item_analysis_test_state where name = 'qv2');
update public.questions set current_version_id = (select value from item_analysis_test_state where name = 'qv2') where id = (select value from item_analysis_test_state where name = 'q1');

-- Add to quiz version
insert into item_analysis_test_state (name, value) values ('quiz_v1', gen_random_uuid());
insert into public.quiz_versions (id, quiz_id, version_number, title, instructions, passing_score_percent, time_limit_minutes, status) values
  ((select value from item_analysis_test_state where name = 'quiz_v1'), (select value from item_analysis_test_state where name = 'pretest1'), 1, 'Pre Test V1', 'Instr', 80, 60, 'draft');

insert into public.quiz_version_questions (quiz_version_id, question_version_id, display_order) values
  ((select value from item_analysis_test_state where name = 'quiz_v1'), (select value from item_analysis_test_state where name = 'qv1'), 1),
  ((select value from item_analysis_test_state where name = 'quiz_v1'), (select value from item_analysis_test_state where name = 'qv2'), 2);

update public.quiz_versions set status = 'published', published_by = '11111111-1111-1111-1111-111111111111', published_at = now() where id = (select value from item_analysis_test_state where name = 'quiz_v1');
update public.quizzes set current_version_id = (select value from item_analysis_test_state where name = 'quiz_v1') where id = (select value from item_analysis_test_state where name = 'pretest1');

-- Set local role postgres to manipulate private tables directly for fixture setup
set local role postgres;

-- Insert Attempts
-- L1 Attempt 1 (submitted) - Q1V1 correct, Q1V2 incorrect
insert into item_analysis_test_state (name, value) values ('a1', gen_random_uuid());
insert into public.quiz_attempts (id, organization_id, course_id, cohort_id, learner_id, quiz_id, quiz_version_id, attempt_number, status, start_request_id, submission_request_id, expires_at, submitted_at, score_points, max_points, score_percent, passed) values
  ((select value from item_analysis_test_state where name = 'a1'), (select value from item_analysis_test_state where name = 'org1'), (select value from item_analysis_test_state where name = 'course1'), (select value from item_analysis_test_state where name = 'cohort1'), '44444444-4444-4444-4444-444444444444', (select value from item_analysis_test_state where name = 'pretest1'), (select value from item_analysis_test_state where name = 'quiz_v1'), 1, 'submitted', gen_random_uuid(), gen_random_uuid(), now(), now(), 1, 2, 50, false);
insert into public.attempt_questions (id, attempt_id, question_version_id, prompt_snapshot, question_type, display_order, points) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', (select value from item_analysis_test_state where name = 'a1'), (select value from item_analysis_test_state where name = 'qv1'), 'Prompt V1', 'single_best_answer', 1, 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', (select value from item_analysis_test_state where name = 'a1'), (select value from item_analysis_test_state where name = 'qv2'), 'Prompt V2', 'single_best_answer', 2, 1);
insert into public.attempt_question_options (id, attempt_question_id, question_option_id, option_text_snapshot, display_order) values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', (select value from item_analysis_test_state where name = 'qv1_opt1'), 'Option A V1', 1),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', (select value from item_analysis_test_state where name = 'qv1_opt2'), 'Option B V1', 2),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', (select value from item_analysis_test_state where name = 'qv1_opt3'), 'Option C V1', 3),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', (select value from item_analysis_test_state where name = 'qv2_opt1'), 'Option A V2', 1),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', (select value from item_analysis_test_state where name = 'qv2_opt2'), 'Option B V2', 2);
insert into public.attempt_answers (attempt_question_id, selected_attempt_option_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'cccccccc-cccc-cccc-cccc-ccccccccccc2');
insert into private.attempt_answer_scores (attempt_question_id, is_correct, points_awarded) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', true, 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', false, 0);

-- L2 Attempt 1 (submitted early, superseded)
insert into item_analysis_test_state (name, value) values ('a2', gen_random_uuid());
insert into public.quiz_attempts (id, organization_id, course_id, cohort_id, learner_id, quiz_id, quiz_version_id, attempt_number, status, start_request_id, submission_request_id, expires_at, submitted_at, score_points, max_points, score_percent, passed) values
  ((select value from item_analysis_test_state where name = 'a2'), (select value from item_analysis_test_state where name = 'org1'), (select value from item_analysis_test_state where name = 'course1'), (select value from item_analysis_test_state where name = 'cohort1'), '55555555-5555-5555-5555-555555555555', (select value from item_analysis_test_state where name = 'pretest1'), (select value from item_analysis_test_state where name = 'quiz_v1'), 1, 'submitted', gen_random_uuid(), gen_random_uuid(), now(), now() - interval '1 day', 0, 2, 0, false);
-- This should not be included since L2 has a later submitted attempt.

-- L2 Attempt 2 (submitted) - Q1V1 correct, Q1V2 correct
insert into item_analysis_test_state (name, value) values ('a3', gen_random_uuid());
insert into public.quiz_attempts (id, organization_id, course_id, cohort_id, learner_id, quiz_id, quiz_version_id, attempt_number, status, start_request_id, submission_request_id, expires_at, submitted_at, score_points, max_points, score_percent, passed) values
  ((select value from item_analysis_test_state where name = 'a3'), (select value from item_analysis_test_state where name = 'org1'), (select value from item_analysis_test_state where name = 'course1'), (select value from item_analysis_test_state where name = 'cohort1'), '55555555-5555-5555-5555-555555555555', (select value from item_analysis_test_state where name = 'pretest1'), (select value from item_analysis_test_state where name = 'quiz_v1'), 2, 'submitted', gen_random_uuid(), gen_random_uuid(), now(), now(), 2, 2, 100, true);
insert into public.attempt_questions (id, attempt_id, question_version_id, prompt_snapshot, question_type, display_order, points) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', (select value from item_analysis_test_state where name = 'a3'), (select value from item_analysis_test_state where name = 'qv1'), 'Prompt V1', 'single_best_answer', 1, 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', (select value from item_analysis_test_state where name = 'a3'), (select value from item_analysis_test_state where name = 'qv2'), 'Prompt V2', 'single_best_answer', 2, 1);
insert into public.attempt_question_options (id, attempt_question_id, question_option_id, option_text_snapshot, display_order) values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', (select value from item_analysis_test_state where name = 'qv1_opt1'), 'Option A V1', 1),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', (select value from item_analysis_test_state where name = 'qv1_opt2'), 'Option B V1', 2),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd4', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', (select value from item_analysis_test_state where name = 'qv1_opt3'), 'Option C V1', 3),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', (select value from item_analysis_test_state where name = 'qv2_opt2'), 'Option B V2', 1),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd5', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', (select value from item_analysis_test_state where name = 'qv2_opt1'), 'Option A V2', 2);
insert into public.attempt_answers (attempt_question_id, selected_attempt_option_id) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'dddddddd-dddd-dddd-dddd-ddddddddddd1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'dddddddd-dddd-dddd-dddd-ddddddddddd2');
insert into private.attempt_answer_scores (attempt_question_id, is_correct, points_awarded) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', true, 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', true, 1);

-- Back to admin role for querying
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

-- Verification
create temp table ia_results as
  select public.get_admin_cohort_item_analysis((select value from item_analysis_test_state where name = 'cohort1'), 'pre_test') as payload;

select extensions.is(
  (select payload->>'analyzedLearnerCount' from ia_results), '2', '2 learners analyzed (L1 attempt 1, L2 attempt 2)'
);

select extensions.is(
  (select jsonb_array_length(payload->'items') from ia_results), 2, '2 distinct item versions found'
);

-- Check QV1 item stats (2 responses, both correct)
select extensions.is(
  (select (payload->'items'->0->>'responseCount')::integer from ia_results), 2, 'QV1 responseCount = 2'
);
select extensions.is(
  (select (payload->'items'->0->>'correctResponseCount')::integer from ia_results), 2, 'QV1 correctResponseCount = 2'
);
select extensions.is(
  (select (payload->'items'->0->>'correctResponseRate')::numeric from ia_results), 100.00, 'QV1 correctResponseRate = 100%'
);

-- Check QV1 option 1 (Option A) stats (selected twice)
select extensions.is(
  (select (payload->'items'->0->'options'->0->>'selectedCount')::integer from ia_results), 2, 'QV1 Option A selected count = 2'
);
select extensions.is(
  (select (payload->'items'->0->'options'->0->>'selectionPercent')::numeric from ia_results), 100.00, 'QV1 Option A selection percent = 100%'
);
select extensions.is(
  (select (payload->'items'->0->'options'->0->>'isCorrect')::boolean from ia_results), true, 'QV1 Option A is correct flag true'
);

-- Check QV1 option 2 (Option B) stats (selected zero)
select extensions.is(
  (select (payload->'items'->0->'options'->1->>'selectedCount')::integer from ia_results), 0, 'QV1 Option B selected count = 0'
);
select extensions.is(
  (select (payload->'items'->0->'options'->1->>'selectionPercent')::numeric from ia_results), 0.00, 'QV1 Option B selection percent = 0%'
);

-- Check QV2 item stats (2 responses, 1 correct)
select extensions.is(
  (select (payload->'items'->1->>'responseCount')::integer from ia_results), 2, 'QV2 responseCount = 2'
);
select extensions.is(
  (select (payload->'items'->1->>'correctResponseCount')::integer from ia_results), 1, 'QV2 correctResponseCount = 1'
);
select extensions.is(
  (select (payload->'items'->1->>'correctResponseRate')::numeric from ia_results), 50.00, 'QV2 correctResponseRate = 50%'
);
select extensions.is(
  (select (payload->'items'->1->>'questionVersionId') from ia_results),
  (select value::text from item_analysis_test_state where name = 'qv2'),
  'QV2 version separated from QV1'
);

-- Option distractor correctness checks
select extensions.is(
  (select (payload->'items'->1->'options'->0->>'isCorrect')::boolean from ia_results), false, 'QV2 Option A is marked incorrect distractor'
);
select extensions.is(
  (select (payload->'items'->1->'options'->1->>'isCorrect')::boolean from ia_results), true, 'QV2 Option B is marked correct'
);

-- Privacy assertions
select extensions.is(
  (select payload::text like '%learnerId%' from ia_results), false, 'No learnerId in payload'
);
select extensions.is(
  (select payload::text like '%attemptId%' from ia_results), false, 'No attemptId in payload'
);
select extensions.is(
  (select payload::text like '%learnerName%' from ia_results), false, 'No learnerName in payload'
);

select * from extensions.finish();
rollback;
