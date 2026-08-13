alter table public.cohorts
  add column code text,
  add column contact_name text,
  add column contact_phone text,
  add column preparation_notes text;

update public.cohorts
set code = 'BLS-' || upper(substr(id::text, 1, 8))
where code is null;

alter table public.cohorts
  alter column code set not null,
  add constraint cohorts_code_format check (
    char_length(trim(code)) between 2 and 32
    and code ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'
  ),
  add constraint cohorts_contact_name_length check (
    contact_name is null or char_length(trim(contact_name)) between 2 and 160
  ),
  add constraint cohorts_contact_phone_length check (
    contact_phone is null or char_length(trim(contact_phone)) between 3 and 40
  );

create unique index cohorts_organization_code_unique
  on public.cohorts (organization_id, lower(code));

create function private.validate_cohort_member()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  cohort_organization uuid;
  profile_organization uuid;
  required_role public.app_role;
begin
  select organization_id into cohort_organization
  from public.cohorts
  where id = new.cohort_id;

  select organization_id into profile_organization
  from public.profiles
  where id = new.user_id;

  if cohort_organization is null or profile_organization is null
    or cohort_organization <> profile_organization then
    raise exception 'Cohort members must belong to the cohort organization'
      using errcode = '23514';
  end if;

  required_role := case new.member_role
    when 'learner' then 'learner'::public.app_role
    when 'instructor' then 'instructor'::public.app_role
  end;

  if not exists (
    select 1 from public.user_roles
    where user_id = new.user_id and role = required_role
  ) then
    raise exception 'Cohort member role must match an assigned application role'
      using errcode = '23514';
  end if;

  if new.membership_status = 'completed' and new.completed_at is null then
    new.completed_at := now();
  elsif new.membership_status = 'active' then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_cohort_member() from public;

create trigger cohort_members_validate
before insert or update on public.cohort_members
for each row execute function private.validate_cohort_member();

create function private.audit_cohort_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
begin
  if actor is null then
    return new;
  end if;

  insert into public.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    organization_id,
    metadata,
    request_id
  ) values (
    actor,
    case when tg_op = 'INSERT' then 'cohort.created' else 'cohort.updated' end,
    'cohort',
    new.id,
    new.organization_id,
    jsonb_build_object('code', new.code, 'status', new.status),
    gen_random_uuid()
  );

  return new;
end;
$$;

create function private.audit_cohort_membership_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  target_organization uuid;
begin
  if actor is null then
    return new;
  end if;

  select organization_id into target_organization
  from public.cohorts
  where id = new.cohort_id;

  insert into public.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    organization_id,
    metadata,
    request_id
  ) values (
    actor,
    case
      when tg_op = 'INSERT' then 'cohort.member_assigned'
      else 'cohort.membership_status_changed'
    end,
    'cohort_membership',
    new.user_id,
    target_organization,
    jsonb_build_object(
      'cohort_id', new.cohort_id,
      'member_role', new.member_role,
      'membership_status', new.membership_status
    ),
    gen_random_uuid()
  );

  return new;
end;
$$;

revoke all on function private.audit_cohort_change() from public;
revoke all on function private.audit_cohort_membership_change() from public;

create trigger cohorts_audit_change
after insert or update on public.cohorts
for each row execute function private.audit_cohort_change();

create trigger cohort_members_audit_change
after insert or update on public.cohort_members
for each row execute function private.audit_cohort_membership_change();

grant insert on table public.cohorts to authenticated;
grant update (
  code,
  name,
  description,
  venue,
  start_at,
  end_at,
  status,
  contact_name,
  contact_phone,
  preparation_notes
) on table public.cohorts to authenticated;

grant insert on table public.cohort_members to authenticated;
grant update (membership_status, completed_at)
  on table public.cohort_members to authenticated;

create policy cohorts_insert_admin on public.cohorts for insert
to authenticated with check (
  private.is_admin_in_organization(organization_id)
  and created_by = (select auth.uid())
);

create policy cohorts_update_admin on public.cohorts for update
to authenticated
using (private.is_admin_in_organization(organization_id))
with check (private.is_admin_in_organization(organization_id));

create policy cohort_members_insert_admin on public.cohort_members for insert
to authenticated with check (
  private.is_admin_in_organization(private.cohort_organization_id(cohort_id))
  and added_by = (select auth.uid())
);

create policy cohort_members_update_admin on public.cohort_members for update
to authenticated
using (
  private.is_admin_in_organization(private.cohort_organization_id(cohort_id))
)
with check (
  private.is_admin_in_organization(private.cohort_organization_id(cohort_id))
);

create function public.set_profile_account_status(
  target_user_id uuid,
  new_status public.account_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_organization uuid;
  previous_status public.account_status;
begin
  if actor is null or not private.is_active_user() then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if target_user_id = actor then
    raise exception 'Administrators cannot change their own account status'
      using errcode = '42501';
  end if;

  if new_status = 'pending_verification' then
    raise exception 'Verification status is controlled by Supabase Auth'
      using errcode = '23514';
  end if;

  select organization_id, account_status
    into target_organization, previous_status
  from public.profiles
  where id = target_user_id;

  if target_organization is null
    or not private.is_admin_in_organization(target_organization) then
    raise exception 'Not authorized to manage this profile'
      using errcode = '42501';
  end if;

  if previous_status = new_status then
    return;
  end if;

  update public.profiles
  set account_status = new_status
  where id = target_user_id;

  insert into public.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    organization_id,
    metadata,
    request_id
  ) values (
    actor,
    'profile.account_status_changed',
    'profile',
    target_user_id,
    target_organization,
    jsonb_build_object('from', previous_status, 'to', new_status),
    gen_random_uuid()
  );
end;
$$;

revoke all on function public.set_profile_account_status(uuid, public.account_status)
  from public, anon;
grant execute on function public.set_profile_account_status(uuid, public.account_status)
  to authenticated, service_role;

comment on function public.set_profile_account_status(uuid, public.account_status) is
  'Audited administrator-only account status transition for an existing same-organization profile.';
