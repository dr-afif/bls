-- Migration: 20260819120000_milestone_6_item_analysis.sql

create or replace function public.get_admin_cohort_item_analysis(target_cohort_id uuid, target_quiz_type public.quiz_type)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  target_cohort public.cohorts;
  target_quiz_id uuid;
begin
  if actor is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select * into target_cohort from public.cohorts where id = target_cohort_id;
  if target_cohort.id is null then raise exception 'COHORT_NOT_FOUND' using errcode = 'P0001'; end if;
  
  if not private.is_admin_in_organization(target_cohort.organization_id) then
    raise exception 'ACCESS_DENIED' using errcode = '42501';
  end if;

  select id into target_quiz_id from public.quizzes 
  where course_id = target_cohort.course_id and quiz_type = target_quiz_type limit 1;

  if target_quiz_id is null then
    return null;
  end if;

  return coalesce((
    with authoritative_attempts as (
      select distinct on (qa.learner_id) qa.id as attempt_id, qa.learner_id
      from public.quiz_attempts qa
      where qa.cohort_id = target_cohort.id 
        and qa.quiz_id = target_quiz_id
        and qa.status = 'submitted'
      order by qa.learner_id, qa.submitted_at desc
    ),
    counted as (
      select count(*) as c from authoritative_attempts
    ),
    item_stats as (
      select 
        aq.question_version_id,
        qv.version_number as question_version_number,
        aq.prompt_snapshot as prompt,
        aq.topic_id,
        (select name from public.bls_topics t where t.id = aq.topic_id) as topic_name,
        count(aq.id) as response_count,
        count(aq.id) filter (where aas.is_correct) as correct_response_count
      from authoritative_attempts att
      join public.attempt_questions aq on aq.attempt_id = att.attempt_id
      join public.question_versions qv on qv.id = aq.question_version_id
      left join private.attempt_answer_scores aas on aas.attempt_question_id = aq.id
      group by aq.question_version_id, qv.version_number, aq.prompt_snapshot, aq.topic_id
    ),
    option_stats as (
      select 
        aq.question_version_id,
        aqo.question_option_id,
        aqo.option_text_snapshot as option_text,
        qo.display_order,
        qo.is_correct,
        count(aa.selected_attempt_option_id) as selected_count
      from authoritative_attempts att
      join public.attempt_questions aq on aq.attempt_id = att.attempt_id
      join public.attempt_question_options aqo on aqo.attempt_question_id = aq.id
      join public.question_options qo on qo.id = aqo.question_option_id
      left join public.attempt_answers aa on aa.attempt_question_id = aq.id and aa.selected_attempt_option_id = aqo.id
      group by aq.question_version_id, aqo.question_option_id, aqo.option_text_snapshot, qo.display_order, qo.is_correct
    ),
    options_agg as (
      select 
        os.question_version_id,
        jsonb_agg(jsonb_build_object(
          'questionOptionId', os.question_option_id,
          'optionText', os.option_text,
          'displayOrder', os.display_order,
          'selectedCount', os.selected_count,
          'selectionPercent', case when is2.response_count > 0 then round((os.selected_count::numeric / is2.response_count) * 100, 2) else 0 end,
          'isCorrect', os.is_correct
        ) order by os.display_order) as options_array
      from option_stats os
      join item_stats is2 on is2.question_version_id = os.question_version_id
      group by os.question_version_id
    )
    select jsonb_build_object(
      'cohortId', target_cohort.id,
      'quizId', target_quiz_id,
      'quizType', target_quiz_type,
      'analyzedLearnerCount', (select coalesce(c, 0) from counted),
      'items', coalesce(jsonb_agg(jsonb_build_object(
        'questionId', (select question_id from public.question_versions qv where qv.id = is1.question_version_id),
        'questionVersionId', is1.question_version_id,
        'questionVersionNumber', is1.question_version_number,
        'prompt', is1.prompt,
        'topicId', is1.topic_id,
        'topicName', is1.topic_name,
        'responseCount', is1.response_count,
        'correctResponseCount', is1.correct_response_count,
        'correctResponseRate', case when is1.response_count > 0 then round((is1.correct_response_count::numeric / is1.response_count) * 100, 2) else null end,
        'options', coalesce(oa.options_array, '[]'::jsonb)
      ) order by is1.topic_name, is1.question_version_id), '[]'::jsonb)
    )
    from item_stats is1
    left join options_agg oa on oa.question_version_id = is1.question_version_id
  ), jsonb_build_object(
    'cohortId', target_cohort.id,
    'quizId', target_quiz_id,
    'quizType', target_quiz_type,
    'analyzedLearnerCount', 0,
    'items', '[]'::jsonb
  ));
end;
$$;

revoke all on function public.get_admin_cohort_item_analysis(uuid, public.quiz_type) from public, anon;
grant execute on function public.get_admin_cohort_item_analysis(uuid, public.quiz_type) to authenticated, service_role;
comment on function public.get_admin_cohort_item_analysis(uuid, public.quiz_type) is 'Returns question-level performance and option-selection patterns for submitted assessments. Administrators only.';
