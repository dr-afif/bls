create type public.course_status as enum (
  'draft', 'published', 'retired', 'archived'
);
create type public.entitlement_access_type as enum (
  'permanent', 'fixed_window'
);
create type public.entitlement_status as enum (
  'pending', 'active', 'expired', 'revoked'
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete restrict,
  slug text not null check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  title text not null check (char_length(trim(title)) between 2 and 160),
  description text,
  status public.course_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index courses_organization_slug_unique
  on public.courses (organization_id, slug);
create index courses_created_by_idx on public.courses (created_by)
  where created_by is not null;
create index courses_updated_by_idx on public.courses (updated_by)
  where updated_by is not null;

create trigger courses_set_updated_at before update on public.courses
for each row execute function private.set_updated_at();

insert into public.courses (
  organization_id,
  slug,
  title,
  description,
  status
)
select distinct
  c.organization_id,
  'adult-bls',
  'Adult Basic Life Support',
  'Physical-course companion resources for Adult Basic Life Support.',
  'published'::public.course_status
from public.cohorts c
on conflict (organization_id, slug) do nothing;

alter table public.cohorts add column course_id uuid;

update public.cohorts c
set course_id = course.id
from public.courses course
where course.organization_id = c.organization_id
  and course.slug = 'adult-bls'
  and c.course_id is null;

alter table public.cohorts
  alter column course_id set not null,
  add constraint cohorts_course_id_fkey
    foreign key (course_id) references public.courses (id) on delete restrict;

create index cohorts_course_id_idx on public.cohorts (course_id);

create table public.bls_topics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete restrict,
  slug text not null check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  name text not null check (char_length(trim(name)) between 2 and 100),
  description text,
  display_order integer not null default 0 check (display_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index bls_topics_organization_slug_unique
  on public.bls_topics (organization_id, slug);
create index bls_topics_organization_order_idx
  on public.bls_topics (organization_id, display_order, name);

create trigger bls_topics_set_updated_at before update on public.bls_topics
for each row execute function private.set_updated_at();

create table public.teaching_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete restrict,
  slug text not null check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  name text not null check (char_length(trim(name)) between 2 and 100),
  description text,
  display_order integer not null default 0 check (display_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index teaching_stages_organization_slug_unique
  on public.teaching_stages (organization_id, slug);
create index teaching_stages_organization_order_idx
  on public.teaching_stages (organization_id, display_order, name);

create trigger teaching_stages_set_updated_at
before update on public.teaching_stages
for each row execute function private.set_updated_at();

create table public.course_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,
  cohort_id uuid references public.cohorts (id) on delete restrict,
  access_type public.entitlement_access_type not null,
  starts_at timestamptz,
  expires_at timestamptz,
  activated_at timestamptz,
  status public.entitlement_status not null default 'pending',
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_by uuid references public.profiles (id) on delete set null,
  revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_entitlements_window_valid check (
    expires_at is null or starts_at is null or expires_at > starts_at
  ),
  constraint course_entitlements_access_type_valid check (
    (access_type = 'permanent' and expires_at is null)
    or (access_type = 'fixed_window' and expires_at is not null)
  ),
  constraint course_entitlements_revocation_valid check (
    (status = 'revoked' and revoked_at is not null and revoked_by is not null)
    or (status <> 'revoked' and revoked_at is null and revoked_by is null
      and revocation_reason is null)
  )
);

create index course_entitlements_user_course_status_idx
  on public.course_entitlements (user_id, course_id, status);
create index course_entitlements_course_id_idx
  on public.course_entitlements (course_id);
create index course_entitlements_cohort_id_idx
  on public.course_entitlements (cohort_id)
  where cohort_id is not null;
create index course_entitlements_organization_status_idx
  on public.course_entitlements (organization_id, status);
create index course_entitlements_expires_at_idx
  on public.course_entitlements (expires_at)
  where status = 'active' and expires_at is not null;
create index course_entitlements_granted_by_idx
  on public.course_entitlements (granted_by)
  where granted_by is not null;
create index course_entitlements_revoked_by_idx
  on public.course_entitlements (revoked_by)
  where revoked_by is not null;

create trigger course_entitlements_set_updated_at
before update on public.course_entitlements
for each row execute function private.set_updated_at();

create function private.course_organization_id(target_course_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select c.organization_id
  from public.courses c
  where c.id = target_course_id;
$$;

create function private.is_assigned_instructor_for_course(target_course_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active_user()
    and private.has_role(array['instructor']::public.app_role[])
    and exists (
      select 1
      from public.cohort_members cm
      join public.cohorts c on c.id = cm.cohort_id
      where c.course_id = target_course_id
        and cm.user_id = (select auth.uid())
        and cm.member_role = 'instructor'
        and cm.membership_status = 'active'
        and c.status in ('scheduled', 'active')
    );
$$;

create function private.has_effective_course_access(target_course_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active_user()
    and exists (
      select 1
      from public.course_entitlements ce
      join public.courses c on c.id = ce.course_id
      where ce.user_id = (select auth.uid())
        and ce.course_id = target_course_id
        and ce.organization_id = private.current_organization_id()
        and c.organization_id = ce.organization_id
        and c.status = 'published'
        and ce.status = 'active'
        and (ce.starts_at is null or ce.starts_at <= now())
        and (ce.expires_at is null or ce.expires_at > now())
        and (
          ce.cohort_id is null
          or exists (
            select 1
            from public.cohort_members cm
            where cm.cohort_id = ce.cohort_id
              and cm.user_id = (select auth.uid())
              and cm.membership_status = 'active'
          )
        )
    );
$$;

create function private.has_any_effective_course_access(
  target_organization_id uuid
)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active_user()
    and private.current_organization_id() = target_organization_id
    and exists (
      select 1
      from public.course_entitlements ce
      join public.courses c on c.id = ce.course_id
      where ce.user_id = (select auth.uid())
        and ce.organization_id = target_organization_id
        and c.organization_id = target_organization_id
        and c.status = 'published'
        and ce.status = 'active'
        and (ce.starts_at is null or ce.starts_at <= now())
        and (ce.expires_at is null or ce.expires_at > now())
    );
$$;

create function private.validate_cohort_course()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  target_course_organization uuid;
begin
  select organization_id into target_course_organization
  from public.courses
  where id = new.course_id;

  if target_course_organization is null
    or target_course_organization <> new.organization_id then
    raise exception 'Cohort and course must belong to the same organization'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create function private.validate_course_entitlement()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  profile_organization uuid;
  course_organization uuid;
  cohort_organization uuid;
  cohort_course uuid;
  actor uuid := (select auth.uid());
begin
  select organization_id into profile_organization
  from public.profiles where id = new.user_id;
  select organization_id into course_organization
  from public.courses where id = new.course_id;

  if profile_organization is null or course_organization is null
    or profile_organization <> new.organization_id
    or course_organization <> new.organization_id then
    raise exception 'Entitlement user and course must share an organization'
      using errcode = '23514';
  end if;

  if new.cohort_id is not null then
    select organization_id, course_id
      into cohort_organization, cohort_course
    from public.cohorts where id = new.cohort_id;

    if cohort_organization is null
      or cohort_organization <> new.organization_id
      or cohort_course <> new.course_id then
      raise exception 'Entitlement cohort must match its organization and course'
        using errcode = '23514';
    end if;
  end if;

  if new.status = 'active' and new.activated_at is null then
    new.activated_at := now();
  end if;

  if actor is not null and tg_op = 'INSERT' and new.granted_by <> actor then
    raise exception 'Entitlement grantor must be the acting administrator'
      using errcode = '23514';
  end if;

  if actor is not null and new.status = 'revoked' and new.revoked_by <> actor then
    raise exception 'Entitlement revoker must be the acting administrator'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.course_organization_id(uuid) from public;
revoke all on function private.is_assigned_instructor_for_course(uuid)
  from public;
revoke all on function private.has_effective_course_access(uuid) from public;
revoke all on function private.has_any_effective_course_access(uuid) from public;
revoke all on function private.validate_cohort_course() from public;
revoke all on function private.validate_course_entitlement() from public;

grant execute on function private.course_organization_id(uuid)
  to authenticated, service_role;
grant execute on function private.is_assigned_instructor_for_course(uuid)
  to authenticated, service_role;
grant execute on function private.has_effective_course_access(uuid)
  to authenticated, service_role;
grant execute on function private.has_any_effective_course_access(uuid)
  to authenticated, service_role;

create trigger cohorts_validate_course
before insert or update of organization_id, course_id on public.cohorts
for each row execute function private.validate_cohort_course();

create trigger course_entitlements_validate
before insert or update on public.course_entitlements
for each row execute function private.validate_course_entitlement();

comment on function private.has_effective_course_access(uuid) is
  'Checks active account, matching organization, published course, entitlement window, revocation state, and optional active cohort membership.';
