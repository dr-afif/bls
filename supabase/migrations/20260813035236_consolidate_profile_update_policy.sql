drop policy profiles_update_own_approved_fields on public.profiles;
drop policy profiles_update_admin on public.profiles;

create policy profiles_update_authorized on public.profiles for update
to authenticated
using (
  (id = (select auth.uid()) and private.is_active_user())
  or private.is_admin_in_organization(organization_id)
)
with check (
  (id = (select auth.uid()) and private.is_active_user())
  or private.is_admin_in_organization(organization_id)
);

comment on policy profiles_update_authorized on public.profiles is
  'Column grants constrain self-service fields; account-status trigger requires a different same-organization administrator.';
