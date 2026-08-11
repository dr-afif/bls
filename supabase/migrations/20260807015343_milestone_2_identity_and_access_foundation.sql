create schema if not exists private;
revoke all on schema private from public;

create type public.app_role as enum ('learner', 'instructor', 'admin', 'super_admin');
create type public.account_status as enum (
  'pending_verification', 'pending_approval', 'active', 'suspended', 'expired', 'archived'
);
create type public.cohort_status as enum (
  'draft', 'scheduled', 'active', 'completed', 'cancelled', 'archived'
);
create type public.cohort_member_role as enum ('learner', 'instructor');
create type public.membership_status as enum ('active', 'completed', 'removed');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete restrict,
  full_name text not null check (char_length(trim(full_name)) between 1 and 160),
  staff_id text,
  phone text,
  profession text,
  department text,
  account_status public.account_status not null default 'pending_approval',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  primary key (user_id, role)
);

create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 160),
  description text,
  venue text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.cohort_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cohorts_end_after_start check (end_at > start_at)
);

create table public.cohort_members (
  cohort_id uuid not null references public.cohorts (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  member_role public.cohort_member_role not null,
  membership_status public.membership_status not null default 'active',
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  added_by uuid references public.profiles (id) on delete set null,
  primary key (cohort_id, user_id),
  constraint completed_membership_has_timestamp check (
    membership_status <> 'completed' or completed_at is not null
  )
);

create unique index one_active_cohort_per_learner
  on public.cohort_members (user_id)
  where member_role = 'learner' and membership_status = 'active';
create index cohort_members_user_id_idx on public.cohort_members (user_id);
create index cohorts_organization_start_idx on public.cohorts (organization_id, start_at);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(trim(action)) between 3 and 120),
  entity_type text not null check (char_length(trim(entity_type)) between 2 and 80),
  entity_id uuid,
  organization_id uuid references public.organizations (id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  request_id uuid,
  created_at timestamptz not null default now()
);

create index audit_events_organization_created_idx
  on public.audit_events (organization_id, created_at desc);
create index audit_events_actor_created_idx
  on public.audit_events (actor_user_id, created_at desc);

create function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger cohorts_set_updated_at before update on public.cohorts
for each row execute function private.set_updated_at();

create function private.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, account_status)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'New user'
    ),
    case
      when new.email_confirmed_at is null then 'pending_verification'::public.account_status
      else 'pending_approval'::public.account_status
    end
  );
  return new;
end;
$$;
revoke all on function private.handle_new_auth_user() from public;

create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_auth_user();

create function private.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.account_status = 'active'
  );
$$;

create function private.current_organization_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select p.organization_id from public.profiles p
  where p.id = (select auth.uid());
$$;

create function private.has_role(required_roles public.app_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = any(required_roles)
  );
$$;

create function private.is_admin_in_organization(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active_user()
    and private.has_role(array['admin', 'super_admin']::public.app_role[])
    and (
      private.has_role(array['super_admin']::public.app_role[])
      or private.current_organization_id() = target_organization_id
    );
$$;

create function private.is_assigned_instructor(target_cohort_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active_user()
    and private.has_role(array['instructor']::public.app_role[])
    and exists (
      select 1 from public.cohort_members cm
      where cm.cohort_id = target_cohort_id
        and cm.user_id = (select auth.uid())
        and cm.member_role = 'instructor'
        and cm.membership_status = 'active'
    );
$$;

create function private.is_active_cohort_member(target_cohort_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active_user()
    and exists (
      select 1 from public.cohort_members cm
      where cm.cohort_id = target_cohort_id
        and cm.user_id = (select auth.uid())
        and cm.membership_status = 'active'
    );
$$;

create function private.cohort_organization_id(target_cohort_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select c.organization_id from public.cohorts c where c.id = target_cohort_id;
$$;

create function private.profile_organization_id(target_user_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select p.organization_id from public.profiles p where p.id = target_user_id;
$$;

create function private.shares_active_instructor_cohort(target_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active_user()
    and private.has_role(array['instructor']::public.app_role[])
    and exists (
      select 1
      from public.cohort_members instructor_membership
      join public.cohort_members target_membership
        on target_membership.cohort_id = instructor_membership.cohort_id
      where instructor_membership.user_id = (select auth.uid())
        and instructor_membership.member_role = 'instructor'
        and instructor_membership.membership_status = 'active'
        and target_membership.user_id = target_user_id
        and target_membership.membership_status = 'active'
    );
$$;

revoke all on all functions in schema private from public;
grant usage on schema private to authenticated, service_role;
grant execute on function private.is_active_user() to authenticated, service_role;
grant execute on function private.current_organization_id() to authenticated, service_role;
grant execute on function private.has_role(public.app_role[]) to authenticated, service_role;
grant execute on function private.is_admin_in_organization(uuid) to authenticated, service_role;
grant execute on function private.is_assigned_instructor(uuid) to authenticated, service_role;
grant execute on function private.is_active_cohort_member(uuid) to authenticated, service_role;
grant execute on function private.cohort_organization_id(uuid) to authenticated, service_role;
grant execute on function private.profile_organization_id(uuid) to authenticated, service_role;
grant execute on function private.shares_active_instructor_cohort(uuid) to authenticated, service_role;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.audit_events enable row level security;

revoke all on table public.organizations from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.user_roles from anon, authenticated;
revoke all on table public.cohorts from anon, authenticated;
revoke all on table public.cohort_members from anon, authenticated;
revoke all on table public.audit_events from anon, authenticated;

grant select on table public.organizations to authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, staff_id, phone, profession, department)
  on table public.profiles to authenticated;
grant select on table public.user_roles to authenticated;
grant select on table public.cohorts to authenticated;
grant select on table public.cohort_members to authenticated;
grant select on table public.audit_events to authenticated;

grant select, insert, update, delete on table public.organizations to service_role;
grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.user_roles to service_role;
grant select, insert, update, delete on table public.cohorts to service_role;
grant select, insert, update, delete on table public.cohort_members to service_role;
grant select, insert on table public.audit_events to service_role;

create policy organizations_select_member on public.organizations for select
to authenticated using (
  private.is_active_user() and id = private.current_organization_id()
);

create policy profiles_select_authorized on public.profiles for select
to authenticated using (
  id = (select auth.uid())
  or private.is_admin_in_organization(organization_id)
  or private.shares_active_instructor_cohort(id)
);

create policy profiles_update_own_approved_fields on public.profiles for update
to authenticated
using (id = (select auth.uid()) and private.is_active_user())
with check (id = (select auth.uid()) and private.is_active_user());

create policy user_roles_select_authorized on public.user_roles for select
to authenticated using (
  user_id = (select auth.uid())
  or private.is_admin_in_organization(private.profile_organization_id(user_id))
);

create policy cohorts_select_authorized on public.cohorts for select
to authenticated using (
  private.is_active_user()
  and (
    private.is_admin_in_organization(organization_id)
    or private.is_active_cohort_member(id)
  )
);

create policy cohort_members_select_authorized on public.cohort_members for select
to authenticated using (
  private.is_active_user()
  and (
    user_id = (select auth.uid())
    or private.is_assigned_instructor(cohort_id)
    or private.is_admin_in_organization(private.cohort_organization_id(cohort_id))
  )
);

create policy audit_events_select_admin on public.audit_events for select
to authenticated using (private.is_admin_in_organization(organization_id));

comment on table public.audit_events is
  'Append-only audit foundation. Browser roles have no insert, update, or delete privileges.';
comment on function private.has_role(public.app_role[]) is
  'Authorization helper backed by user_roles; never trusts user-editable metadata.';
