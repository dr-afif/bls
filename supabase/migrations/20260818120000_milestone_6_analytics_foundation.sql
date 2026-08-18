-- Migration: 20260818120000_milestone_6_analytics_foundation.sql

-- 1. Learner Pre/Post Comparison
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
        (select id from public.quizzes where course_id = target_cohort.course_id and quiz_type = 'pre_test' limit 1) as pre_test_id,
        (select id from public.quizzes where course_id = target_cohort.course_id and quiz_type = 'post_test' limit 1) as post_test_id
    ),
    authoritative_pre_tests as (
      select distinct on (qa.learner_id) qa.learner_id, qa.id as attempt_id, qa.score_percent, qa.submitted_at
      from public.quiz_attempts qa
      join course_quizzes cq on qa.quiz_id = cq.pre_test_id
      where qa.cohort_id = target_cohort.id and qa.status = 'submitted'
      order by qa.learner_id, qa.submitted_at desc
    ),
    authoritative_post_tests as (
      select distinct on (qa.learner_id) qa.learner_id, qa.id as attempt_id, qa.score_percent, qa.submitted_at
      from public.quiz_attempts qa
      join course_quizzes cq on qa.quiz_id = cq.post_test_id
      where qa.cohort_id = target_cohort.id and qa.status = 'submitted'
      order by qa.learner_id, qa.submitted_at desc
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

-- 2. Cohort Aggregate Comparison
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
        (select id from public.quizzes where course_id = target_cohort.course_id and quiz_type = 'pre_test' limit 1) as pre_test_id,
        (select id from public.quizzes where course_id = target_cohort.course_id and quiz_type = 'post_test' limit 1) as post_test_id
    ),
    authoritative_pre_tests as (
      select distinct on (qa.learner_id) qa.learner_id, qa.score_percent
      from public.quiz_attempts qa
      join course_quizzes cq on qa.quiz_id = cq.pre_test_id
      where qa.cohort_id = target_cohort.id and qa.status = 'submitted'
      order by qa.learner_id, qa.submitted_at desc
    ),
    authoritative_post_tests as (
      select distinct on (qa.learner_id) qa.learner_id, qa.score_percent
      from public.quiz_attempts qa
      join course_quizzes cq on qa.quiz_id = cq.post_test_id
      where qa.cohort_id = target_cohort.id and qa.status = 'submitted'
      order by qa.learner_id, qa.submitted_at desc
    ),
    learner_stats as (
      select 
        cm.user_id,
        pre.score_percent as pre_score,
        post.score_percent as post_score
      from public.cohort_members cm
      left join authoritative_pre_tests pre on pre.learner_id = cm.user_id
      left join authoritative_post_tests post on post.learner_id = cm.user_id
      where cm.cohort_id = target_cohort.id and cm.member_role = 'learner' and cm.membership_status = 'active'
    )
    select jsonb_build_object(
      'preTest', jsonb_build_object(
        'averageScorePercent', avg(pre_score),
        'completionCount', count(pre_score),
        'totalLearners', count(user_id)
      ),
      'postTest', jsonb_build_object(
        'averageScorePercent', avg(post_score),
        'completionCount', count(post_score),
        'totalLearners', count(user_id)
      ),
      'averageLearningGain', avg(case when pre_score is not null and post_score is not null then (post_score - pre_score) else null end)
    )
    from learner_stats
  ), '{"preTest":{"averageScorePercent":null,"completionCount":0,"totalLearners":0},"postTest":{"averageScorePercent":null,"completionCount":0,"totalLearners":0},"averageLearningGain":null}'::jsonb);
end;
$$;

-- 3. Topic-Level Comparison
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
        (select id from public.quizzes where course_id = target_cohort.course_id and quiz_type = 'pre_test' limit 1) as pre_test_id,
        (select id from public.quizzes where course_id = target_cohort.course_id and quiz_type = 'post_test' limit 1) as post_test_id
    ),
    authoritative_pre_tests as (
      select distinct on (qa.learner_id) qa.id as attempt_id
      from public.quiz_attempts qa
      join course_quizzes cq on qa.quiz_id = cq.pre_test_id
      where qa.cohort_id = target_cohort.id and qa.status = 'submitted'
      order by qa.learner_id, qa.submitted_at desc
    ),
    authoritative_post_tests as (
      select distinct on (qa.learner_id) qa.id as attempt_id
      from public.quiz_attempts qa
      join course_quizzes cq on qa.quiz_id = cq.post_test_id
      where qa.cohort_id = target_cohort.id and qa.status = 'submitted'
      order by qa.learner_id, qa.submitted_at desc
    ),
    pre_test_topic_stats as (
      select 
        aq.topic_id,
        count(aq.id) as total_questions,
        count(aq.id) filter (where aas.is_correct) as correct_count
      from authoritative_pre_tests pre
      join public.attempt_questions aq on aq.attempt_id = pre.attempt_id
      left join private.attempt_answer_scores aas on aas.attempt_question_id = aq.id
      where aq.topic_id is not null
      group by aq.topic_id
    ),
    post_test_topic_stats as (
      select 
        aq.topic_id,
        count(aq.id) as total_questions,
        count(aq.id) filter (where aas.is_correct) as correct_count
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
        'correctCount', coalesce(pre.correct_count, 0),
        'totalQuestions', coalesce(pre.total_questions, 0),
        'averagePercent', case when pre.total_questions > 0 then round((pre.correct_count::numeric / pre.total_questions) * 100, 2) else null end
      ),
      'postTest', jsonb_build_object(
        'correctCount', coalesce(post.correct_count, 0),
        'totalQuestions', coalesce(post.total_questions, 0),
        'averagePercent', case when post.total_questions > 0 then round((post.correct_count::numeric / post.total_questions) * 100, 2) else null end
      ),
      'learningGain', case 
        when pre.total_questions > 0 and post.total_questions > 0 
        then round(((post.correct_count::numeric / post.total_questions) * 100) - ((pre.correct_count::numeric / pre.total_questions) * 100), 2)
        else null end
    ) order by (select name from public.bls_topics where id = t.topic_id))
    from all_topics t
    left join pre_test_topic_stats pre on pre.topic_id = t.topic_id
    left join post_test_topic_stats post on post.topic_id = t.topic_id
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.get_admin_cohort_learner_comparison(uuid) from public, anon;
revoke all on function public.get_admin_cohort_aggregate_comparison(uuid) from public, anon;
revoke all on function public.get_admin_cohort_topic_comparison(uuid) from public, anon;

grant execute on function public.get_admin_cohort_learner_comparison(uuid) to authenticated, service_role;
grant execute on function public.get_admin_cohort_aggregate_comparison(uuid) to authenticated, service_role;
grant execute on function public.get_admin_cohort_topic_comparison(uuid) to authenticated, service_role;

comment on function public.get_admin_cohort_learner_comparison(uuid) is 'Returns a learner-by-learner comparison of pre-test and post-test scores and learning gain. Administrators only.';
comment on function public.get_admin_cohort_aggregate_comparison(uuid) is 'Returns overall cohort averages for pre-test, post-test, and overall learning gain. Administrators only.';
comment on function public.get_admin_cohort_topic_comparison(uuid) is 'Returns aggregate performance by topic for a cohort pre-test and post-test. Administrators only.';
