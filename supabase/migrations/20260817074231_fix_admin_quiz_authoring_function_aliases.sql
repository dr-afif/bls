create or replace function public.admin_create_quiz_draft(
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
  select new_version_id, question_rows.question_version_id,
    question_rows.version_order::integer, 1
  from unnest(target_question_version_ids) with ordinality
    as question_rows(question_version_id, version_order);
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id, metadata
  ) values (
    actor, 'quiz.created', 'quiz', new_quiz_id, target_organization,
    jsonb_build_object('versionId', new_version_id, 'versionNumber', 1, 'quizType', target_quiz_type)
  );
  return query select new_quiz_id, new_version_id;
end;
$$;

revoke all on function public.admin_create_quiz_draft(
  uuid, text, public.quiz_type, text, text, numeric, integer, integer,
  boolean, uuid[]
) from public, anon;
grant execute on function public.admin_create_quiz_draft(
  uuid, text, public.quiz_type, text, text, numeric, integer, integer,
  boolean, uuid[]
) to authenticated, service_role;
