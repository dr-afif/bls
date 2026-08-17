create type public.quiz_type as enum ('pre_test', 'post_test');
create type public.quiz_version_status as enum ('draft', 'published', 'retired');
create type public.question_type as enum ('single_best_answer', 'true_false');
create type public.question_version_status as enum ('draft', 'approved', 'published', 'retired');
create type public.quiz_attempt_status as enum ('in_progress', 'submitted', 'timed_out', 'invalidated');

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  quiz_type public.quiz_type not null,
  title text not null check (char_length(trim(title)) between 2 and 160),
  current_version_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, course_id, slug)
);

create table public.quiz_versions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete restrict,
  version_number integer not null check (version_number > 0),
  title text not null check (char_length(trim(title)) between 2 and 160),
  instructions text not null check (char_length(trim(instructions)) between 2 and 2000),
  passing_score_percent numeric(5,2) not null check (passing_score_percent between 0 and 100),
  time_limit_minutes integer not null check (time_limit_minutes between 1 and 240),
  attempt_limit integer not null default 1 check (attempt_limit between 1 and 10),
  available_from timestamptz,
  available_until timestamptz,
  randomize_options boolean not null default true,
  show_score boolean not null default true,
  show_topic_summary boolean not null default true,
  status public.quiz_version_status not null default 'draft',
  published_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (quiz_id, version_number),
  constraint quiz_version_window_valid check (
    available_until is null or available_from is null or available_until > available_from
  ),
  constraint published_quiz_version_has_provenance check (
    status <> 'published' or (published_by is not null and published_at is not null)
  )
);

alter table public.quizzes
  add constraint quizzes_current_version_fkey
  foreign key (current_version_id) references public.quiz_versions (id) on delete restrict;

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,
  current_version_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_versions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete restrict,
  version_number integer not null check (version_number > 0),
  question_type public.question_type not null,
  prompt text not null check (char_length(trim(prompt)) between 2 and 2000),
  reference_note text,
  status public.question_version_status not null default 'draft',
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (question_id, version_number),
  constraint approved_question_version_has_provenance check (
    status not in ('approved', 'published') or (approved_by is not null and approved_at is not null)
  )
);

alter table public.questions
  add constraint questions_current_version_fkey
  foreign key (current_version_id) references public.question_versions (id) on delete restrict;

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_version_id uuid not null references public.question_versions (id) on delete restrict,
  option_text text not null check (char_length(trim(option_text)) between 1 and 1000),
  display_order integer not null check (display_order > 0),
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  unique (question_version_id, display_order)
);

create table public.question_version_topics (
  question_version_id uuid not null references public.question_versions (id) on delete restrict,
  topic_id uuid not null references public.bls_topics (id) on delete restrict,
  primary key (question_version_id, topic_id)
);

create table public.quiz_version_questions (
  quiz_version_id uuid not null references public.quiz_versions (id) on delete restrict,
  question_version_id uuid not null references public.question_versions (id) on delete restrict,
  display_order integer not null check (display_order > 0),
  points numeric(8,2) not null default 1 check (points > 0),
  primary key (quiz_version_id, question_version_id),
  unique (quiz_version_id, display_order)
);

create table public.cohort_quiz_releases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  cohort_id uuid not null references public.cohorts (id) on delete restrict,
  quiz_version_id uuid not null references public.quiz_versions (id) on delete restrict,
  released_by uuid not null references public.profiles (id) on delete restrict,
  request_id uuid not null,
  released_at timestamptz not null default now(),
  unique (cohort_id, quiz_version_id),
  unique (released_by, request_id)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,
  cohort_id uuid not null references public.cohorts (id) on delete restrict,
  learner_id uuid not null references public.profiles (id) on delete restrict,
  quiz_id uuid not null references public.quizzes (id) on delete restrict,
  quiz_version_id uuid not null references public.quiz_versions (id) on delete restrict,
  attempt_number integer not null check (attempt_number > 0),
  status public.quiz_attempt_status not null default 'in_progress',
  start_request_id uuid not null,
  submission_request_id uuid,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  score_points numeric(10,2),
  max_points numeric(10,2),
  score_percent numeric(5,2),
  passed boolean,
  topic_summary jsonb not null default '[]'::jsonb check (jsonb_typeof(topic_summary) = 'array'),
  created_at timestamptz not null default now(),
  unique (learner_id, quiz_version_id, attempt_number),
  unique (learner_id, start_request_id),
  constraint submitted_attempt_has_result check (
    status <> 'submitted' or (
      submitted_at is not null and submission_request_id is not null
      and score_points is not null and max_points is not null
      and score_percent is not null and passed is not null
    )
  )
);

