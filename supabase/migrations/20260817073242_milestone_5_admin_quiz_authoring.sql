-- Milestone 5 Phase 2: atomic, audited administrator authoring operations.

create function private.require_quiz_admin(target_organization_id uuid)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := (select auth.uid());
begin
  if actor is null or not private.is_admin_in_organization(target_organization_id) then
    raise exception 'QUIZ_ADMIN_REQUIRED' using errcode = '42501';
  end if;
  return actor;
end;
$$;

create function private.validate_question_draft_input(
  target_organization_id uuid,
  target_question_type public.question_type,
  target_topic_ids uuid[],
  target_option_texts text[],
  target_correct_option integer
)
returns void language plpgsql stable security definer set search_path = '' as $$
declare
  option_count integer := coalesce(array_length(target_option_texts, 1), 0);
  topic_count integer := coalesce(array_length(target_topic_ids, 1), 0);
begin
  if option_count < 2 or option_count > 8
    or target_correct_option < 1 or target_correct_option > option_count then
    raise exception 'QUESTION_OPTIONS_INVALID' using errcode = '23514';
  end if;
  if target_question_type = 'true_false' and option_count <> 2 then
    raise exception 'TRUE_FALSE_REQUIRES_TWO_OPTIONS' using errcode = '23514';
  end if;
  if exists (
    select 1 from unnest(target_option_texts) option_text
    where char_length(trim(option_text)) not between 1 and 1000
  ) then
    raise exception 'QUESTION_OPTION_TEXT_INVALID' using errcode = '23514';
  end if;
  if topic_count < 1
    or topic_count <> (select count(distinct topic_id) from unnest(target_topic_ids) topic_id)
    or exists (
      select 1 from unnest(target_topic_ids) topic_id
      left join public.bls_topics topic on topic.id = topic_id
      where topic.id is null or topic.organization_id <> target_organization_id or not topic.active
    ) then
    raise exception 'QUESTION_TOPICS_INVALID' using errcode = '23514';
  end if;
end;
$$;

create function public.admin_create_question_draft(
  target_course_id uuid,
  target_question_type public.question_type,
  target_prompt text,
  target_reference_note text,
  target_topic_ids uuid[],
  target_option_texts text[],
  target_correct_option integer
)
returns table (question_id uuid, version_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid;
  target_organization uuid;
  new_question_id uuid := gen_random_uuid();
  new_version_id uuid := gen_random_uuid();
begin
  select organization_id into target_organization from public.courses where id = target_course_id;
  if target_organization is null then raise exception 'COURSE_NOT_FOUND' using errcode = 'P0001'; end if;
  actor := private.require_quiz_admin(target_organization);
  perform private.validate_question_draft_input(
    target_organization, target_question_type, target_topic_ids,
    target_option_texts, target_correct_option
  );
  insert into public.questions (id, organization_id, course_id, created_by, updated_by)
  values (new_question_id, target_organization, target_course_id, actor, actor);
  insert into public.question_versions (
    id, question_id, version_number, question_type, prompt, reference_note, created_by
  ) values (
    new_version_id, new_question_id, 1, target_question_type, trim(target_prompt),
    nullif(trim(target_reference_note), ''), actor
  );
  insert into public.question_options (question_version_id, option_text, display_order, is_correct)
  select new_version_id, trim(option_text), option_order::integer, option_order = target_correct_option
  from unnest(target_option_texts) with ordinality as option_rows(option_text, option_order);
  insert into public.question_version_topics (question_version_id, topic_id)
  select new_version_id, topic_id from unnest(target_topic_ids) topic_id;
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id, metadata
  ) values (
    actor, 'quiz.question_created', 'question', new_question_id, target_organization,
    jsonb_build_object('versionId', new_version_id, 'versionNumber', 1)
  );
  return query select new_question_id, new_version_id;
end;
$$;

