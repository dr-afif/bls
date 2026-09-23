-- Migration: 20260922020000_milestone_7_schema_foundation.sql
-- Description: Milestone 7 local/CI schema foundation: cohort_courses, cohort_learner_roster, staff_access_entries, access_invitations, private.learner_identities, and compatibility triggers.

-- 1. Add learner_access_state to public.cohorts
alter table public.cohorts
  add column if not exists learner_access_state public.learner_access_state not null default 'open';

comment on column public.cohorts.learner_access_state is
  'Access state for enrolled learners: open allows learning/quiz participation, closed terminates active learner access.';

create index if not exists cohorts_learner_access_state_idx
  on public.cohorts (learner_access_state);

-- 2. Create public.cohort_courses join table
create table if not exists public.cohort_courses (
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete restrict,
  display_order integer not null default 0 check (display_order >= 0),
  start_at timestamptz,
  end_at timestamptz,
  venue text check (venue is null or char_length(trim(venue)) between 2 and 160),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  primary key (cohort_id, course_id),
  constraint cohort_courses_schedule_check check (
    end_at is null or start_at is null or end_at > start_at
  )
);

create index if not exists cohort_courses_course_idx on public.cohort_courses (course_id);
create index if not exists cohort_courses_cohort_order_idx on public.cohort_courses (cohort_id, display_order);

comment on table public.cohort_courses is
  'Multi-course assignment join table for cohorts with optional course-specific schedule and venue overrides. NULL start_at, end_at, or venue inherits parent cohort values.';

-- Trigger function: Validate cohort_courses parentage (organization consistency)
create or replace function private.validate_cohort_course_parentage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cohort_org uuid;
  v_course_org uuid;
begin
  select organization_id into v_cohort_org from public.cohorts where id = new.cohort_id;
  if v_cohort_org is null then
    raise exception 'Cohort % does not exist', new.cohort_id using errcode = '23503';
  end if;

  select organization_id into v_course_org from public.courses where id = new.course_id;
  if v_course_org is null then
    raise exception 'Course % does not exist', new.course_id using errcode = '23503';
  end if;

  if v_cohort_org <> v_course_org then
    raise exception 'Cohort and course must belong to the same organization' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_cohort_course_parentage() from public;

drop trigger if exists trg_validate_cohort_course_parentage on public.cohort_courses;
create trigger trg_validate_cohort_course_parentage
  before insert or update on public.cohort_courses
  for each row execute function private.validate_cohort_course_parentage();

-- Backfill existing cohorts into cohort_courses with NULL overrides (inheriting cohort values)
insert into public.cohort_courses (
  cohort_id, course_id, display_order, start_at, end_at, venue, created_at, created_by
)
select
  id, course_id, 0, null, null, null, created_at, created_by
from public.cohorts
where course_id is not null
on conflict (cohort_id, course_id) do nothing;