create unique index quiz_attempts_one_active_idx
  on public.quiz_attempts (learner_id, quiz_version_id)
  where status = 'in_progress';

create table public.attempt_questions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts (id) on delete restrict,
  question_version_id uuid not null references public.question_versions (id) on delete restrict,
  prompt_snapshot text not null,
  question_type public.question_type not null,
  display_order integer not null check (display_order > 0),
  points numeric(8,2) not null check (points > 0),
  topic_id uuid references public.bls_topics (id) on delete restrict,
  unique (attempt_id, question_version_id),
  unique (attempt_id, display_order)
);

create table public.attempt_question_options (
  id uuid primary key default gen_random_uuid(),
  attempt_question_id uuid not null references public.attempt_questions (id) on delete restrict,
  question_option_id uuid not null references public.question_options (id) on delete restrict,
  option_text_snapshot text not null,
  display_order integer not null check (display_order > 0),
  unique (attempt_question_id, question_option_id),
  unique (attempt_question_id, display_order)
);

create table public.attempt_answers (
  attempt_question_id uuid primary key references public.attempt_questions (id) on delete restrict,
  selected_attempt_option_id uuid not null references public.attempt_question_options (id) on delete restrict,
  saved_at timestamptz not null default now(),
  submitted_at timestamptz
);

create table private.attempt_answer_scores (
  attempt_question_id uuid primary key references public.attempt_questions (id) on delete restrict,
  is_correct boolean not null,
  points_awarded numeric(8,2) not null check (points_awarded >= 0),
  scored_at timestamptz not null default now()
);

create table private.quiz_operation_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  operation text not null check (operation in ('start', 'save', 'submit', 'release')),
  occurred_at timestamptz not null default now()
);

create index quizzes_course_idx on public.quizzes (course_id, quiz_type);
create index quiz_versions_quiz_status_idx on public.quiz_versions (quiz_id, status);
create index questions_course_idx on public.questions (course_id);
create index question_versions_question_idx on public.question_versions (question_id, status);
create index question_options_version_idx on public.question_options (question_version_id);
create index question_version_topics_topic_idx on public.question_version_topics (topic_id);
create index quiz_version_questions_question_idx on public.quiz_version_questions (question_version_id);
create index cohort_quiz_releases_version_idx on public.cohort_quiz_releases (quiz_version_id);
create index quiz_attempts_learner_quiz_idx on public.quiz_attempts (learner_id, quiz_id, created_at desc);
create index quiz_attempts_cohort_idx on public.quiz_attempts (cohort_id, created_at desc);
create index quiz_attempts_version_idx on public.quiz_attempts (quiz_version_id);
create index attempt_questions_attempt_idx on public.attempt_questions (attempt_id);
create index attempt_question_options_question_idx on public.attempt_question_options (attempt_question_id);
create index attempt_answers_option_idx on public.attempt_answers (selected_attempt_option_id);
create index quiz_operation_events_limit_idx on private.quiz_operation_events (user_id, operation, occurred_at desc);

create trigger quizzes_set_updated_at before update on public.quizzes
for each row execute function private.set_updated_at();
create trigger questions_set_updated_at before update on public.questions
for each row execute function private.set_updated_at();

