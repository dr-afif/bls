-- Migration: 20260818123000_milestone_6_analytics_corrections.sql

-- 1. Enforce deterministic quiz identity semantics
create unique index if not exists quizzes_org_course_type_key on public.quizzes (organization_id, course_id, quiz_type);

-- 2. Update Learner Pre/Post Comparison
create or replace function public.get_admin_cohort_learner_comparison(target_cohort_id uuid)
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
    with course_quizzes as (
      select 
        (select id from public.quizzes where course_id = target_cohort.course_id and organization_id = target_cohort.organization_id and quiz_type = 'pre_test') as pre_test_id,
        (select id from public.quizzes where course_id = target_cohort.course_id and organization_id = target_cohort.organization_id and quiz_type = 'post_test') as post_test_id
    ),
    authoritative_pre_tests as (
      select distinct on (qa.learner_id) qa.learner_id, qa.id as attempt_id, qa.score_percent, qa.submitted_at
      from public.quiz_attempts qa
      join course_quizzes cq on qa.quiz_id = cq.pre_test_id
      where qa.cohort_id = target_cohort.id and qa.status = 'submitted'
      order by qa.learner_id, qa.submitted_at desc, qa.id desc
    ),
    authoritative_post_tests as (
      select distinct on (qa.learner_id) qa.learner_id, qa.id as attempt_id, qa.score_percent, qa.submitted_at
      from public.quiz_attempts qa
      join course_quizzes cq on qa.quiz_id = cq.post_test_id
      where qa.cohort_id = target_cohort.id and qa.status = 'submitted'
      order by qa.learner_id, qa.submitted_at desc, qa.id desc
    )
    select jsonb_agg(jsonb_build_object(
      'learnerId', cm.user_id,
      'learnerName', p.full_name,
      'preTest', jsonb_build_object(
        'attemptId', pre.attempt_id,
        'scorePercent', pre.score_percent,
        'submittedAt', pre.submitted_at
      ),
      'postTest', jsonb_build_object(
        'attemptId', post.attempt_id,
        'scorePercent', post.score_percent,
        'submittedAt', post.submitted_at
      ),
      'learningGain', case when pre.score_percent is not null and post.score_percent is not null then (post.score_percent - pre.score_percent) else null end
    ) order by p.full_name)
    from public.cohort_members cm
    join public.profiles p on p.id = cm.user_id
    left join authoritative_pre_tests pre on pre.learner_id = cm.user_id
    left join authoritative_post_tests post on post.learner_id = cm.user_id
    where cm.cohort_id = target_cohort.id and cm.member_role = 'learner' and cm.membership_status = 'active'
  ), '[]'::jsonb);
end;
$$;

-- 3. Update Cohort Aggregate Comparison
create or replace function public.get_admin_cohort_aggregate_comparison(target_cohort_id uuid)
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
    with course_quizzes as (
      select 
        (select id from public.quizzes where course_id = target_cohort.course_id and organization_id = target_cohort.organization_id and quiz_type = 'pre_test') as pre_test_id,
        (select id from public.quizzes where course_id = target_cohort.course_id and organization_id = target_cohort.organization_id and quiz_type = 'post_test') as post_test_id
    ),
    authoritative_pre_tests as (
      select distinct on (qa.learner_id) qa.learner_id, qa.score_percent, qa.passed
      from public.quiz_attempts qa
      join course_quizzes cq on qa.quiz_id = cq.pre_test_id
      where qa.cohort_id = target_cohort.id and qa.status = 'submitted'
      order by qa.learner_id, qa.submitted_at desc, qa.id desc
    ),
    authoritative_post_tests as (
      select distinct on (qa.learner_id) qa.learner_id, qa.score_percent, qa.passed
      from public.quiz_attempts qa
      join course_quizzes cq on qa.quiz_id = cq.post_test_id
      where qa.cohort_id = target_cohort.id and qa.status = 'submitted'
      order by qa.learner_id, qa.submitted_at desc, qa.id desc
    ),
    learner_stats as (
      select 
        cm.user_id,
        pre.score_percent as pre_score,
        pre.passed as pre_passed,
        post.score_percent as post_score,
        post.passed as post_passed
      from public.cohort_members cm
      left join authoritative_pre_tests pre on pre.learner_id = cm.user_id
      left join authoritative_post_tests post on post.learner_id = cm.user_id
      where cm.cohort_id = target_cohort.id and cm.member_role = 'learner' and cm.membership_status = 'active'
    ),
    aggregate_stats as (
      select 
        count(user_id) as total_learners,
        count(pre_score) as pre_completion_count,
        count(post_score) as post_completion_count,
        count(user_id) filter (where pre_score is not null and post_score is not null) as paired_result_count,
        avg(pre_score) as pre_average,
        percentile_cont(0.5) within group (order by pre_score) as pre_median,
        avg(post_score) as post_average,
        percentile_cont(0.5) within group (order by post_score) as post_median,
        count(user_id) filter (where post_passed) as post_passed_count,
        avg(case when pre_score is not null and post_score is not null then (post_score - pre_score) else null end) as average_learning_gain
      from learner_stats
    )
    select jsonb_build_object(
      'totalLearners', total_learners,
      'pairedResultCount', paired_result_count,
      'preTest', jsonb_build_object(
        'completionCount', pre_completion_count,
        'averageScorePercent', pre_average,
        'medianScorePercent', pre_median
      ),
      'postTest', jsonb_build_object(
        'completionCount', post_completion_count,
        'averageScorePercent', post_average,
        'medianScorePercent', post_median,
        'passedCount', coalesce(post_passed_count, 0)
      ),
      'averageLearningGain', average_learning_gain
    )
    from aggregate_stats
  ), '{"totalLearners":0,"pairedResultCount":0,"preTest":{"completionCount":0,"averageScorePercent":null,"medianScorePercent":null},"postTest":{"completionCount":0,"averageScorePercent":null,"medianScorePercent":null,"passedCount":0},"averageLearningGain":null}'::jsonb);
