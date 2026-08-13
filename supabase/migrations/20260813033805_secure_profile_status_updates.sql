revoke execute on function public.set_profile_account_status(
  uuid,
  public.account_status
) from authenticated, service_role;

drop function public.set_profile_account_status(uuid, public.account_status);

grant update (account_status) on table public.profiles to authenticated;

create policy profiles_update_admin on public.profiles for update
to authenticated
using (private.is_admin_in_organization(organization_id))
with check (private.is_admin_in_organization(organization_id));

create function private.validate_profile_account_status_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
begin
  if old.account_status = new.account_status then
    return new;
  end if;

  if actor is null or actor = old.id
    or not private.is_admin_in_organization(old.organization_id) then
    raise exception 'Not authorized to change this account status'
      using errcode = '42501';
  end if;

  if new.account_status = 'pending_verification' then
    raise exception 'Verification status is controlled by Supabase Auth'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create function private.audit_profile_account_status_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
begin
  if actor is null or old.account_status = new.account_status then
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
    'profile.account_status_changed',
    'profile',
    new.id,
    new.organization_id,
    jsonb_build_object('from', old.account_status, 'to', new.account_status),
    gen_random_uuid()
  );

  return new;
end;
$$;

revoke all on function private.validate_profile_account_status_change()
  from public;
revoke all on function private.audit_profile_account_status_change()
  from public;

create trigger profiles_validate_account_status_change
before update of account_status on public.profiles
for each row execute function private.validate_profile_account_status_change();

create trigger profiles_audit_account_status_change
after update of account_status on public.profiles
for each row execute function private.audit_profile_account_status_change();