create function private.enforce_quiz_operation_limit(target_operation text, target_limit integer)
returns void language plpgsql security definer set search_path = '' as $$
declare actor uuid := (select auth.uid());
begin
  if actor is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  delete from private.quiz_operation_events where occurred_at < now() - interval '1 hour';
  if (select count(*) from private.quiz_operation_events
      where user_id = actor and operation = target_operation
        and occurred_at >= now() - interval '1 minute') >= target_limit then
    raise exception 'QUIZ_RATE_LIMITED' using errcode = 'P0001';
  end if;
  insert into private.quiz_operation_events (user_id, operation) values (actor, target_operation);
end;
$$;

create function private.prevent_published_quiz_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status in ('published', 'retired') then
    raise exception 'PUBLISHED_QUIZ_VERSION_IMMUTABLE' using errcode = '23514';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create function private.prevent_published_question_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status in ('published', 'retired') then
    raise exception 'PUBLISHED_QUESTION_VERSION_IMMUTABLE' using errcode = '23514';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create function private.prevent_published_child_mutation()
returns trigger language plpgsql set search_path = '' as $$
declare protected boolean;
begin
  if tg_table_name = 'question_options' then
    select qv.status in ('published', 'retired') into protected
    from public.question_versions qv where qv.id = old.question_version_id;
  elsif tg_table_name = 'question_version_topics' then
    select qv.status in ('published', 'retired') into protected
    from public.question_versions qv where qv.id = old.question_version_id;
  else
    select qv.status in ('published', 'retired') into protected
    from public.quiz_versions qv where qv.id = old.quiz_version_id;
  end if;
  if coalesce(protected, false) then
    raise exception 'PUBLISHED_ASSESSMENT_CONTENT_IMMUTABLE' using errcode = '23514';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger quiz_versions_immutable before update or delete on public.quiz_versions
for each row execute function private.prevent_published_quiz_mutation();
create trigger question_versions_immutable before update or delete on public.question_versions
for each row execute function private.prevent_published_question_mutation();
create trigger question_options_immutable before update or delete on public.question_options
for each row execute function private.prevent_published_child_mutation();
create trigger question_version_topics_immutable before update or delete on public.question_version_topics
for each row execute function private.prevent_published_child_mutation();
create trigger quiz_version_questions_immutable before update or delete on public.quiz_version_questions
for each row execute function private.prevent_published_child_mutation();

create function public.list_available_quizzes()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'quizId', q.id, 'versionId', qv.id, 'type', q.quiz_type, 'title', qv.title,
    'instructions', qv.instructions, 'timeLimitMinutes', qv.time_limit_minutes,
    'attemptLimit', qv.attempt_limit,
    'attemptsUsed', (select count(*) from public.quiz_attempts qa where qa.learner_id = (select auth.uid()) and qa.quiz_version_id = qv.id),
    'released', q.quiz_type = 'pre_test' or exists (
      select 1 from public.cohort_quiz_releases cqr
      where cqr.cohort_id = cm.cohort_id and cqr.quiz_version_id = qv.id
    ),
    'availableFrom', qv.available_from, 'availableUntil', qv.available_until
  ) order by q.quiz_type), '[]'::jsonb)
  from public.quizzes q
  join public.quiz_versions qv on qv.id = q.current_version_id and qv.status = 'published'
  join public.cohort_members cm on cm.user_id = (select auth.uid())
    and cm.member_role = 'learner' and cm.membership_status = 'active'
  join public.cohorts c on c.id = cm.cohort_id and c.course_id = q.course_id
  where private.is_active_user() and private.has_role(array['learner']::public.app_role[])
    and private.has_effective_course_access(q.course_id)
    and (qv.available_from is null or qv.available_from <= now())
    and (qv.available_until is null or qv.available_until > now());
$$;

create function public.start_quiz_attempt(target_quiz_id uuid, target_request_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid()); target_quiz public.quizzes; target_version public.quiz_versions;
  target_cohort uuid; existing_attempt public.quiz_attempts; new_attempt_id uuid := gen_random_uuid();
  next_attempt integer; question_count integer;