create function public.admin_create_question_version_draft(target_question_id uuid)
returns table (version_id uuid, version_number integer)
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid;
  target_question public.questions;
  source_version public.question_versions;
  next_version integer;
  new_version_id uuid := gen_random_uuid();
begin
  select * into target_question from public.questions where id = target_question_id for update;
  if target_question.id is null then raise exception 'QUESTION_NOT_FOUND' using errcode = 'P0001'; end if;
  actor := private.require_quiz_admin(target_question.organization_id);
  select * into source_version from public.question_versions
  where id = target_question.current_version_id and status = 'published';
  if source_version.id is null then
    raise exception 'PUBLISHED_QUESTION_VERSION_REQUIRED' using errcode = '23514';
  end if;
  select coalesce(max(qv.version_number), 0) + 1 into next_version
  from public.question_versions qv where qv.question_id = target_question_id;
  insert into public.question_versions (
    id, question_id, version_number, question_type, prompt, reference_note, created_by
  ) values (
    new_version_id, target_question_id, next_version, source_version.question_type,
    source_version.prompt, source_version.reference_note, actor
  );
  insert into public.question_options (question_version_id, option_text, display_order, is_correct)
  select new_version_id, option_text, display_order, is_correct
  from public.question_options where question_version_id = source_version.id;
  insert into public.question_version_topics (question_version_id, topic_id)
  select new_version_id, topic_id
  from public.question_version_topics where question_version_id = source_version.id;
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id, metadata
  ) values (
    actor, 'quiz.question_version_created', 'question_version', new_version_id,
    target_question.organization_id,
    jsonb_build_object('questionId', target_question_id, 'versionNumber', next_version)
  );
  return query select new_version_id, next_version;
end;
$$;

create function public.admin_replace_question_draft(
  target_version_id uuid,
  target_question_type public.question_type,
  target_prompt text,
  target_reference_note text,
  target_topic_ids uuid[],
  target_option_texts text[],
  target_correct_option integer
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid;
  target_version public.question_versions;
  target_organization uuid;
begin
  select * into target_version from public.question_versions where id = target_version_id for update;
  if target_version.id is null then raise exception 'QUESTION_VERSION_NOT_FOUND' using errcode = 'P0001'; end if;
  select organization_id into target_organization
  from public.questions where id = target_version.question_id;
  actor := private.require_quiz_admin(target_organization);
  if target_version.status <> 'draft' then
    raise exception 'QUESTION_VERSION_NOT_EDITABLE' using errcode = '23514';
  end if;
  perform private.validate_question_draft_input(
    target_organization, target_question_type, target_topic_ids,
    target_option_texts, target_correct_option
  );
  update public.question_versions
  set question_type = target_question_type,
      prompt = trim(target_prompt),
      reference_note = nullif(trim(target_reference_note), '')
  where id = target_version_id;
  delete from public.question_options where question_version_id = target_version_id;
  insert into public.question_options (question_version_id, option_text, display_order, is_correct)
  select target_version_id, trim(option_text), option_order::integer, option_order = target_correct_option
  from unnest(target_option_texts) with ordinality as option_rows(option_text, option_order);
  delete from public.question_version_topics where question_version_id = target_version_id;
  insert into public.question_version_topics (question_version_id, topic_id)
  select target_version_id, topic_id from unnest(target_topic_ids) topic_id;
  update public.questions set updated_by = actor where id = target_version.question_id;
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id, metadata
  ) values (
    actor, 'quiz.question_draft_updated', 'question_version', target_version_id,
    target_organization,
    jsonb_build_object('questionId', target_version.question_id, 'versionNumber', target_version.version_number)
  );
end;
$$;

