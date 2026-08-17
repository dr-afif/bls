begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select extensions.plan(38);

select extensions.has_table('public', 'quizzes', 'quizzes table exists');
select extensions.has_table('public', 'quiz_versions', 'quiz versions table exists');
select extensions.has_table('public', 'question_versions', 'question versions table exists');
select extensions.has_table('public', 'question_options', 'question options table exists');
select extensions.has_table('public', 'quiz_attempts', 'quiz attempts table exists');
select extensions.has_table('private', 'attempt_answer_scores', 'private answer scores table exists');

create temporary table quiz_test_state (
  name text primary key,
  value uuid not null
);
grant all on table quiz_test_state to authenticated;

insert into quiz_test_state values
  ('learner', (select id from auth.users where email = 'learner@bls.local')),
  ('instructor', (select id from auth.users where email = 'instructor@bls.local')),
  ('admin', (select id from auth.users where email = 'admin@bls.local')),
  ('cohort', (select cm.cohort_id from public.cohort_members cm
    join auth.users u on u.id = cm.user_id
    where u.email = 'learner@bls.local' and cm.member_role = 'learner'
      and cm.membership_status = 'active' limit 1));

set local role anon;
select extensions.throws_ok(
  $$select public.list_available_quizzes()$$, '42501', null,
  'anonymous users cannot list quiz availability'
);
select extensions.throws_ok(
  $$select public.start_quiz_attempt(
    '18000000-0000-0000-0000-000000000001',
    '19000000-0000-0000-0000-000000000001'
  )$$, '42501', null, 'anonymous users cannot start attempts'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select value from quiz_test_state where name = 'learner'),
  'role', 'authenticated'
)::text, true);

select extensions.results_eq(
  'select count(*) from public.question_options', array[0::bigint],
  'learner cannot read question options or correctness flags directly'
);
select extensions.is(
  jsonb_array_length(public.list_available_quizzes()), 2,
  'eligible learner sees the pre-test and post-test availability records'
);
select extensions.is(
  (select item ->> 'released' from jsonb_array_elements(public.list_available_quizzes()) item
    where item ->> 'type' = 'post_test'),
  'false', 'post-test is visibly unreleased before an authorized release'
);
select extensions.throws_ok(
  $$select public.start_quiz_attempt(
    '18000000-0000-0000-0000-000000000002',
    '19000000-0000-0000-0000-000000000002'
  )$$, 'P0001', 'POST_TEST_NOT_RELEASED',
  'learner cannot start an unreleased post-test'
);

select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select value from quiz_test_state where name = 'instructor'),
  'role', 'authenticated'
)::text, true);
select extensions.lives_ok(
  format($query$select public.release_cohort_post_test(%L, %L, %L)$query$,
    (select value from quiz_test_state where name = 'cohort'),
    '18000000-0000-0000-0000-000000000002',
    '19000000-0000-0000-0000-000000000003'),
  'assigned instructor can release the cohort post-test'
);
set local role postgres;
select extensions.results_eq(
  $$select count(*) from public.audit_events where action = 'quiz.post_test_released'
    and request_id = '19000000-0000-0000-0000-000000000003'$$,
  array[1::bigint], 'post-test release creates one audit event'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select value from quiz_test_state where name = 'learner'),
  'role', 'authenticated'
)::text, true);
select extensions.lives_ok(
  $$select public.start_quiz_attempt(
    '18000000-0000-0000-0000-000000000001',
    '19000000-0000-0000-0000-000000000004'
  )$$, 'eligible learner can start the pre-test'
);

insert into quiz_test_state (name, value)
select 'attempt', (public.start_quiz_attempt(
  '18000000-0000-0000-0000-000000000001',
  '19000000-0000-0000-0000-000000000004'
) ->> 'attemptId')::uuid;

select extensions.is(
  (public.start_quiz_attempt(
    '18000000-0000-0000-0000-000000000001',
    '19000000-0000-0000-0000-000000000004'
  ) ->> 'attemptId')::uuid,
  (select value from quiz_test_state where name = 'attempt'),
  'repeated start returns the same active frozen attempt'
);
select extensions.is(
  jsonb_array_length(public.get_quiz_attempt_payload(
    (select value from quiz_test_state where name = 'attempt')
  ) -> 'questions'), 2, 'attempt payload contains its frozen questions'
);
select extensions.ok(
  public.get_quiz_attempt_payload((select value from quiz_test_state where name = 'attempt'))::text
    !~* 'is_correct|iscorrect|correctanswer|correct_answer',
  'learner payload does not disclose answer keys or correctness'
);
select extensions.results_eq(
  $$select sum(jsonb_array_length(question -> 'options'))::bigint
    from jsonb_array_elements(public.get_quiz_attempt_payload(
      (select value from quiz_test_state where name = 'attempt')
    ) -> 'questions') question$$,
  array[4::bigint], 'attempt freezes option snapshots for both questions'
);
select extensions.throws_ok(
  $$select public.save_quiz_answer(
    (public.get_quiz_attempt_payload(
      (select value from quiz_test_state where name = 'attempt')
    ) -> 'questions' -> 0 ->> 'attemptQuestionId')::uuid,
    '19999999-0000-0000-0000-000000000001'
  )$$, 'P0001', 'INVALID_ANSWER_OPTION',
  'autosave rejects an option outside the frozen attempt question'
);
select extensions.throws_ok(
  $$update public.quiz_attempts set score_percent = 100
    where id = (select value from quiz_test_state where name = 'attempt')$$,
  '42501', null, 'learner cannot write a final score directly'
);