begin
  perform private.enforce_quiz_operation_limit('start', 10);
  if not private.is_active_user() or not private.has_role(array['learner']::public.app_role[]) then
    raise exception 'QUIZ_ACCESS_DENIED' using errcode = '42501';
  end if;
  select * into target_quiz from public.quizzes where id = target_quiz_id for update;
  if target_quiz.id is null or not private.has_effective_course_access(target_quiz.course_id) then
    raise exception 'QUIZ_ACCESS_DENIED' using errcode = '42501';
  end if;
  select * into target_version from public.quiz_versions
    where id = target_quiz.current_version_id and status = 'published' for share;
  if target_version.id is null then raise exception 'QUIZ_UNAVAILABLE' using errcode = 'P0001'; end if;
  if (target_version.available_from is not null and target_version.available_from > now())
    or (target_version.available_until is not null and target_version.available_until <= now()) then
    raise exception 'QUIZ_WINDOW_CLOSED' using errcode = 'P0001';
  end if;
  select cm.cohort_id into target_cohort from public.cohort_members cm
  join public.cohorts c on c.id = cm.cohort_id
  where cm.user_id = actor and cm.member_role = 'learner' and cm.membership_status = 'active'
    and c.course_id = target_quiz.course_id and c.status in ('scheduled', 'active') limit 1;
  if target_cohort is null then raise exception 'QUIZ_ACCESS_DENIED' using errcode = '42501'; end if;
  if target_quiz.quiz_type = 'post_test' and not exists (
    select 1 from public.cohort_quiz_releases where cohort_id = target_cohort and quiz_version_id = target_version.id
  ) then raise exception 'POST_TEST_NOT_RELEASED' using errcode = 'P0001'; end if;
  select * into existing_attempt from public.quiz_attempts
    where learner_id = actor and quiz_version_id = target_version.id and status = 'in_progress' for update;
  if existing_attempt.id is not null then
    return jsonb_build_object('attemptId', existing_attempt.id, 'status', existing_attempt.status,
      'startedAt', existing_attempt.started_at, 'expiresAt', existing_attempt.expires_at,
      'resumed', true);
  end if;
  select count(*) + 1 into next_attempt from public.quiz_attempts
    where learner_id = actor and quiz_version_id = target_version.id;
  if next_attempt > target_version.attempt_limit then raise exception 'ATTEMPT_LIMIT_REACHED' using errcode = 'P0001'; end if;
  select count(*) into question_count from public.quiz_version_questions where quiz_version_id = target_version.id;
  if question_count = 0 then raise exception 'QUIZ_HAS_NO_QUESTIONS' using errcode = 'P0001'; end if;
  insert into public.quiz_attempts (
    id, organization_id, course_id, cohort_id, learner_id, quiz_id, quiz_version_id,
    attempt_number, start_request_id, expires_at
  ) values (
    new_attempt_id, target_quiz.organization_id, target_quiz.course_id, target_cohort, actor,
    target_quiz.id, target_version.id, next_attempt, target_request_id,
    now() + make_interval(mins => target_version.time_limit_minutes)
  );
  insert into public.attempt_questions (
    attempt_id, question_version_id, prompt_snapshot, question_type, display_order, points, topic_id
  )
  select new_attempt_id, qv.id, qv.prompt, qv.question_type, qvq.display_order, qvq.points,
    (select qvt.topic_id from public.question_version_topics qvt where qvt.question_version_id = qv.id order by qvt.topic_id limit 1)
  from public.quiz_version_questions qvq
  join public.question_versions qv on qv.id = qvq.question_version_id
  where qvq.quiz_version_id = target_version.id order by qvq.display_order;
  insert into public.attempt_question_options (
    attempt_question_id, question_option_id, option_text_snapshot, display_order
  )
  select aq.id, qo.id, qo.option_text,
    row_number() over (partition by aq.id order by
      case when target_version.randomize_options then md5(new_attempt_id::text || qo.id::text) else lpad(qo.display_order::text, 8, '0') end
    )
  from public.attempt_questions aq join public.question_options qo on qo.question_version_id = aq.question_version_id
  where aq.attempt_id = new_attempt_id;
  insert into public.audit_events (actor_user_id, action, entity_type, entity_id, organization_id, request_id, metadata)
  values (actor, 'quiz.attempt_started', 'quiz_attempt', new_attempt_id, target_quiz.organization_id,
    target_request_id, jsonb_build_object('quizId', target_quiz.id, 'quizVersionId', target_version.id, 'cohortId', target_cohort));
  return jsonb_build_object('attemptId', new_attempt_id, 'status', 'in_progress',
    'startedAt', now(), 'expiresAt', now() + make_interval(mins => target_version.time_limit_minutes), 'resumed', false);