-- Mirroring trigger function: Maintain legacy cohorts.course_id compatibility
-- Note: This compatibility trigger must be removed/retired during the Phase 7.6
-- multi-course write cutover before administrators can freely manage multiple course relationships.
create or replace function private.sync_cohort_legacy_course()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course_org uuid;
begin
  if new.course_id is not null then
    select organization_id into v_course_org
    from public.courses
    where id = new.course_id;

    if v_course_org is null then
      raise exception 'Referenced course % does not exist', new.course_id using errcode = '23503';
    end if;

    if v_course_org <> new.organization_id then
      raise exception 'Cohort and course must belong to the same organization' using errcode = '23514';
    end if;

    if tg_op = 'UPDATE' and old.course_id is not null and old.course_id <> new.course_id then
      if exists (select 1 from public.cohort_courses where cohort_id = new.id and course_id = new.course_id) then
        delete from public.cohort_courses where cohort_id = new.id and course_id = old.course_id;
      else
        update public.cohort_courses
        set course_id = new.course_id
        where cohort_id = new.id and course_id = old.course_id;
      end if;
    end if;

    -- Mirror legacy relationship with NULL schedule/venue overrides so parent cohort values are inherited
    insert into public.cohort_courses (
      cohort_id, course_id, display_order, start_at, end_at, venue, created_at, created_by
    ) values (
      new.id, new.course_id, 0, null, null, null, coalesce(new.created_at, now()), new.created_by
    )
    on conflict (cohort_id, course_id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function private.sync_cohort_legacy_course() from public;

drop trigger if exists trg_sync_cohort_legacy_course on public.cohorts;
create trigger trg_sync_cohort_legacy_course
  after insert or update of course_id, organization_id on public.cohorts
  for each row execute function private.sync_cohort_legacy_course();

-- Fail closed RLS for cohort_courses
alter table public.cohort_courses enable row level security;


-- 3. Create public.cohort_learner_roster
create table if not exists public.cohort_learner_roster (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  email text not null check (
    email = lower(trim(email)) and
    email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and
    char_length(email) between 5 and 254
  ),
  roster_status text not null default 'staged' check (
    roster_status in ('staged', 'invited', 'activated', 'removed')
  ),
  user_id uuid references public.profiles (id) on delete set null,
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cohort_learner_roster_cohort_email_key unique (cohort_id, email)
);

create index if not exists roster_cohort_idx on public.cohort_learner_roster (cohort_id);
create index if not exists roster_org_email_idx on public.cohort_learner_roster (organization_id, email);
create index if not exists roster_user_id_idx on public.cohort_learner_roster (user_id);

comment on table public.cohort_learner_roster is
  'Durable learner authorization intent for cohort participation prior to or during invitation.';

-- Validation trigger on cohort_learner_roster
create or replace function private.validate_cohort_learner_roster()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cohort_org uuid;
  v_profile_org uuid;
begin
  select organization_id into v_cohort_org from public.cohorts where id = new.cohort_id;
  if v_cohort_org is null then
    raise exception 'Cohort % does not exist', new.cohort_id using errcode = '23503';
  end if;

  if new.organization_id <> v_cohort_org then
    raise exception 'Roster organization_id must match cohort organization_id' using errcode = 'P0001';
  end if;

  if new.user_id is not null then
    select organization_id into v_profile_org from public.profiles where id = new.user_id;
    if v_profile_org is null then
      raise exception 'Linked profile % does not exist', new.user_id using errcode = '23503';
    end if;
    if v_profile_org <> new.organization_id then
      raise exception 'Linked profile organization must match roster organization' using errcode = 'P0001';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.validate_cohort_learner_roster() from public;

drop trigger if exists trg_validate_cohort_learner_roster on public.cohort_learner_roster;
create trigger trg_validate_cohort_learner_roster
  before insert or update on public.cohort_learner_roster
  for each row execute function private.validate_cohort_learner_roster();

-- Fail closed RLS for cohort_learner_roster
alter table public.cohort_learner_roster enable row level security;


-- 4. Create public.staff_access_entries
create table if not exists public.staff_access_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  email text not null check (
    email = lower(trim(email)) and
    email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and
    char_length(email) between 5 and 254
  ),
  intended_role public.app_role not null check (intended_role in ('admin', 'instructor')),
  status text not null default 'staged' check (status in ('staged', 'activated', 'removed')),
  user_id uuid references public.profiles (id) on delete set null,
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_access_entries_org_email_role_key unique (organization_id, email, intended_role)
);

create index if not exists staff_access_org_email_idx on public.staff_access_entries (organization_id, email);
create index if not exists staff_access_user_id_idx on public.staff_access_entries (user_id);

comment on table public.staff_access_entries is
  'Durable staff authorization intent for administrators and instructors before or during invitation.';

-- Validation trigger on staff_access_entries
create or replace function private.validate_staff_access_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_org uuid;
begin
  if new.user_id is not null then
    select organization_id into v_profile_org from public.profiles where id = new.user_id;
    if v_profile_org is null then
      raise exception 'Linked profile % does not exist', new.user_id using errcode = '23503';
    end if;
    if v_profile_org <> new.organization_id then
      raise exception 'Linked profile organization must match staff access organization' using errcode = 'P0001';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.validate_staff_access_entry() from public;

drop trigger if exists trg_validate_staff_access_entry on public.staff_access_entries;
create trigger trg_validate_staff_access_entry
  before insert or update on public.staff_access_entries
  for each row execute function private.validate_staff_access_entry();

