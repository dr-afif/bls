begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select extensions.plan(29);

select extensions.has_function(
  'public', 'admin_create_question_draft',
  array['uuid', 'public.question_type', 'text', 'text', 'uuid[]', 'text[]', 'integer'],
  'administrator question draft function exists'
);
select extensions.has_function(
  'public', 'admin_publish_quiz_version', array['uuid'],
  'administrator quiz publication function exists'
);

create temporary table authoring_test_state (
  name text primary key,
  value uuid not null
);
grant all on table authoring_test_state to authenticated;
insert into authoring_test_state values
  ('learner', (select id from auth.users where email = 'learner@bls.local')),
  ('instructor', (select id from auth.users where email = 'instructor@bls.local')),
  ('admin', (select id from auth.users where email = 'admin@bls.local')),
  ('course', gen_random_uuid()),
  ('topic', (select id from public.bls_topics where active order by display_order limit 1));

insert into public.courses (id, slug, title, organization_id) values
  ((select value from authoring_test_state where name = 'course'), 'authoring-course', 'Authoring Course', (select id from public.organizations limit 1));

set local role anon;
select extensions.throws_ok(
  $$select public.admin_create_question_draft(
    (select value from authoring_test_state where name = 'course'),
    'true_false', 'Fictional authoring test prompt', 'Non-clinical test reference',
    array[(select value from authoring_test_state where name = 'topic')],
    array['Fictional option A', 'Fictional option B'], 1
  )$$, '42501', null, 'anonymous users cannot author questions'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select value from authoring_test_state where name = 'learner'),
  'role', 'authenticated'
)::text, true);
select extensions.throws_ok(
  $$select public.admin_create_question_draft(
    (select value from authoring_test_state where name = 'course'),
    'true_false', 'Fictional authoring test prompt', 'Non-clinical test reference',
    array[(select value from authoring_test_state where name = 'topic')],
    array['Fictional option A', 'Fictional option B'], 1
  )$$, '42501', 'QUIZ_ADMIN_REQUIRED', 'learners cannot author questions'
);

select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select value from authoring_test_state where name = 'instructor'),
  'role', 'authenticated'
)::text, true);
select extensions.throws_ok(
  $$select public.admin_create_question_draft(
    (select value from authoring_test_state where name = 'course'),
    'true_false', 'Fictional authoring test prompt', 'Non-clinical test reference',
    array[(select value from authoring_test_state where name = 'topic')],
    array['Fictional option A', 'Fictional option B'], 1
  )$$, '42501', 'QUIZ_ADMIN_REQUIRED', 'instructors cannot author questions'
);

select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select value from authoring_test_state where name = 'admin'),
  'role', 'authenticated'
)::text, true);
select extensions.throws_ok(
  $$insert into public.questions (organization_id, course_id)
    select organization_id, id from public.courses where id =
      (select value from authoring_test_state where name = 'course')$$,
  '42501', null, 'administrators cannot bypass controlled authoring with direct inserts'
);
select extensions.throws_ok(
  $$select public.admin_create_question_draft(
    (select value from authoring_test_state where name = 'course'),
    'true_false', 'Invalid fictional true-false prompt', '',
    array[(select value from authoring_test_state where name = 'topic')],
    array['One', 'Two', 'Three'], 1
  )$$, '23514', 'TRUE_FALSE_REQUIRES_TWO_OPTIONS',
  'true-false questions require exactly two options'
);

create temporary table new_question as
select * from public.admin_create_question_draft(
  (select value from authoring_test_state where name = 'course'),
  'single_best_answer', 'Which fictional option is marked for this non-clinical test?',
  'Fictional test reference only',
  array[(select value from authoring_test_state where name = 'topic')],
  array['Fictional option A', 'Fictional option B', 'Fictional option C'], 2
);
select extensions.is((select count(*) from new_question), 1::bigint,
  'administrator creates one stable question and draft version atomically');