set local role postgres;
insert into quiz_test_state (name, value)
select 'question_one', aq.id from public.attempt_questions aq
where aq.attempt_id = (select value from quiz_test_state where name = 'attempt')
order by aq.display_order limit 1;
insert into quiz_test_state (name, value)
select 'question_two', aq.id from public.attempt_questions aq
where aq.attempt_id = (select value from quiz_test_state where name = 'attempt')
order by aq.display_order offset 1 limit 1;
insert into quiz_test_state (name, value)
select 'option_one', aqo.id from public.attempt_question_options aqo
join public.question_options qo on qo.id = aqo.question_option_id
where aqo.attempt_question_id = (select value from quiz_test_state where name = 'question_one')
  and qo.is_correct limit 1;
insert into quiz_test_state (name, value)
select 'option_two', aqo.id from public.attempt_question_options aqo
join public.question_options qo on qo.id = aqo.question_option_id
where aqo.attempt_question_id = (select value from quiz_test_state where name = 'question_two')
  and qo.is_correct limit 1;

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select value from quiz_test_state where name = 'learner'),
  'role', 'authenticated'
)::text, true);
select extensions.lives_ok(
  format($query$select public.save_quiz_answer(%L, %L)$query$,
    (select value from quiz_test_state where name = 'question_one'),
    (select value from quiz_test_state where name = 'option_one')),
  'learner can autosave an owned frozen answer'
);
select extensions.throws_ok(
  format($query$select public.submit_quiz_attempt(%L, %L)$query$,
    (select value from quiz_test_state where name = 'attempt'),
    '19000000-0000-0000-0000-000000000005'),
  'P0001', 'QUIZ_INCOMPLETE', 'submission requires every assigned question'
);
select extensions.lives_ok(
  format($query$select public.save_quiz_answer(%L, %L)$query$,
    (select value from quiz_test_state where name = 'question_two'),
    (select value from quiz_test_state where name = 'option_two')),
  'learner can autosave the remaining owned answer'
);
select extensions.lives_ok(
  format($query$select public.submit_quiz_attempt(%L, %L)$query$,
    (select value from quiz_test_state where name = 'attempt'),
    '19000000-0000-0000-0000-000000000005'),
  'server submits and scores a complete attempt'
);
select extensions.results_eq(
  $$select score_percent from public.quiz_attempts
    where id = (select value from quiz_test_state where name = 'attempt')$$,
  array[100.00::numeric], 'server-calculated score is persisted'
);
select extensions.results_eq(
  $$select passed from public.quiz_attempts
    where id = (select value from quiz_test_state where name = 'attempt')$$,
  array[true], 'server-calculated pass state is persisted'
);
select extensions.lives_ok(
  format($query$select public.submit_quiz_attempt(%L, %L)$query$,
    (select value from quiz_test_state where name = 'attempt'),
    '19000000-0000-0000-0000-000000000005'),
  'submission is idempotent for the same request UUID'
);
select extensions.throws_ok(
  format($query$select public.submit_quiz_attempt(%L, %L)$query$,
    (select value from quiz_test_state where name = 'attempt'),
    '19000000-0000-0000-0000-000000000006'),
  'P0001', 'ATTEMPT_ALREADY_SUBMITTED',
  'a different submission UUID cannot resubmit the attempt'
);
select extensions.throws_ok(
  $$select count(*) from private.attempt_answer_scores$$, '42501', null,
  'learner cannot read private per-answer scoring detail'
);
select extensions.throws_ok(
  format($query$select public.save_quiz_answer(%L, %L)$query$,
    (select value from quiz_test_state where name = 'question_one'),
    (select value from quiz_test_state where name = 'option_one')),
  'P0001', 'ATTEMPT_NOT_EDITABLE', 'submitted answers cannot be changed'
);

select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select value from quiz_test_state where name = 'admin'),
  'role', 'authenticated'
)::text, true);
select extensions.throws_ok(
  $$update public.question_versions set prompt = 'Tampered'
    where id = '18300000-0000-0000-0000-000000000001'$$,
  '42501', null,
  'direct question-version updates are denied before immutability enforcement'
);
select extensions.throws_ok(
  $$insert into public.question_options (
      question_version_id, option_text, display_order, is_correct
    ) values (
      '18300000-0000-0000-0000-000000000001', 'Late option', 99, false
    )$$,
  '42501', null,
  'direct option inserts are denied before immutability enforcement'
);
select extensions.results_eq(
  $$select count(*) from public.audit_events where action = 'quiz.attempt_started'
    and request_id = '19000000-0000-0000-0000-000000000004'$$,
  array[1::bigint], 'attempt start creates one idempotent audit event'
);
select extensions.results_eq(
  $$select count(*) from public.audit_events where action = 'quiz.attempt_submitted'
    and request_id = '19000000-0000-0000-0000-000000000005'$$,
  array[1::bigint], 'submission creates one idempotent audit event'
);

select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select value from quiz_test_state where name = 'learner'),
  'role', 'authenticated'
)::text, true);
select extensions.throws_ok(
  $$select public.start_quiz_attempt(
    '18000000-0000-0000-0000-000000000001',
    '19000000-0000-0000-0000-000000000007'
  )$$, 'P0001', 'ATTEMPT_LIMIT_REACHED',
  'attempt limit is enforced after submission'
);

select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select value from quiz_test_state where name = 'instructor'),
  'role', 'authenticated'
)::text, true);
select extensions.results_eq(
  $$select count(*) from public.quiz_attempts
    where id = (select value from quiz_test_state where name = 'attempt')$$,
  array[1::bigint], 'assigned instructor can read permitted attempt completion and result'
);
select extensions.results_eq(
  'select count(*) from public.question_options', array[0::bigint],
  'instructor cannot read question options or answer keys'
);

select * from extensions.finish();
rollback;