create function public.admin_publish_question_version(target_version_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid;
  target_version public.question_versions;
  target_organization uuid;
begin
  select * into target_version from public.question_versions where id = target_version_id for update;
  if target_version.id is null then raise exception 'QUESTION_VERSION_NOT_FOUND' using errcode = 'P0001'; end if;
  select organization_id into target_organization
  from public.questions where id = target_version.question_id for share;
  actor := private.require_quiz_admin(target_organization);
  if target_version.status <> 'draft' then
    raise exception 'QUESTION_VERSION_NOT_PUBLISHABLE' using errcode = '23514';
  end if;
  update public.question_versions
  set status = 'published', approved_by = actor, approved_at = now()
  where id = target_version_id;
  update public.questions
  set current_version_id = target_version_id, updated_by = actor
  where id = target_version.question_id;
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id, metadata
  ) values (
    actor, 'quiz.question_version_published', 'question_version', target_version_id,
    target_organization,
    jsonb_build_object('questionId', target_version.question_id, 'versionNumber', target_version.version_number)
  );
end;
$$;

create function private.validate_quiz_draft_questions(
  target_course_id uuid,
  target_question_version_ids uuid[]
)
returns void language plpgsql stable security definer set search_path = '' as $$
declare question_count integer := coalesce(array_length(target_question_version_ids, 1), 0);
begin
  if question_count < 1 or question_count > 100
    or question_count <> (
      select count(distinct version_id) from unnest(target_question_version_ids) version_id
    )
    or exists (
      select 1 from unnest(target_question_version_ids) version_id
      left join public.question_versions qv on qv.id = version_id
      left join public.questions question on question.id = qv.question_id
      where qv.id is null or qv.status <> 'published' or question.course_id <> target_course_id
    ) then
    raise exception 'QUIZ_QUESTIONS_INVALID' using errcode = '23514';
  end if;
end;
$$;

create function public.admin_create_quiz_draft(
  target_course_id uuid,
  target_slug text,
  target_quiz_type public.quiz_type,
  target_title text,
  target_instructions text,
  target_passing_score_percent numeric,
  target_time_limit_minutes integer,
  target_attempt_limit integer,
  target_randomize_options boolean,
  target_question_version_ids uuid[]
)
returns table (quiz_id uuid, version_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid;
  target_organization uuid;
  new_quiz_id uuid := gen_random_uuid();
  new_version_id uuid := gen_random_uuid();
begin
  select organization_id into target_organization from public.courses where id = target_course_id;
  if target_organization is null then raise exception 'COURSE_NOT_FOUND' using errcode = 'P0001'; end if;
  actor := private.require_quiz_admin(target_organization);
  perform private.validate_quiz_draft_questions(target_course_id, target_question_version_ids);
  insert into public.quizzes (
    id, organization_id, course_id, slug, quiz_type, title, created_by, updated_by
  ) values (
    new_quiz_id, target_organization, target_course_id, lower(trim(target_slug)),
    target_quiz_type, trim(target_title), actor, actor
  );
  insert into public.quiz_versions (
    id, quiz_id, version_number, title, instructions, passing_score_percent,
    time_limit_minutes, attempt_limit, randomize_options, show_score,
    show_topic_summary, created_by
  ) values (
    new_version_id, new_quiz_id, 1, trim(target_title), trim(target_instructions),
    target_passing_score_percent, target_time_limit_minutes, target_attempt_limit,
    target_randomize_options, true, true, actor
  );
  insert into public.quiz_version_questions (
    quiz_version_id, question_version_id, display_order, points
  )
  select new_version_id, version_id, version_order::integer, 1
  from unnest(target_question_version_ids) with ordinality as versions(version_id, version_order);
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id, metadata
  ) values (
    actor, 'quiz.created', 'quiz', new_quiz_id, target_organization,
    jsonb_build_object('versionId', new_version_id, 'versionNumber', 1, 'quizType', target_quiz_type)
  );
  return query select new_quiz_id, new_version_id;
end;
$$;

create function public.admin_create_quiz_version_draft(target_quiz_id uuid)
returns table (version_id uuid, version_number integer)
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid;
  target_quiz public.quizzes;
  source_version public.quiz_versions;
  next_version integer;
  new_version_id uuid := gen_random_uuid();