end;
$$;

-- 4. Update Topic-Level Comparison
create or replace function public.get_admin_cohort_topic_comparison(target_cohort_id uuid)
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
    with course_quizzes as (
      select 
        (select id from public.quizzes where course_id = target_cohort.course_id and organization_id = target_cohort.organization_id and quiz_type = 'pre_test') as pre_test_id,
        (select id from public.quizzes where course_id = target_cohort.course_id and organization_id = target_cohort.organization_id and quiz_type = 'post_test') as post_test_id
    ),
    authoritative_pre_tests as (
      select distinct on (qa.learner_id) qa.id as attempt_id
      from public.quiz_attempts qa
      join course_quizzes cq on qa.quiz_id = cq.pre_test_id
      where qa.cohort_id = target_cohort.id and qa.status = 'submitted'
      order by qa.learner_id, qa.submitted_at desc, qa.id desc
    ),
    authoritative_post_tests as (
      select distinct on (qa.learner_id) qa.id as attempt_id
      from public.quiz_attempts qa
      join course_quizzes cq on qa.quiz_id = cq.post_test_id
      where qa.cohort_id = target_cohort.id and qa.status = 'submitted'
      order by qa.learner_id, qa.submitted_at desc, qa.id desc
    ),
    pre_test_topic_stats as (
      select 
        aq.topic_id,
        count(distinct pre.attempt_id) as submitted_learner_count,
        count(aq.id) as scored_response_count,
        count(aq.id) filter (where aas.is_correct) as correct_response_count
      from authoritative_pre_tests pre
      join public.attempt_questions aq on aq.attempt_id = pre.attempt_id
      left join private.attempt_answer_scores aas on aas.attempt_question_id = aq.id
      where aq.topic_id is not null
      group by aq.topic_id
    ),
    post_test_topic_stats as (
      select 
        aq.topic_id,
        count(distinct post.attempt_id) as submitted_learner_count,
        count(aq.id) as scored_response_count,
        count(aq.id) filter (where aas.is_correct) as correct_response_count
      from authoritative_post_tests post
      join public.attempt_questions aq on aq.attempt_id = post.attempt_id
      left join private.attempt_answer_scores aas on aas.attempt_question_id = aq.id
      where aq.topic_id is not null
      group by aq.topic_id
    ),
    all_topics as (
      select topic_id from pre_test_topic_stats
      union
      select topic_id from post_test_topic_stats
    )
    select jsonb_agg(jsonb_build_object(
      'topicId', t.topic_id,
      'topicName', (select name from public.bls_topics where id = t.topic_id),
      'preTest', jsonb_build_object(
        'submittedLearnerCount', coalesce(pre.submitted_learner_count, 0),
        'scoredResponseCount', coalesce(pre.scored_response_count, 0),
        'correctResponseCount', coalesce(pre.correct_response_count, 0),
        'percentage', case when pre.scored_response_count > 0 then round((pre.correct_response_count::numeric / pre.scored_response_count) * 100, 2) else null end
      ),
      'postTest', jsonb_build_object(
        'submittedLearnerCount', coalesce(post.submitted_learner_count, 0),
        'scoredResponseCount', coalesce(post.scored_response_count, 0),
        'correctResponseCount', coalesce(post.correct_response_count, 0),
        'percentage', case when post.scored_response_count > 0 then round((post.correct_response_count::numeric / post.scored_response_count) * 100, 2) else null end
      ),
      'learningGain', case 
        when pre.scored_response_count > 0 and post.scored_response_count > 0 
        then round(((post.correct_response_count::numeric / post.scored_response_count) * 100) - ((pre.correct_response_count::numeric / pre.scored_response_count) * 100), 2)
        else null end
    ) order by (select name from public.bls_topics where id = t.topic_id))
    from all_topics t
    left join pre_test_topic_stats pre on pre.topic_id = t.topic_id
    left join post_test_topic_stats post on post.topic_id = t.topic_id
  ), '[]'::jsonb);
end;
$$;
