create index cohort_members_added_by_idx
  on public.cohort_members (added_by);

create index cohorts_created_by_idx
  on public.cohorts (created_by);

create index profiles_organization_id_idx
  on public.profiles (organization_id);

create index user_roles_created_by_idx
  on public.user_roles (created_by);