begin
  select * into target_quiz from public.quizzes where id = target_quiz_id for update;
  if target_quiz.id is null then raise exception 'QUIZ_NOT_FOUND' using errcode = 'P0001'; end if;
  actor := private.require_quiz_admin(target_quiz.organization_id);
  select * into source_version from public.quiz_versions
  where id = target_quiz.current_version_id and status = 'published';
  if source_version.id is null then
    raise exception 'PUBLISHED_QUIZ_VERSION_REQUIRED' using errcode = '23514';
  end if;
  select coalesce(max(qv.version_number), 0) + 1 into next_version
  from public.quiz_versions qv where qv.quiz_id = target_quiz_id;
  insert into public.quiz_versions (
    id, quiz_id, version_number, title, instructions, passing_score_percent,
    time_limit_minutes, attempt_limit, available_from, available_until,
    randomize_options, show_score, show_topic_summary, created_by
  ) values (
    new_version_id, target_quiz_id, next_version, source_version.title,
    source_version.instructions, source_version.passing_score_percent,
    source_version.time_limit_minutes, source_version.attempt_limit,
    source_version.available_from, source_version.available_until,
    source_version.randomize_options, true, true, actor
  );
  insert into public.quiz_version_questions (
    quiz_version_id, question_version_id, display_order, points
  )
  select new_version_id, question_version_id, display_order, points
  from public.quiz_version_questions where quiz_version_id = source_version.id;
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id, metadata
  ) values (
    actor, 'quiz.version_created', 'quiz_version', new_version_id,
    target_quiz.organization_id,
    jsonb_build_object('quizId', target_quiz_id, 'versionNumber', next_version)
  );
  return query select new_version_id, next_version;
end;
$$;

create function public.admin_replace_quiz_draft(
  target_version_id uuid,
  target_title text,
  target_instructions text,
  target_passing_score_percent numeric,
  target_time_limit_minutes integer,
  target_attempt_limit integer,
  target_available_from timestamptz,
  target_available_until timestamptz,
  target_randomize_options boolean,
  target_question_version_ids uuid[]
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid;
  target_version public.quiz_versions;
  target_quiz public.quizzes;
begin
  select * into target_version from public.quiz_versions where id = target_version_id for update;
  if target_version.id is null then raise exception 'QUIZ_VERSION_NOT_FOUND' using errcode = 'P0001'; end if;
  select * into target_quiz from public.quizzes where id = target_version.quiz_id for update;
  actor := private.require_quiz_admin(target_quiz.organization_id);
  if target_version.status <> 'draft' then
    raise exception 'QUIZ_VERSION_NOT_EDITABLE' using errcode = '23514';
  end if;
  perform private.validate_quiz_draft_questions(target_quiz.course_id, target_question_version_ids);
  update public.quiz_versions
  set title = trim(target_title),
      instructions = trim(target_instructions),
      passing_score_percent = target_passing_score_percent,
      time_limit_minutes = target_time_limit_minutes,
      attempt_limit = target_attempt_limit,
      available_from = target_available_from,
      available_until = target_available_until,
      randomize_options = target_randomize_options,
      show_score = true,
      show_topic_summary = true
  where id = target_version_id;
  delete from public.quiz_version_questions where quiz_version_id = target_version_id;
  insert into public.quiz_version_questions (
    quiz_version_id, question_version_id, display_order, points
  )
  select target_version_id, version_id, version_order::integer, 1
  from unnest(target_question_version_ids) with ordinality as versions(version_id, version_order);
  update public.quizzes set title = trim(target_title), updated_by = actor where id = target_quiz.id;
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id, metadata
  ) values (
    actor, 'quiz.draft_updated', 'quiz_version', target_version_id,
    target_quiz.organization_id,
    jsonb_build_object('quizId', target_quiz.id, 'versionNumber', target_version.version_number)
  );
end;
$$;

