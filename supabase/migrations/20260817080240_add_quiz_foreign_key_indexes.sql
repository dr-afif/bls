-- Cover assessment foreign keys reported by the hosted performance advisor.
create index quizzes_current_version_idx on public.quizzes (current_version_id)
  where current_version_id is not null;
create index quizzes_created_by_idx on public.quizzes (created_by)
  where created_by is not null;
create index quizzes_updated_by_idx on public.quizzes (updated_by)
  where updated_by is not null;

create index quiz_versions_published_by_idx on public.quiz_versions (published_by)
  where published_by is not null;
create index quiz_versions_created_by_idx on public.quiz_versions (created_by)
  where created_by is not null;

create index questions_organization_idx on public.questions (organization_id);
create index questions_current_version_idx on public.questions (current_version_id)
  where current_version_id is not null;
create index questions_created_by_idx on public.questions (created_by)
  where created_by is not null;
create index questions_updated_by_idx on public.questions (updated_by)
  where updated_by is not null;

create index question_versions_approved_by_idx on public.question_versions (approved_by)
  where approved_by is not null;
create index question_versions_created_by_idx on public.question_versions (created_by)
  where created_by is not null;

create index cohort_quiz_releases_organization_idx
  on public.cohort_quiz_releases (organization_id);
create index quiz_attempts_organization_idx on public.quiz_attempts (organization_id);
create index quiz_attempts_course_idx on public.quiz_attempts (course_id);
create index quiz_attempts_quiz_idx on public.quiz_attempts (quiz_id);
