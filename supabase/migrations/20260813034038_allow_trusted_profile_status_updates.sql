create or replace function private.validate_profile_account_status_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
begin
  if old.account_status = new.account_status or actor is null then
    return new;
  end if;

  if actor = old.id
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

revoke all on function private.validate_profile_account_status_change()
  from public;

comment on function private.validate_profile_account_status_change() is
  'Browser status changes require a different same-organization administrator; trusted direct/service operations have no auth.uid().';
