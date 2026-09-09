-- Migration: 20260819130000_milestone_6_csv_exports.sql

-- 1. Cohort Roster Export
create or replace function public.get_admin_cohort_roster_export(target_cohort_id uuid, target_request_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  target_cohort public.cohorts;
  result jsonb;
begin
  if actor is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select * into target_cohort from public.cohorts where id = target_cohort_id;
  if target_cohort.id is null then raise exception 'COHORT_NOT_FOUND' using errcode = 'P0001'; end if;

  if not private.is_admin_in_organization(target_cohort.organization_id) then
    raise exception 'ACCESS_DENIED' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'cohortCode', target_cohort.name,
    'cohortName', target_cohort.description,
    'learnerName', p.full_name,
    'learnerEmail', null,
    'membershipStatus', cm.membership_status
  ) order by p.full_name, p.id), '[]'::jsonb)
  into result
  from public.cohort_members cm
  join public.profiles p on p.id = cm.user_id
  where cm.cohort_id = target_cohort.id and cm.member_role = 'learner';

  -- Audit event
  insert into public.audit_events (actor_user_id, action, entity_type, entity_id, organization_id, metadata, request_id)
  values (actor, 'cohort.roster_exported', 'cohort', target_cohort.id, target_cohort.organization_id, jsonb_build_object('export_type', 'roster', 'row_count', coalesce(jsonb_array_length(result), 0)), target_request_id);

  return result;
end;
$$;

revoke all on function public.get_admin_cohort_roster_export(uuid, uuid) from public, anon;
grant execute on function public.get_admin_cohort_roster_export(uuid, uuid) to authenticated, service_role;
comment on function public.get_admin_cohort_roster_export(uuid, uuid) is 'Returns a secure projection of the cohort roster for CSV export and creates an audit event. Administrators only.';


-- 2. Assessment Results Export
create or replace function public.get_admin_assessment_results_export(target_cohort_id uuid, target_quiz_type public.quiz_type, target_request_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  target_cohort public.cohorts;
  target_quiz public.quizzes;
  result jsonb;
begin
  if actor is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select * into target_cohort from public.cohorts where id = target_cohort_id;
  if target_cohort.id is null then raise exception 'COHORT_NOT_FOUND' using errcode = 'P0001'; end if;

  if not private.is_admin_in_organization(target_cohort.organization_id) then
    raise exception 'ACCESS_DENIED' using errcode = '42501';
  end if;

  select * into target_quiz from public.quizzes
  where course_id = target_cohort.course_id and quiz_type = target_quiz_type limit 1;

  if target_quiz.id is null then
    result := '[]'::jsonb;
  else
    with authoritative_attempts as (
      select distinct on (qa.learner_id) qa.learner_id, qa.score_percent, qa.submitted_at, qa.quiz_version_id
      from public.quiz_attempts qa
      where qa.cohort_id = target_cohort.id and qa.status = 'submitted' and qa.quiz_id = target_quiz.id
      order by qa.learner_id, qa.submitted_at desc
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'cohortCode', target_cohort.name,
      'cohortName', target_cohort.description,
      'learnerName', p.full_name,
      'learnerEmail', null,
      'assessmentType', target_quiz_type,
      'quizTitle', target_quiz.title,
      'quizVersionNumber', (select version_number from public.quiz_versions where id = att.quiz_version_id),
      'status', case when att.learner_id is not null then 'submitted' else 'not_submitted' end,
      'submittedAt', att.submitted_at,
      'scorePercent', att.score_percent,
      'passed', case when att.score_percent >= (select passing_score_percent from public.quiz_versions qv where qv.id = att.quiz_version_id) then true when att.score_percent is not null then false else null end
    ) order by p.full_name, p.id), '[]'::jsonb)
    into result
    from public.cohort_members cm
    join public.profiles p on p.id = cm.user_id
    left join authoritative_attempts att on att.learner_id = cm.user_id
    where cm.cohort_id = target_cohort.id and cm.member_role = 'learner';
  end if;

  -- Audit event
  insert into public.audit_events (actor_user_id, action, entity_type, entity_id, organization_id, metadata, request_id)
  values (actor, 'cohort.assessment_results_exported', 'cohort', target_cohort.id, target_cohort.organization_id, jsonb_build_object('export_type', 'assessment_results', 'assessment_type', target_quiz_type, 'row_count', coalesce(jsonb_array_length(result), 0)), target_request_id);

  return result;