exception when unique_violation then
  select * into existing_attempt from public.quiz_attempts where learner_id = actor and start_request_id = target_request_id;
  if existing_attempt.id is not null then return jsonb_build_object('attemptId', existing_attempt.id, 'status', existing_attempt.status,
    'startedAt', existing_attempt.started_at, 'expiresAt', existing_attempt.expires_at, 'resumed', true); end if;
  raise;
end;
$$;

create function public.get_quiz_attempt_payload(target_attempt_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := (select auth.uid()); target_attempt public.quiz_attempts;
begin
  select * into target_attempt from public.quiz_attempts where id = target_attempt_id;
  if target_attempt.id is null or target_attempt.learner_id <> actor or not private.is_active_user() then
    raise exception 'QUIZ_ACCESS_DENIED' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'attemptId', target_attempt.id, 'status', target_attempt.status, 'expiresAt', target_attempt.expires_at,
    'questions', coalesce((select jsonb_agg(jsonb_build_object(
      'attemptQuestionId', aq.id, 'prompt', aq.prompt_snapshot, 'type', aq.question_type,
      'displayOrder', aq.display_order, 'selectedOptionId', aa.selected_attempt_option_id,
      'options', (select jsonb_agg(jsonb_build_object('id', aqo.id, 'text', aqo.option_text_snapshot,
        'displayOrder', aqo.display_order) order by aqo.display_order)
        from public.attempt_question_options aqo where aqo.attempt_question_id = aq.id)
    ) order by aq.display_order) from public.attempt_questions aq
      left join public.attempt_answers aa on aa.attempt_question_id = aq.id
      where aq.attempt_id = target_attempt.id), '[]'::jsonb)
  );
end;
$$;

create function public.save_quiz_answer(target_attempt_question_id uuid, target_attempt_option_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid := (select auth.uid()); target_attempt public.quiz_attempts; saved_time timestamptz := now();
begin
  perform private.enforce_quiz_operation_limit('save', 120);
  select qa.* into target_attempt from public.attempt_questions aq
    join public.quiz_attempts qa on qa.id = aq.attempt_id
    where aq.id = target_attempt_question_id for update of qa;
  if target_attempt.id is null or target_attempt.learner_id <> actor or not private.is_active_user() then
    raise exception 'QUIZ_ACCESS_DENIED' using errcode = '42501';
  end if;
  if target_attempt.status <> 'in_progress' then raise exception 'ATTEMPT_NOT_EDITABLE' using errcode = 'P0001'; end if;
  if target_attempt.expires_at <= now() then
    update public.quiz_attempts set status = 'timed_out' where id = target_attempt.id;
    raise exception 'ATTEMPT_EXPIRED' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.attempt_question_options
    where id = target_attempt_option_id and attempt_question_id = target_attempt_question_id) then
    raise exception 'INVALID_ANSWER_OPTION' using errcode = 'P0001';
  end if;
  insert into public.attempt_answers (attempt_question_id, selected_attempt_option_id, saved_at)
  values (target_attempt_question_id, target_attempt_option_id, saved_time)
  on conflict (attempt_question_id) do update set selected_attempt_option_id = excluded.selected_attempt_option_id,
    saved_at = excluded.saved_at where public.attempt_answers.submitted_at is null;
  return jsonb_build_object('savedAt', saved_time);
