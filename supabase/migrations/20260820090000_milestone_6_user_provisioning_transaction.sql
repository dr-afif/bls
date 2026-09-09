-- Migration: 20260820090000_milestone_6_user_provisioning_transaction.sql
-- Description: Transactional invited user provisioning RPC and email confirmation lifecycle trigger

-- 1. Account lifecycle trigger for confirmed email
create or replace function private.handle_auth_user_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles
    set account_status = case
      when organization_id is not null then 'active'::public.account_status
      else 'pending_approval'::public.account_status
    end,
    updated_at = now()
    where id = new.id and account_status = 'pending_verification';
  end if;
  return new;
end;
$$;

revoke all on function private.handle_auth_user_confirmed() from public;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function private.handle_auth_user_confirmed();

comment on function private.handle_auth_user_confirmed() is
  'Automatically transitions invited users with assigned organizations from pending_verification to active once email is confirmed.';

-- 2. Transactional provisioning RPC for invited users
create or replace function public.provision_invited_user(
  target_user_id uuid,
  target_organization_id uuid,
  target_role public.app_role,
  full_name text,
  actor_user_id uuid,
  access_mode text default 'unlimited',
  access_starts_at timestamptz default null,
  access_ends_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_active boolean;
  v_actor_is_super boolean := false;
  v_actor_is_org_admin boolean := false;
  v_target_profile record;
  v_email_confirmed_at timestamptz;
  v_resolved_status public.account_status;
  v_clean_name text;
begin
  -- Input presence checks
  if target_user_id is null then
    raise exception 'Target user ID is required' using errcode = '22023';
  end if;

  if target_organization_id is null then
    raise exception 'Target organization ID is required' using errcode = '22023';
  end if;

  if actor_user_id is null then
    raise exception 'Actor user ID is required' using errcode = '22023';
  end if;

  -- Validate target role: strictly restrict to learner or instructor
  if target_role not in ('learner'::public.app_role, 'instructor'::public.app_role) then
    raise exception 'Unsupported target role: %', target_role using errcode = '22023';
  end if;

  -- Validate full_name
  v_clean_name := trim(full_name);
  if v_clean_name is null or char_length(v_clean_name) < 1 or char_length(v_clean_name) > 160 then
    raise exception 'Full name must be between 1 and 160 characters' using errcode = '22023';
  end if;

  -- Validate organization exists and is active
  if not exists (
    select 1 from public.organizations
    where id = target_organization_id and active = true
  ) then
    raise exception 'Target organization not found or inactive' using errcode = '22023';
  end if;

  -- Validate actor caller authorization
  select (account_status = 'active') into v_actor_active
  from public.profiles
  where id = actor_user_id;

  if v_actor_active is not true then
    raise exception 'Actor account is not active or does not exist' using errcode = '42501';
  end if;

  select exists (
    select 1 from public.user_roles
    where user_id = actor_user_id and role = 'super_admin'::public.app_role
  ) into v_actor_is_super;

  if not v_actor_is_super then
    select exists (
      select 1 from public.user_roles ur
      join public.profiles p on p.id = ur.user_id
      where ur.user_id = actor_user_id
        and ur.role = 'admin'::public.app_role
        and p.organization_id = target_organization_id
    ) into v_actor_is_org_admin;

    if not v_actor_is_org_admin then
      raise exception 'Actor is not an authorized administrator for the target organization'
        using errcode = '42501';
    end if;
  end if;

  -- Validate access mode and range
  if access_mode = 'limited' then
    if access_ends_at is null then
      raise exception 'Expiry date is required for limited access' using errcode = '22023';
    end if;
    if access_ends_at <= now() then
      raise exception 'Expiry date must be in the future' using errcode = '22023';
    end if;
    if access_starts_at is not null and access_ends_at <= access_starts_at then
      raise exception 'Expiry date must be after access start date' using errcode = '22023';
    end if;
  elsif access_mode <> 'unlimited' then
    raise exception 'Invalid access mode: %', access_mode using errcode = '22023';
  end if;

  -- Acquire exclusive row lock on target profile and validate strictly unprovisioned state
  select * into v_target_profile
  from public.profiles
  where id = target_user_id
  for update;

  if not found then
    raise exception 'Target user profile not found' using errcode = 'P0002';
  end if;

  if v_target_profile.organization_id is not null then
    raise exception 'Target user already belongs to an organization' using errcode = '42501';
  end if;

  if v_target_profile.account_status <> 'pending_verification'::public.account_status then
    raise exception 'Target user profile is not in pending_verification state' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.user_roles
    where user_id = target_user_id
  ) then
    raise exception 'Target user already has assigned roles' using errcode = '42501';
  end if;

  -- Check email confirmation status from auth.users to maintain lifecycle invariant
  select email_confirmed_at into v_email_confirmed_at
  from auth.users
  where id = target_user_id;

  if v_email_confirmed_at is not null then
    v_resolved_status := 'active'::public.account_status;
  else
    v_resolved_status := 'pending_verification'::public.account_status;
  end if;

  -- 1. Update target profile (guarded by exclusive row lock and verified unprovisioned state)
  update public.profiles
  set organization_id = target_organization_id,
      full_name = v_clean_name,
      account_status = v_resolved_status,
      updated_at = now()
  where id = target_user_id;

  -- 2. Assign exactly one initial target role (strictly create-only, zero existing roles proved)
  insert into public.user_roles (user_id, role, created_by)
  values (target_user_id, target_role, actor_user_id);

  -- 3. Record audit event in the same transaction
  insert into public.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    organization_id,
    metadata,
    request_id
  ) values (
    actor_user_id,
    'auth.user.invited',
    'profile',
    target_user_id,
    target_organization_id,
    jsonb_build_object(
      'role', target_role,
      'access_mode', access_mode,
      'access_starts_at', access_starts_at,
      'access_ends_at', access_ends_at
    ),
    gen_random_uuid()
  );

  return jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'organization_id', target_organization_id,
    'role', target_role,
    'access_mode', access_mode,
    'account_status', v_resolved_status
  );
end;
$$;

-- Revoke all execution rights from anon, authenticated, and public
revoke all on function public.provision_invited_user(uuid, uuid, public.app_role, text, uuid, text, timestamptz, timestamptz)
  from public, anon, authenticated;

-- Grant execution exclusively to service_role
grant execute on function public.provision_invited_user(uuid, uuid, public.app_role, text, uuid, text, timestamptz, timestamptz)
  to service_role;

comment on function public.provision_invited_user(uuid, uuid, public.app_role, text, uuid, text, timestamptz, timestamptz) is
  'Atomically provisions an invited user profile, initial role, and audit event. Callable only by trusted service_role.';