end;
$$;

revoke all on function public.get_admin_assessment_results_export(uuid, public.quiz_type, uuid) from public, anon;
grant execute on function public.get_admin_assessment_results_export(uuid, public.quiz_type, uuid) to authenticated, service_role;
comment on function public.get_admin_assessment_results_export(uuid, public.quiz_type, uuid) is 'Returns a secure projection of assessment results for CSV export and creates an audit event. Administrators only.';


-- 3. Pre/Post Comparison Export
create or replace function public.get_admin_pre_post_export(target_cohort_id uuid, target_request_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  target_cohort public.cohorts;
  result jsonb;
begin
  if actor is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select * into target_cohort from public.cohorts where id = target_cohort_id;
  if target_cohort.id is null then raise exception 'COHORT_NOT_FOUND' using errcode = 'P0001'; end if;

  if not private.is_admin_in_organization(target_cohort.organization_id) then
    raise exception 'ACCESS_DENIED' using errcode = '42501';
  end if;

  with course_quizzes as (
    select
      (select id from public.quizzes where course_id = target_cohort.course_id and quiz_type = 'pre_test' limit 1) as pre_test_id,
      (select id from public.quizzes where course_id = target_cohort.course_id and quiz_type = 'post_test' limit 1) as post_test_id
  ),
  authoritative_pre_tests as (
    select distinct on (qa.learner_id) qa.learner_id, qa.score_percent, qa.submitted_at
    from public.quiz_attempts qa
    join course_quizzes cq on qa.quiz_id = cq.pre_test_id
    where qa.cohort_id = target_cohort.id and qa.status = 'submitted'
    order by qa.learner_id, qa.submitted_at desc
  ),
  authoritative_post_tests as (
    select distinct on (qa.learner_id) qa.learner_id, qa.score_percent, qa.submitted_at, qa.quiz_version_id
    from public.quiz_attempts qa
    join course_quizzes cq on qa.quiz_id = cq.post_test_id
    where qa.cohort_id = target_cohort.id and qa.status = 'submitted'
    order by qa.learner_id, qa.submitted_at desc
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'cohortCode', target_cohort.name,
    'cohortName', target_cohort.description,
    'learnerName', p.full_name,
    'learnerEmail', null,
    'preTestStatus', case when pre.learner_id is not null then 'submitted' else 'not_submitted' end,
    'preTestSubmittedAt', pre.submitted_at,
    'preTestScorePercent', pre.score_percent,
    'postTestStatus', case when post.learner_id is not null then 'submitted' else 'not_submitted' end,
    'postTestSubmittedAt', post.submitted_at,
    'postTestScorePercent', post.score_percent,
    'postTestPassed', case when post.score_percent >= (select passing_score_percent from public.quiz_versions qv where qv.id = post.quiz_version_id) then true when post.score_percent is not null then false else null end,
    'learningGainPercentagePoints', case when pre.score_percent is not null and post.score_percent is not null then (post.score_percent - pre.score_percent) else null end
  ) order by p.full_name, p.id), '[]'::jsonb)
  into result
  from public.cohort_members cm
  join public.profiles p on p.id = cm.user_id
  cross join course_quizzes cq
  left join authoritative_pre_tests pre on pre.learner_id = cm.user_id
  left join authoritative_post_tests post on post.learner_id = cm.user_id
  where cm.cohort_id = target_cohort.id and cm.member_role = 'learner';

  -- Audit event
  insert into public.audit_events (actor_user_id, action, entity_type, entity_id, organization_id, metadata, request_id)
  values (actor, 'cohort.pre_post_comparison_exported', 'cohort', target_cohort.id, target_cohort.organization_id, jsonb_build_object('export_type', 'pre_post_comparison', 'row_count', coalesce(jsonb_array_length(result), 0)), target_request_id);

  return result;
end;
$$;

revoke all on function public.get_admin_pre_post_export(uuid, uuid) from public, anon;
grant execute on function public.get_admin_pre_post_export(uuid, uuid) to authenticated, service_role;
comment on function public.get_admin_pre_post_export(uuid, uuid) is 'Returns a secure projection of pre/post comparison results for CSV export and creates an audit event. Administrators only.';
