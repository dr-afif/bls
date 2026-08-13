insert into public.organizations (id, name, slug, active)
values (
  '10000000-0000-0000-0000-000000000001',
  'BLS Learning Demonstration Organisation',
  'bls-learning-demo',
  true
)
on conflict (id) do nothing;

insert into public.cohorts (
  id,
  organization_id,
  code,
  name,
  description,
  venue,
  start_at,
  end_at,
  status,
  contact_name,
  contact_phone,
  preparation_notes,
  created_by
)
select
  '11000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'BLS-DEMO-01',
  'BLS Provider Course — Demonstration',
  'Fictional physical-course schedule for authenticated development testing.',
  'Clinical Skills Centre, Simulation Lab 2',
  '2026-08-22 00:30:00+00',
  '2026-08-22 08:30:00+00',
  'scheduled',
  'Course Operations Desk',
  '+60 3 0000 0000',
  'Wear comfortable clinical attire and arrive 15 minutes before registration.',
  admin_user.id
from auth.users admin_user
where admin_user.email = 'admin@bls.local'
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  description = excluded.description,
  venue = excluded.venue,
  start_at = excluded.start_at,
  end_at = excluded.end_at,
  status = excluded.status,
  contact_name = excluded.contact_name,
  contact_phone = excluded.contact_phone,
  preparation_notes = excluded.preparation_notes;

insert into public.cohort_members (
  cohort_id,
  user_id,
  member_role,
  membership_status,
  added_by
)
select
  '11000000-0000-0000-0000-000000000001',
  member_user.id,
  expected_role.member_role,
  'active',
  admin_user.id
from (
  values
    ('learner@bls.local', 'learner'::public.cohort_member_role),
    ('instructor@bls.local', 'instructor'::public.cohort_member_role)
) as expected_role(email, member_role)
join auth.users member_user on member_user.email = expected_role.email
join auth.users admin_user on admin_user.email = 'admin@bls.local'
on conflict (cohort_id, user_id) do update set
  member_role = excluded.member_role,
  membership_status = excluded.membership_status,
  completed_at = null;
