-- Migration: 20260922010000_milestone_7_enums.sql
-- Description: Milestone 7 enum additions for pending registration and cohort learner access state

-- 1. Add pending_registration to public.account_status enum
alter type public.account_status add value if not exists 'pending_registration';

-- 2. Create public.learner_access_state enum
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'learner_access_state' and typnamespace = 'public'::regnamespace
  ) then
    create type public.learner_access_state as enum ('open', 'closed');
  end if;
end;
$$;

comment on type public.learner_access_state is
  'Controls whether enrolled learners can access course content and quizzes for a cohort (open or closed).';
