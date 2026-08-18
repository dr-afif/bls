-- Migration: 20260818100000_milestone_5_staff_results.sql

-- 1. Instructor Cohort Assessment Readiness
create or replace function public.get_instructor_cohort_assessment_readiness(target_cohort_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  target_cohort public.cohorts;
  course_pre_test public.quizzes;
  course_post_test public.quizzes;
  post_test_release public.cohort_quiz_releases;
begin
  if actor is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select * into target_cohort from public.cohorts where id = target_cohort_id;
  if target_cohort.id is null then raise exception 'COHORT_NOT_FOUND' using errcode = 'P0001'; end if;
  
  if not (private.is_admin_in_organization(target_cohort.organization_id) or private.is_assigned_instructor(target_cohort.id)) then
    raise exception 'ACCESS_DENIED' using errcode = '42501';
  end if;

  select * into course_pre_test from public.quizzes where course_id = target_cohort.course_id and quiz_type = 'pre_test' limit 1;
  select * into course_post_test from public.quizzes where course_id = target_cohort.course_id and quiz_type = 'post_test' limit 1;

  if course_post_test.id is not null then
    select * into post_test_release from public.cohort_quiz_releases
    where cohort_id = target_cohort.id and quiz_version_id = course_post_test.current_version_id limit 1;
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'learnerId', cm.user_id,
      'learnerName', p.full_name,
      'preTest', jsonb_build_object(
        'available', course_pre_test.current_version_id is not null,
        'status', coalesce((
          select qa.status::text from public.quiz_attempts qa
          where qa.learner_id = cm.user_id and qa.quiz_id = course_pre_test.id
          order by qa.created_at desc limit 1
        ), 'not_started')
      ),
      'postTest', jsonb_build_object(
        'quizId', course_post_test.id,
        'released', post_test_release.id is not null,
        'releasedAt', post_test_release.released_at,
        'status', coalesce((
          select qa.status::text from public.quiz_attempts qa
          where qa.learner_id = cm.user_id and qa.quiz_id = course_post_test.id
          order by qa.created_at desc limit 1
        ), 'not_started')
      )
    ) order by p.full_name)
    from public.cohort_members cm
    join public.profiles p on p.id = cm.user_id
    where cm.cohort_id = target_cohort.id and cm.member_role = 'learner' and cm.membership_status = 'active'
  ), '[]'::jsonb);
end;
$$;

-- 2. Administrator Results List
create or replace function public.list_admin_quiz_results(target_cohort_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  target_cohort public.cohorts;
begin
  if actor is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select * into target_cohort from public.cohorts where id = target_cohort_id;
  if target_cohort.id is null then raise exception 'COHORT_NOT_FOUND' using errcode = 'P0001'; end if;
  
  if not private.is_admin_in_organization(target_cohort.organization_id) then
    raise exception 'ACCESS_DENIED' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'attemptId', qa.id,
      'learnerId', qa.learner_id,
      'learnerName', p.full_name,
      'quizTitle', qv.title,
      'quizType', q.quiz_type,
      'status', qa.status,
      'startedAt', qa.started_at,
      'submittedAt', qa.submitted_at,
      'scorePercent', qa.score_percent,
      'passed', qa.passed
    ) order by qa.started_at desc)
    from public.quiz_attempts qa
    join public.profiles p on p.id = qa.learner_id
    join public.quizzes q on q.id = qa.quiz_id
    join public.quiz_versions qv on qv.id = qa.quiz_version_id
    where qa.cohort_id = target_cohort.id
  ), '[]'::jsonb);
end;
$$;

-- 3. Administrator Attempt Detail
create or replace function public.get_admin_quiz_attempt_detail(target_attempt_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  target_attempt public.quiz_attempts;
  quiz_title text;
begin
  if actor is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select * into target_attempt from public.quiz_attempts where id = target_attempt_id;
  if target_attempt.id is null then raise exception 'ATTEMPT_NOT_FOUND' using errcode = 'P0001'; end if;
  
  if not private.is_admin_in_organization(target_attempt.organization_id) then
    raise exception 'ACCESS_DENIED' using errcode = '42501';
  end if;

  select qv.title into quiz_title from public.quiz_versions qv where qv.id = target_attempt.quiz_version_id;

  return jsonb_build_object(
    'attemptId', target_attempt.id,
    'learnerId', target_attempt.learner_id,
    'learnerName', (select full_name from public.profiles where id = target_attempt.learner_id),
    'cohortId', target_attempt.cohort_id,
    'quizId', target_attempt.quiz_id,
    'quizTitle', quiz_title,
    'quizType', (select quiz_type from public.quizzes where id = target_attempt.quiz_id),
    'status', target_attempt.status,
    'startedAt', target_attempt.started_at,
    'submittedAt', target_attempt.submitted_at,
    'scorePercent', target_attempt.score_percent,
    'passed', target_attempt.passed,
    'topicSummary', target_attempt.topic_summary,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'attemptQuestionId', aq.id,
        'prompt', aq.prompt_snapshot,
        'type', aq.question_type,
        'displayOrder', aq.display_order,
        'points', aq.points,
        'topicId', aq.topic_id,
        'selectedOptionId', aa.selected_attempt_option_id,
        'isCorrect', aas.is_correct,
        'pointsAwarded', aas.points_awarded,
        'options', (
          select jsonb_agg(jsonb_build_object(
            'id', aqo.id,
            'text', aqo.option_text_snapshot,
            'displayOrder', aqo.display_order,
            'isCorrect', qo.is_correct
          ) order by aqo.display_order)
          from public.attempt_question_options aqo
          join public.question_options qo on qo.id = aqo.question_option_id
          where aqo.attempt_question_id = aq.id
        )
      ) order by aq.display_order)
      from public.attempt_questions aq
      left join public.attempt_answers aa on aa.attempt_question_id = aq.id
      left join private.attempt_answer_scores aas on aas.attempt_question_id = aq.id
      where aq.attempt_id = target_attempt.id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_instructor_cohort_assessment_readiness(uuid) from public, anon;
revoke all on function public.list_admin_quiz_results(uuid) from public, anon;
revoke all on function public.get_admin_quiz_attempt_detail(uuid) from public, anon;

grant execute on function public.get_instructor_cohort_assessment_readiness(uuid) to authenticated, service_role;
grant execute on function public.list_admin_quiz_results(uuid) to authenticated, service_role;
grant execute on function public.get_admin_quiz_attempt_detail(uuid) to authenticated, service_role;

comment on function public.get_instructor_cohort_assessment_readiness(uuid) is 'Returns live pre-test and post-test completion states for an assigned cohort. Instructors only see readiness, no scores or answers.';
comment on function public.list_admin_quiz_results(uuid) is 'Returns operational results list for an administrator viewing a specific cohort.';
comment on function public.get_admin_quiz_attempt_detail(uuid) is 'Returns detailed historical attempt data for an administrator, including frozen questions, selected options, and correctness.';