end;
$$;

create function public.submit_quiz_attempt(target_attempt_id uuid, target_submission_request_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid := (select auth.uid()); target_attempt public.quiz_attempts; target_version public.quiz_versions;
  total_score numeric(10,2); total_max numeric(10,2); result_percent numeric(5,2); result_passed boolean;
  summary jsonb;
begin
  perform private.enforce_quiz_operation_limit('submit', 10);
  select * into target_attempt from public.quiz_attempts where id = target_attempt_id for update;
  if target_attempt.id is null or target_attempt.learner_id <> actor or not private.is_active_user() then
    raise exception 'QUIZ_ACCESS_DENIED' using errcode = '42501';
  end if;
  if target_attempt.status = 'submitted' then
    if target_attempt.submission_request_id <> target_submission_request_id then
      raise exception 'ATTEMPT_ALREADY_SUBMITTED' using errcode = 'P0001';
    end if;
    return jsonb_build_object('attemptId', target_attempt.id, 'status', target_attempt.status,
      'scorePercent', target_attempt.score_percent, 'passed', target_attempt.passed,
      'topicSummary', target_attempt.topic_summary);
  end if;
  if target_attempt.status <> 'in_progress' then raise exception 'ATTEMPT_NOT_SUBMITTABLE' using errcode = 'P0001'; end if;
  if target_attempt.expires_at <= now() then
    update public.quiz_attempts set status = 'timed_out' where id = target_attempt.id;
    raise exception 'ATTEMPT_EXPIRED' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.attempt_questions aq where aq.attempt_id = target_attempt.id
    and not exists (select 1 from public.attempt_answers aa where aa.attempt_question_id = aq.id)) then
    raise exception 'QUIZ_INCOMPLETE' using errcode = 'P0001';
  end if;
  select * into target_version from public.quiz_versions where id = target_attempt.quiz_version_id;
  insert into private.attempt_answer_scores (attempt_question_id, is_correct, points_awarded)
  select aq.id, qo.is_correct, case when qo.is_correct then aq.points else 0 end
  from public.attempt_questions aq join public.attempt_answers aa on aa.attempt_question_id = aq.id
  join public.attempt_question_options aqo on aqo.id = aa.selected_attempt_option_id
  join public.question_options qo on qo.id = aqo.question_option_id
  where aq.attempt_id = target_attempt.id;
  select coalesce(sum(s.points_awarded), 0), sum(aq.points) into total_score, total_max
  from public.attempt_questions aq join private.attempt_answer_scores s on s.attempt_question_id = aq.id
  where aq.attempt_id = target_attempt.id;
  result_percent := round(total_score * 100 / nullif(total_max, 0), 2);
  result_passed := result_percent >= target_version.passing_score_percent;
  select coalesce(jsonb_agg(jsonb_build_object('topicId', topic_id, 'earned', earned, 'possible', possible,
    'percent', round(earned * 100 / nullif(possible, 0), 2)) order by topic_id), '[]'::jsonb) into summary
  from (select aq.topic_id, sum(s.points_awarded) earned, sum(aq.points) possible
    from public.attempt_questions aq join private.attempt_answer_scores s on s.attempt_question_id = aq.id
    where aq.attempt_id = target_attempt.id and aq.topic_id is not null group by aq.topic_id) topics;
  update public.attempt_answers aa set submitted_at = now()
  from public.attempt_questions aq where aq.id = aa.attempt_question_id and aq.attempt_id = target_attempt.id;
  update public.quiz_attempts set status = 'submitted', submission_request_id = target_submission_request_id,
    submitted_at = now(), score_points = total_score, max_points = total_max,
    score_percent = result_percent, passed = result_passed, topic_summary = summary
  where id = target_attempt.id;
  insert into public.audit_events (actor_user_id, action, entity_type, entity_id, organization_id, request_id, metadata)
  values (actor, 'quiz.attempt_submitted', 'quiz_attempt', target_attempt.id, target_attempt.organization_id,
    target_submission_request_id, jsonb_build_object('quizId', target_attempt.quiz_id, 'quizVersionId', target_attempt.quiz_version_id));
  return jsonb_build_object('attemptId', target_attempt.id, 'status', 'submitted',
    'scorePercent', case when target_version.show_score then result_percent else null end,
    'passed', case when target_version.show_score then result_passed else null end,
    'topicSummary', case when target_version.show_topic_summary then summary else '[]'::jsonb end);