select extensions.is(
  (select count(*) from public.question_options where question_version_id =
    (select version_id from new_question)), 3::bigint,
  'question draft contains every ordered option'
);
select extensions.is(
  (select count(*) from public.question_options where question_version_id =
    (select version_id from new_question) and is_correct), 1::bigint,
  'question draft contains exactly one correctness key'
);
select extensions.is(
  (select count(*) from public.question_version_topics where question_version_id =
    (select version_id from new_question)), 1::bigint,
  'question draft contains its topic assignment'
);
select extensions.is(
  (select count(*) from public.audit_events where action = 'quiz.question_created'
    and entity_id = (select question_id from new_question)), 1::bigint,
  'question creation is audit recorded'
);
select extensions.lives_ok(
  $$select public.admin_replace_question_draft(
    (select version_id from new_question), 'true_false',
    'Updated fictional true-false authoring prompt', 'Updated fictional reference',
    array[(select value from authoring_test_state where name = 'topic')],
    array['Fictional true', 'Fictional false'], 1
  )$$, 'administrator atomically replaces editable question content'
);
select extensions.is(
  (select count(*) from public.question_options where question_version_id =
    (select version_id from new_question)), 2::bigint,
  'question option replacement does not leave stale child rows'
);
select extensions.lives_ok(
  $$select public.admin_publish_question_version((select version_id from new_question))$$,
  'administrator publishes a valid question version'
);
select extensions.is(
  (select current_version_id from public.questions where id =
    (select question_id from new_question)),
  (select version_id from new_question),
  'published question becomes the stable identity current version'
);
select extensions.throws_ok(
  $$select public.admin_replace_question_draft(
    (select version_id from new_question), 'true_false', 'Tampered prompt', '',
    array[(select value from authoring_test_state where name = 'topic')],
    array['One', 'Two'], 1
  )$$, '23514', 'QUESTION_VERSION_NOT_EDITABLE',
  'published questions cannot be edited through the authoring function'
);
select extensions.lives_ok(
  $$select public.admin_create_question_version_draft((select question_id from new_question))$$,
  'administrator can branch a new draft from the current published question'
);
select extensions.throws_ok(
  $$select public.admin_create_question_version_draft((select question_id from new_question))$$,
  '23505', null, 'a stable question cannot have two concurrent drafts'
);

create temporary table new_quiz as
select * from public.admin_create_quiz_draft(
  (select value from authoring_test_state where name = 'course'),
  'phase-5-2-authoring-test', 'pre_test', 'Fictional Phase 5.2 pre-test',
  'This assessment contains fictional non-clinical development content.',
  80, 10, 1, true, array[(select version_id from new_question)]
);
select extensions.is((select count(*) from new_quiz), 1::bigint,
  'administrator creates one quiz and composed draft version atomically');
select extensions.is(
  (select count(*) from public.quiz_version_questions where quiz_version_id =
    (select version_id from new_quiz)), 1::bigint,
  'quiz draft contains its ordered published question composition'
);
select extensions.throws_ok(
  $$select public.admin_create_quiz_draft(
    (select value from authoring_test_state where name = 'course'),
    'phase-5-2-invalid', 'post_test', 'Invalid fictional quiz',
    'Fictional test instructions', 80, 10, 1, true, array[]::uuid[]
  )$$, '23514', 'QUIZ_QUESTIONS_INVALID', 'quiz drafts require published questions'
);
select extensions.lives_ok(
  $$select public.admin_publish_quiz_version((select version_id from new_quiz))$$,
  'administrator publishes a valid quiz version'
);
select extensions.is(
  (select current_version_id from public.quizzes where id =
    (select quiz_id from new_quiz)),
  (select version_id from new_quiz),
  'published quiz becomes the stable identity current version'
);
select extensions.is(
  (select count(*) from public.audit_events where action = 'quiz.version_published'
    and entity_id = (select version_id from new_quiz)), 1::bigint,
  'quiz publication is audit recorded'
);
select extensions.throws_ok(
  $$select public.admin_replace_quiz_draft(
    (select version_id from new_quiz), 'Tampered quiz', 'Tampered', 1, 1, 1,
    null, null, true, array[(select version_id from new_question)]
  )$$, '23514', 'QUIZ_VERSION_NOT_EDITABLE',
  'published quiz versions cannot be edited through the authoring function'
);
select extensions.lives_ok(
  $$select public.admin_create_quiz_version_draft((select quiz_id from new_quiz))$$,
  'administrator can branch a new draft from the current published quiz'
);
select extensions.throws_ok(
  $$select public.admin_create_quiz_version_draft((select quiz_id from new_quiz))$$,
  '23505', null, 'a stable quiz cannot have two concurrent drafts'
);
select extensions.is(
  (select count(*) from public.audit_events where action like 'quiz.%'
    and entity_id in (
      (select question_id from new_question), (select version_id from new_question),
      (select quiz_id from new_quiz), (select version_id from new_quiz)
    )) >= 5,
  true, 'material authoring operations create append-only audit events'
);

select * from extensions.finish();
rollback;