-- Fail closed RLS for staff_access_entries
alter table public.staff_access_entries enable row level security;


-- 5. Create public.access_invitations
create table if not exists public.access_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  cohort_roster_entry_id uuid references public.cohort_learner_roster (id) on delete restrict,
  staff_access_entry_id uuid references public.staff_access_entries (id) on delete restrict,
  invitation_type text not null check (
    invitation_type in ('new_learner_cohort', 'existing_learner_cohort', 'staff_bootstrap')
  ),
  email text not null check (
    email = lower(trim(email)) and
    email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and
    char_length(email) between 5 and 254
  ),
  intended_role public.app_role not null check (
    intended_role in ('learner', 'instructor', 'admin')
  ),
  status text not null default 'prepared' check (
    status in ('prepared', 'sent', 'redeemed', 'expired', 'failed', 'superseded')
  ),
  token_hash text,
  sent_at timestamptz,
  expires_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by_user_id uuid references public.profiles (id) on delete set null,
  invited_by uuid references public.profiles (id) on delete set null,
  supersedes_invitation_id uuid references public.access_invitations (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitation_target_exclusive check (
    (cohort_roster_entry_id is not null and staff_access_entry_id is null) or
    (cohort_roster_entry_id is null and staff_access_entry_id is not null)
  ),
  constraint invitation_token_hash_format_check check (
    token_hash is null or token_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint invitation_status_lifecycle_check check (
    case status
      when 'prepared' then
        token_hash is null and
        sent_at is null and
        expires_at is null and
        redeemed_at is null and
        redeemed_by_user_id is null
      when 'sent' then
        token_hash is not null and
        sent_at is not null and
        expires_at is not null and
        redeemed_at is null and
        redeemed_by_user_id is null
      when 'redeemed' then
        token_hash is not null and
        sent_at is not null and
        expires_at is not null and
        redeemed_at is not null and
        redeemed_by_user_id is not null
      when 'expired' then
        token_hash is not null and
        sent_at is not null and
        expires_at is not null and
        redeemed_at is null and
        redeemed_by_user_id is null
      when 'superseded' then
        token_hash is not null and
        sent_at is not null and
        expires_at is not null and
        redeemed_at is null and
        redeemed_by_user_id is null
      when 'failed' then
        redeemed_at is null and
        redeemed_by_user_id is null and
        (
          (token_hash is null and sent_at is null and expires_at is null) or
          (token_hash is not null and sent_at is not null and expires_at is not null)
        )
      else false
    end
  ),
  constraint invitation_exact_seven_day_expiry_check check (
    sent_at is null or expires_at is null or (expires_at = sent_at + interval '7 days')
  )
);

create unique index if not exists access_invitations_token_hash_idx
  on public.access_invitations (token_hash)
  where token_hash is not null;

create unique index if not exists access_invitations_active_roster_attempt_idx
  on public.access_invitations (cohort_roster_entry_id)
  where status in ('prepared', 'sent');

create unique index if not exists access_invitations_active_staff_attempt_idx
  on public.access_invitations (staff_access_entry_id)
  where status in ('prepared', 'sent');

create index if not exists access_invitations_org_email_idx
  on public.access_invitations (organization_id, email);
create index if not exists access_invitations_expires_idx
  on public.access_invitations (expires_at)
  where status = 'sent';

comment on table public.access_invitations is
  'Invitation attempt history linked to exactly one durable roster or staff access intent.';

-- Validation trigger on access_invitations
create or replace function private.validate_access_invitation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_roster record;
  v_staff record;
  v_superseded record;
begin
  if new.cohort_roster_entry_id is not null then
    select organization_id, email into v_roster
    from public.cohort_learner_roster
    where id = new.cohort_roster_entry_id;

    if v_roster.organization_id is null then
      raise exception 'Referenced cohort roster entry % does not exist', new.cohort_roster_entry_id using errcode = '23503';
    end if;

    if new.organization_id <> v_roster.organization_id then
      raise exception 'Invitation organization does not match roster target organization' using errcode = 'P0001';
    end if;

    if new.email <> v_roster.email then
      raise exception 'Invitation email does not match roster target email' using errcode = 'P0001';
    end if;

    if new.intended_role <> 'learner' then
      raise exception 'Learner roster invitation must have intended_role = learner' using errcode = 'P0001';
    end if;

    if new.invitation_type not in ('new_learner_cohort', 'existing_learner_cohort') then
      raise exception 'Learner roster invitation must have invitation_type new_learner_cohort or existing_learner_cohort' using errcode = 'P0001';
    end if;
  elsif new.staff_access_entry_id is not null then
    select organization_id, email, intended_role into v_staff
    from public.staff_access_entries
    where id = new.staff_access_entry_id;

    if v_staff.organization_id is null then
      raise exception 'Referenced staff access entry % does not exist', new.staff_access_entry_id using errcode = '23503';
    end if;

    if new.organization_id <> v_staff.organization_id then
      raise exception 'Invitation organization does not match staff target organization' using errcode = 'P0001';
    end if;

    if new.email <> v_staff.email then
      raise exception 'Invitation email does not match staff target email' using errcode = 'P0001';
    end if;

    if new.intended_role <> v_staff.intended_role then
      raise exception 'Staff invitation intended_role % does not match target %', new.intended_role, v_staff.intended_role using errcode = 'P0001';
    end if;

    if new.invitation_type <> 'staff_bootstrap' then
      raise exception 'Staff invitation must have invitation_type staff_bootstrap' using errcode = 'P0001';
    end if;
  else
    raise exception 'Invitation must target either cohort_roster_entry_id or staff_access_entry_id' using errcode = 'P0001';
  end if;

  if new.supersedes_invitation_id is not null then
    if new.id is not null and new.supersedes_invitation_id = new.id then
      raise exception 'Invitation cannot supersede itself' using errcode = 'P0001';
    end if;

    select organization_id, cohort_roster_entry_id, staff_access_entry_id
    into v_superseded
    from public.access_invitations
    where id = new.supersedes_invitation_id;

    if v_superseded.organization_id is null then
      raise exception 'Superseded invitation % does not exist', new.supersedes_invitation_id using errcode = '23503';
    end if;

    if v_superseded.organization_id <> new.organization_id then
      raise exception 'Superseded invitation belongs to different organization' using errcode = 'P0001';
    end if;

    if new.cohort_roster_entry_id is not null then
      if v_superseded.cohort_roster_entry_id is null or v_superseded.cohort_roster_entry_id <> new.cohort_roster_entry_id or v_superseded.staff_access_entry_id is not null then
        raise exception 'Superseded invitation must target the same cohort roster entry' using errcode = 'P0001';
      end if;
    elsif new.staff_access_entry_id is not null then
      if v_superseded.staff_access_entry_id is null or v_superseded.staff_access_entry_id <> new.staff_access_entry_id or v_superseded.cohort_roster_entry_id is not null then
        raise exception 'Superseded invitation must target the same staff access entry' using errcode = 'P0001';
      end if;
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.validate_access_invitation() from public;

drop trigger if exists trg_validate_access_invitation on public.access_invitations;
create trigger trg_validate_access_invitation
  before insert or update on public.access_invitations
  for each row execute function private.validate_access_invitation();

-- Fail closed RLS for access_invitations
alter table public.access_invitations enable row level security;


-- 6. Create private.learner_identities
create table if not exists private.learner_identities (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  id_type text not null check (id_type in ('mykad', 'passport')),
  id_number text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_identities_id_type_number_key unique (id_type, id_number),
  constraint learner_identities_format_check check (
    (id_type = 'mykad' and id_number ~ '^[0-9]{12}$') or
    (id_type = 'passport' and id_number ~ '^[A-Z0-9]{6,20}$')
  )
);

comment on table private.learner_identities is
  'Sensitive identity boundary in private schema. Completely inaccessible to browser roles.';

drop trigger if exists trg_learner_identities_updated_at on private.learner_identities;
create trigger trg_learner_identities_updated_at
  before update on private.learner_identities
  for each row execute function private.set_updated_at();

-- Strictly revoke all privileges from browser-facing roles
revoke all on table private.learner_identities from public, anon, authenticated;