end;
$$;

create function public.release_cohort_post_test(target_cohort_id uuid, target_quiz_id uuid, target_request_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid := (select auth.uid()); target_quiz public.quizzes; target_cohort public.cohorts; release_id uuid;
begin
  perform private.enforce_quiz_operation_limit('release', 20);
  select * into target_quiz from public.quizzes where id = target_quiz_id for share;
  select * into target_cohort from public.cohorts where id = target_cohort_id for share;
  if target_quiz.id is null or target_cohort.id is null or target_quiz.quiz_type <> 'post_test'
    or target_quiz.course_id <> target_cohort.course_id or target_quiz.organization_id <> target_cohort.organization_id
    or not (private.is_admin_in_organization(target_quiz.organization_id) or private.is_assigned_instructor(target_cohort.id)) then
    raise exception 'QUIZ_RELEASE_DENIED' using errcode = '42501';
  end if;
  if not exists (select 1 from public.quiz_versions where id = target_quiz.current_version_id and status = 'published') then
    raise exception 'QUIZ_UNAVAILABLE' using errcode = 'P0001';
  end if;
  insert into public.cohort_quiz_releases (organization_id, cohort_id, quiz_version_id, released_by, request_id)
  values (target_quiz.organization_id, target_cohort.id, target_quiz.current_version_id, actor, target_request_id)
  on conflict (cohort_id, quiz_version_id) do nothing returning id into release_id;
  if release_id is null then select id into release_id from public.cohort_quiz_releases
    where cohort_id = target_cohort.id and quiz_version_id = target_quiz.current_version_id; end if;
  if not exists (select 1 from public.audit_events where action = 'quiz.post_test_released' and entity_id = release_id) then
    insert into public.audit_events (actor_user_id, action, entity_type, entity_id, organization_id, request_id, metadata)
    values (actor, 'quiz.post_test_released', 'cohort_quiz_release', release_id, target_quiz.organization_id,
      target_request_id, jsonb_build_object('cohortId', target_cohort.id, 'quizId', target_quiz.id,
        'quizVersionId', target_quiz.current_version_id));
  end if;
  return jsonb_build_object('releaseId', release_id, 'released', true);
end;
$$;

alter table public.quizzes enable row level security;
alter table public.quiz_versions enable row level security;
alter table public.questions enable row level security;
alter table public.question_versions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_version_topics enable row level security;
alter table public.quiz_version_questions enable row level security;
alter table public.cohort_quiz_releases enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.attempt_questions enable row level security;
alter table public.attempt_question_options enable row level security;
alter table public.attempt_answers enable row level security;

create policy quiz_admin_all on public.quizzes for all to authenticated
using (private.is_admin_in_organization(organization_id)) with check (private.is_admin_in_organization(organization_id));
create policy quiz_version_admin_all on public.quiz_versions for all to authenticated
using (private.is_admin_in_organization(private.course_organization_id((select q.course_id from public.quizzes q where q.id = quiz_id))))
with check (private.is_admin_in_organization(private.course_organization_id((select q.course_id from public.quizzes q where q.id = quiz_id))));
create policy question_admin_all on public.questions for all to authenticated
using (private.is_admin_in_organization(organization_id)) with check (private.is_admin_in_organization(organization_id));
create policy question_version_admin_all on public.question_versions for all to authenticated
using (private.is_admin_in_organization((select q.organization_id from public.questions q where q.id = question_id)))
with check (private.is_admin_in_organization((select q.organization_id from public.questions q where q.id = question_id)));
create policy question_option_admin_all on public.question_options for all to authenticated
using (private.is_admin_in_organization((select q.organization_id from public.question_versions qv join public.questions q on q.id = qv.question_id where qv.id = question_version_id)))
with check (private.is_admin_in_organization((select q.organization_id from public.question_versions qv join public.questions q on q.id = qv.question_id where qv.id = question_version_id)));
create policy question_topic_admin_all on public.question_version_topics for all to authenticated
using (private.is_admin_in_organization((select q.organization_id from public.question_versions qv join public.questions q on q.id = qv.question_id where qv.id = question_version_id)))
with check (private.is_admin_in_organization((select q.organization_id from public.question_versions qv join public.questions q on q.id = qv.question_id where qv.id = question_version_id)));
create policy quiz_question_admin_all on public.quiz_version_questions for all to authenticated
using (private.is_admin_in_organization((select q.organization_id from public.quiz_versions qv join public.quizzes q on q.id = qv.quiz_id where qv.id = quiz_version_id)))
with check (private.is_admin_in_organization((select q.organization_id from public.quiz_versions qv join public.quizzes q on q.id = qv.quiz_id where qv.id = quiz_version_id)));
create policy release_admin_instructor_read on public.cohort_quiz_releases for select to authenticated
using (private.is_admin_in_organization(organization_id) or private.is_assigned_instructor(cohort_id));
create policy attempt_permitted_read on public.quiz_attempts for select to authenticated using (
  learner_id = (select auth.uid()) or private.is_admin_in_organization(organization_id) or private.is_assigned_instructor(cohort_id)
);

revoke all on all tables in schema public from anon;
revoke all on table public.quizzes, public.quiz_versions, public.questions, public.question_versions,
  public.question_options, public.question_version_topics, public.quiz_version_questions,
  public.cohort_quiz_releases, public.quiz_attempts, public.attempt_questions,
  public.attempt_question_options, public.attempt_answers from authenticated;
grant select, insert, update on public.quizzes, public.quiz_versions, public.questions,
  public.question_versions, public.question_options, public.question_version_topics,
  public.quiz_version_questions to authenticated;
grant select on public.cohort_quiz_releases, public.quiz_attempts to authenticated;

revoke all on function public.list_available_quizzes() from public, anon;
revoke all on function public.start_quiz_attempt(uuid, uuid) from public, anon;
revoke all on function public.get_quiz_attempt_payload(uuid) from public, anon;
revoke all on function public.save_quiz_answer(uuid, uuid) from public, anon;
revoke all on function public.submit_quiz_attempt(uuid, uuid) from public, anon;
revoke all on function public.release_cohort_post_test(uuid, uuid, uuid) from public, anon;
grant execute on function public.list_available_quizzes() to authenticated, service_role;
grant execute on function public.start_quiz_attempt(uuid, uuid) to authenticated, service_role;
grant execute on function public.get_quiz_attempt_payload(uuid) to authenticated, service_role;
grant execute on function public.save_quiz_answer(uuid, uuid) to authenticated, service_role;
grant execute on function public.submit_quiz_attempt(uuid, uuid) to authenticated, service_role;
grant execute on function public.release_cohort_post_test(uuid, uuid, uuid) to authenticated, service_role;

revoke all on all tables in schema private from public, anon, authenticated;
revoke all on function private.enforce_quiz_operation_limit(text, integer) from public, anon, authenticated;
revoke all on function private.prevent_published_quiz_mutation() from public, anon, authenticated;
revoke all on function private.prevent_published_question_mutation() from public, anon, authenticated;
revoke all on function private.prevent_published_child_mutation() from public, anon, authenticated;

comment on function public.get_quiz_attempt_payload(uuid) is
  'Returns an owned attempt with frozen prompt/option snapshots and selections. It never returns answer keys or per-answer correctness.';
comment on table private.attempt_answer_scores is
  'Server-owned immutable scoring detail. It is intentionally outside the exposed Data API schemas.';