create function public.admin_publish_quiz_version(target_version_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid;
  target_version public.quiz_versions;
  target_quiz public.quizzes;
begin
  select * into target_version from public.quiz_versions where id = target_version_id for update;
  if target_version.id is null then raise exception 'QUIZ_VERSION_NOT_FOUND' using errcode = 'P0001'; end if;
  select * into target_quiz from public.quizzes where id = target_version.quiz_id for update;
  actor := private.require_quiz_admin(target_quiz.organization_id);
  if target_version.status <> 'draft' then
    raise exception 'QUIZ_VERSION_NOT_PUBLISHABLE' using errcode = '23514';
  end if;
  update public.quiz_versions
  set status = 'published', published_by = actor, published_at = now()
  where id = target_version_id;
  update public.quizzes
  set current_version_id = target_version_id, title = target_version.title, updated_by = actor
  where id = target_quiz.id;
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id, metadata
  ) values (
    actor, 'quiz.version_published', 'quiz_version', target_version_id,
    target_quiz.organization_id,
    jsonb_build_object('quizId', target_quiz.id, 'versionNumber', target_version.version_number)
  );
end;
$$;

revoke insert, update, delete on public.quizzes, public.quiz_versions,
  public.questions, public.question_versions, public.question_options,
  public.question_version_topics, public.quiz_version_questions
from authenticated;

revoke all on function private.require_quiz_admin(uuid) from public, anon, authenticated;
revoke all on function private.validate_question_draft_input(uuid, public.question_type, uuid[], text[], integer) from public, anon, authenticated;
revoke all on function private.validate_quiz_draft_questions(uuid, uuid[]) from public, anon, authenticated;

revoke all on function public.admin_create_question_draft(uuid, public.question_type, text, text, uuid[], text[], integer) from public, anon;
revoke all on function public.admin_create_question_version_draft(uuid) from public, anon;
revoke all on function public.admin_replace_question_draft(uuid, public.question_type, text, text, uuid[], text[], integer) from public, anon;
revoke all on function public.admin_publish_question_version(uuid) from public, anon;
revoke all on function public.admin_create_quiz_draft(uuid, text, public.quiz_type, text, text, numeric, integer, integer, boolean, uuid[]) from public, anon;
revoke all on function public.admin_create_quiz_version_draft(uuid) from public, anon;
revoke all on function public.admin_replace_quiz_draft(uuid, text, text, numeric, integer, integer, timestamptz, timestamptz, boolean, uuid[]) from public, anon;
revoke all on function public.admin_publish_quiz_version(uuid) from public, anon;

grant execute on function public.admin_create_question_draft(uuid, public.question_type, text, text, uuid[], text[], integer) to authenticated, service_role;
grant execute on function public.admin_create_question_version_draft(uuid) to authenticated, service_role;
grant execute on function public.admin_replace_question_draft(uuid, public.question_type, text, text, uuid[], text[], integer) to authenticated, service_role;
grant execute on function public.admin_publish_question_version(uuid) to authenticated, service_role;
grant execute on function public.admin_create_quiz_draft(uuid, text, public.quiz_type, text, text, numeric, integer, integer, boolean, uuid[]) to authenticated, service_role;
grant execute on function public.admin_create_quiz_version_draft(uuid) to authenticated, service_role;
grant execute on function public.admin_replace_quiz_draft(uuid, text, text, numeric, integer, integer, timestamptz, timestamptz, boolean, uuid[]) to authenticated, service_role;
grant execute on function public.admin_publish_quiz_version(uuid) to authenticated, service_role;

comment on function public.admin_replace_question_draft(uuid, public.question_type, text, text, uuid[], text[], integer) is
  'Atomically replaces one administrator-owned draft question version, its options, and topic assignments.';
comment on function public.admin_replace_quiz_draft(uuid, text, text, numeric, integer, integer, timestamptz, timestamptz, boolean, uuid[]) is
  'Atomically replaces editable quiz-version configuration and ordered published-question composition.';
