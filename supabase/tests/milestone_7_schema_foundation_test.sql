begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select extensions.plan(52);

-- 1. Schema, Types, and Columns Existence Checks
select extensions.has_type(
  'public',
  'learner_access_state',
  'public.learner_access_state type exists'
);

select extensions.has_column(
  'public',
  'cohorts',
  'learner_access_state',
  'cohorts.learner_access_state column exists'
);

select extensions.col_default_is(
  'public',
  'cohorts',
  'learner_access_state',
  'open'::public.learner_access_state,
  'cohorts.learner_access_state defaults to open'
);

select extensions.has_table(
  'public',
  'cohort_courses',
  'cohort_courses table exists'
);

select extensions.has_table(
  'public',
  'cohort_learner_roster',
  'cohort_learner_roster table exists'
);

select extensions.has_table(
  'public',
  'staff_access_entries',
  'staff_access_entries table exists'
);

select extensions.has_table(
  'public',
  'access_invitations',
  'access_invitations table exists'
);

select extensions.has_table(
  'private',
  'learner_identities',
  'private.learner_identities table exists'
);

-- Verify account_status contains pending_registration
select extensions.ok(
  exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'account_status'
      and e.enumlabel = 'pending_registration'
  ),
  'account_status enum includes pending_registration'
);

-- Verify one_active_cohort_per_learner index is preserved
select extensions.has_index(
  'public',
  'cohort_members',
  'one_active_cohort_per_learner',
  'one_active_cohort_per_learner index is preserved'
);

-- Setup test fixtures
insert into public.organizations (id, name, slug)
values
  ('81000000-0000-0000-0000-000000000001', 'Test Org 1', 'test-org-1'),
  ('81000000-0000-0000-0000-000000000002', 'Test Org 2', 'test-org-2');

insert into public.courses (id, organization_id, slug, title, status)
values
  ('82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', 'test-course-1', 'Test Course 1', 'published'),
  ('82000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000001', 'test-course-2', 'Test Course 2', 'published'),
  ('82000000-0000-0000-0000-000000000003', '81000000-0000-0000-0000-000000000002', 'test-course-3', 'Test Course 3 (Org 2)', 'published');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('83000000-0000-0000-0000-000000000001', 'actor@test.local', now(), '{"full_name":"Test Actor"}'),
  ('83000000-0000-0000-0000-000000000002', 'learner1@test.local', now(), '{"full_name":"Learner One"}'),
  ('83000000-0000-0000-0000-000000000003', 'learner2@test.local', now(), '{"full_name":"Learner Two"}'),
  ('83000000-0000-0000-0000-000000000004', 'other_org_user@test.local', now(), '{"full_name":"Other Org User"}');

update public.profiles
set organization_id = '81000000-0000-0000-0000-000000000001', account_status = 'active'
where id in (
  '83000000-0000-0000-0000-000000000001',
  '83000000-0000-0000-0000-000000000002',
  '83000000-0000-0000-0000-000000000003'
);

update public.profiles
set organization_id = '81000000-0000-0000-0000-000000000002', account_status = 'active'
where id = '83000000-0000-0000-0000-000000000004';

insert into public.user_roles (user_id, role)
values
  ('83000000-0000-0000-0000-000000000001', 'admin'),
  ('83000000-0000-0000-0000-000000000002', 'learner'),
  ('83000000-0000-0000-0000-000000000003', 'learner'),
  ('83000000-0000-0000-0000-000000000004', 'learner');

-- 2. Test Legacy Cohort Creation & Mirroring to cohort_courses
insert into public.cohorts (
  id, organization_id, course_id, code, name, start_at, end_at, status
) values (
  '84000000-0000-0000-0000-000000000001',
  '81000000-0000-0000-0000-000000000001',
  '82000000-0000-0000-0000-000000000001',
  'COHORT-ALPHA',
  'Cohort Alpha',
  now() + interval '1 day',
  now() + interval '2 days',
  'scheduled'
);

select extensions.is(
  (select course_id from public.cohorts where id = '84000000-0000-0000-0000-000000000001'),
  '82000000-0000-0000-0000-000000000001'::uuid,
  'legacy cohorts.course_id remains populated upon insert'
);

select extensions.ok(
  exists (
    select 1 from public.cohort_courses
    where cohort_id = '84000000-0000-0000-0000-000000000001'
      and course_id = '82000000-0000-0000-0000-000000000001'
  ),
  'legacy cohort insert automatically populates cohort_courses mirror row'
);

-- Test updating legacy course_id
update public.cohorts
set course_id = '82000000-0000-0000-0000-000000000002'
where id = '84000000-0000-0000-0000-000000000001';

select extensions.ok(
  exists (
    select 1 from public.cohort_courses
    where cohort_id = '84000000-0000-0000-0000-000000000001'
      and course_id = '82000000-0000-0000-0000-000000000002'
  ) and not exists (
    select 1 from public.cohort_courses
    where cohort_id = '84000000-0000-0000-0000-000000000001'
      and course_id = '82000000-0000-0000-0000-000000000001'
  ),
  'updating legacy cohorts.course_id safely updates cohort_courses relationship without orphan duplicates'
);

-- Test organization mismatch rejection on legacy cohort insert
select extensions.throws_ok(
  $$insert into public.cohorts (
    id, organization_id, course_id, code, name, start_at, end_at
  ) values (
    '84000000-0000-0000-0000-000000000002',
    '81000000-0000-0000-0000-000000000001',
    '82000000-0000-0000-0000-000000000003',
    'COHORT-MISMATCH',
    'Mismatch Cohort',
    now() + interval '1 day',
    now() + interval '2 days'
  )$$,
  '23514',
  'Cohort and course must belong to the same organization',
  'legacy cohort insert rejects course belonging to another organization'
);

-- Test direct cohort_courses schedule check
select extensions.throws_ok(
  $$insert into public.cohort_courses (
    cohort_id, course_id, display_order, start_at, end_at
  ) values (
    '84000000-0000-0000-0000-000000000001',
    '82000000-0000-0000-0000-000000000001',
    1,
    now() + interval '5 days',
    now() + interval '4 days'
  )$$,
  '23514',
  null,
  'cohort_courses rejects invalid schedule with end_at <= start_at'
);

-- Test direct cohort_courses cross-organization rejection
select extensions.throws_ok(
  $$insert into public.cohort_courses (
    cohort_id, course_id, display_order
  ) values (
    '84000000-0000-0000-0000-000000000001',
    '82000000-0000-0000-0000-000000000003',
    1
  )$$,
  '23514',
  'Cohort and course must belong to the same organization',
  'direct cohort_courses insert rejects course belonging to another organization'
);

-- 3. Test one_active_cohort_per_learner constraint
insert into public.cohort_members (cohort_id, user_id, member_role, membership_status)
values ('84000000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000002', 'learner', 'active');

insert into public.cohorts (
  id, organization_id, course_id, code, name, start_at, end_at
) values (
  '84000000-0000-0000-0000-000000000003',
  '81000000-0000-0000-0000-000000000001',
  '82000000-0000-0000-0000-000000000001',
  'COHORT-BETA',
  'Cohort Beta',
  now() + interval '10 days',
  now() + interval '11 days'
);

select extensions.throws_ok(
  $$insert into public.cohort_members (cohort_id, user_id, member_role, membership_status)
    values ('84000000-0000-0000-0000-000000000003', '83000000-0000-0000-0000-000000000002', 'learner', 'active')$$,
  '23505',
  null,
  'one_active_cohort_per_learner is preserved and rejects second active learner membership'
);

-- 4. Test cohort_learner_roster Invariants
-- Valid insert
insert into public.cohort_learner_roster (
  id, organization_id, cohort_id, email, roster_status
) values (
  '85000000-0000-0000-0000-000000000001',
  '81000000-0000-0000-0000-000000000001',
  '84000000-0000-0000-0000-000000000001',
  'newlearner@test.local',
  'staged'
);

select extensions.ok(
  exists (select 1 from public.cohort_learner_roster where id = '85000000-0000-0000-0000-000000000001'),
  'valid cohort_learner_roster row inserted successfully'
);

-- Rejection of unnormalized email
select extensions.throws_ok(
  $$insert into public.cohort_learner_roster (
    organization_id, cohort_id, email
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '84000000-0000-0000-0000-000000000001',
    'Upper@test.local'
  )$$,
  '23514',
  null,
  'cohort_learner_roster rejects uppercase/untrimmed email'
);

-- Rejection of organization mismatch between roster and cohort
select extensions.throws_ok(
  $$insert into public.cohort_learner_roster (
    organization_id, cohort_id, email
  ) values (
    '81000000-0000-0000-0000-000000000002',
    '84000000-0000-0000-0000-000000000001',
    'valid2@test.local'
  )$$,
  'P0001',
  'Roster organization_id must match cohort organization_id',
  'cohort_learner_roster rejects organization_id differing from cohort organization'
);

-- Rejection of user_id from different organization
select extensions.throws_ok(
  $$insert into public.cohort_learner_roster (
    organization_id, cohort_id, email, user_id
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '84000000-0000-0000-0000-000000000001',
    'otherorg@test.local',
    '83000000-0000-0000-0000-000000000004'
  )$$,
  'P0001',
  'Linked profile organization must match roster organization',
  'cohort_learner_roster rejects user_id from another organization'
);

-- Duplicate (cohort_id, email) rejected
select extensions.throws_ok(
  $$insert into public.cohort_learner_roster (
    organization_id, cohort_id, email
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '84000000-0000-0000-0000-000000000001',
    'newlearner@test.local'
  )$$,
  '23505',
  null,
  'cohort_learner_roster rejects duplicate email in the same cohort'
);

-- 5. Test staff_access_entries Invariants
-- Valid insert
insert into public.staff_access_entries (
  id, organization_id, email, intended_role, status
) values (
  '86000000-0000-0000-0000-000000000001',
  '81000000-0000-0000-0000-000000000001',
  'instructor_candidate@test.local',
  'instructor',
  'staged'
);

select extensions.ok(
  exists (select 1 from public.staff_access_entries where id = '86000000-0000-0000-0000-000000000001'),
  'valid staff_access_entries row inserted successfully'
);

-- Duplicate (organization_id, email, intended_role) rejected
select extensions.throws_ok(
  $$insert into public.staff_access_entries (
    organization_id, email, intended_role
  ) values (
    '81000000-0000-0000-0000-000000000001',
    'instructor_candidate@test.local',
    'instructor'
  )$$,
  '23505',
  null,
  'staff_access_entries rejects duplicate (organization_id, email, intended_role)'
);

-- Rejection of invalid intended_role
select extensions.throws_ok(
  $$insert into public.staff_access_entries (
    organization_id, email, intended_role
  ) values (
    '81000000-0000-0000-0000-000000000001',
    'learner_bad@test.local',
    'learner'
  )$$,
  '23514',
  null,
  'staff_access_entries rejects intended_role = learner'
);

-- Rejection of linked user from another organization
select extensions.throws_ok(
  $$insert into public.staff_access_entries (
    organization_id, email, intended_role, user_id
  ) values (
    '81000000-0000-0000-0000-000000000001',
    'staff_other_org@test.local',
    'admin',
    '83000000-0000-0000-0000-000000000004'
  )$$,
  'P0001',
  'Linked profile organization must match staff access organization',
  'staff_access_entries rejects user_id from another organization'
);

-- 6. Test access_invitations Invariants
-- Valid prepared invitation for learner
insert into public.access_invitations (
  id, organization_id, cohort_roster_entry_id, invitation_type, email, intended_role, status
) values (
  '87000000-0000-0000-0000-000000000001',
  '81000000-0000-0000-0000-000000000001',
  '85000000-0000-0000-0000-000000000001',
  'new_learner_cohort',
  'newlearner@test.local',
  'learner',
  'prepared'
);

select extensions.ok(
  exists (select 1 from public.access_invitations where id = '87000000-0000-0000-0000-000000000001'),
  'valid prepared learner access_invitations row inserted successfully'
);

-- Target exclusivity: both targets populated rejected
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, staff_access_entry_id, invitation_type, email, intended_role
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000001',
    '86000000-0000-0000-0000-000000000001',
    'new_learner_cohort',
    'newlearner@test.local',
    'learner'
  )$$,
  '23514',
  null,
  'access_invitations rejects rows with both roster and staff targets'
);

-- Target exclusivity: neither target populated rejected
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, invitation_type, email, intended_role
  ) values (
    '81000000-0000-0000-0000-000000000001',
    'new_learner_cohort',
    'newlearner@test.local',
    'learner'
  )$$,
  'P0001',
  'Invitation must target either cohort_roster_entry_id or staff_access_entry_id',
  'access_invitations rejects rows with neither roster nor staff targets'
);

-- Learner invitation with non-learner intended_role rejected
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000001',
    'new_learner_cohort',
    'newlearner@test.local',
    'instructor'
  )$$,
  'P0001',
  'Learner roster invitation must have intended_role = learner',
  'access_invitations rejects learner target with non-learner role'
);

-- Learner invitation with incompatible invitation_type rejected
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000001',
    'staff_bootstrap',
    'newlearner@test.local',
    'learner'
  )$$,
  'P0001',
  'Learner roster invitation must have invitation_type new_learner_cohort or existing_learner_cohort',
  'access_invitations rejects learner target with staff_bootstrap invitation_type'
);

-- Staff invitation with incompatible intended_role rejected
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, staff_access_entry_id, invitation_type, email, intended_role
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '86000000-0000-0000-0000-000000000001',
    'staff_bootstrap',
    'instructor_candidate@test.local',
    'admin'
  )$$,
  'P0001',
  null,
  'access_invitations rejects staff target with mismatched intended_role'
);

-- Invitation email mismatch with target email rejected
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000001',
    'new_learner_cohort',
    'mismatch_email@test.local',
    'learner'
  )$$,
  'P0001',
  'Invitation email does not match roster target email',
  'access_invitations rejects email mismatch with target'
);

-- Status = 'sent' requires token_hash, sent_at, and expires_at > sent_at
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role, status
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000001',
    'new_learner_cohort',
    'newlearner@test.local',
    'learner',
    'sent'
  )$$,
  '23514',
  null,
  'access_invitations rejects status = sent without token_hash and timestamps'
);

-- Active attempt uniqueness: cannot create second prepared/sent attempt for same target
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role, status
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000001',
    'new_learner_cohort',
    'newlearner@test.local',
    'learner',
    'prepared'
  )$$,
  '23505',
  null,
  'access_invitations rejects second active (prepared/sent) attempt for same target'
);

-- Superseding an invitation allows new attempt
update public.access_invitations
set status = 'superseded'
where id = '87000000-0000-0000-0000-000000000001';

insert into public.access_invitations (
  id, organization_id, cohort_roster_entry_id, invitation_type, email, intended_role,
  status, token_hash, sent_at, expires_at, supersedes_invitation_id
) values (
  '87000000-0000-0000-0000-000000000002',
  '81000000-0000-0000-0000-000000000001',
  '85000000-0000-0000-0000-000000000001',
  'new_learner_cohort',
  'newlearner@test.local',
  'learner',
  'sent',
  'hash_abc123_456',
  now(),
  now() + interval '7 days',
  '87000000-0000-0000-0000-000000000001'
);

select extensions.ok(
  exists (select 1 from public.access_invitations where id = '87000000-0000-0000-0000-000000000002'),
  'superseded attempt allows fresh sent invitation attempt with 7-day validity'
);

-- 7. Test private.learner_identities
-- Valid MyKad
insert into private.learner_identities (user_id, id_type, id_number)
values ('83000000-0000-0000-0000-000000000002', 'mykad', '900101015555');

select extensions.ok(
  exists (select 1 from private.learner_identities where user_id = '83000000-0000-0000-0000-000000000002'),
  'canonical 12-digit MyKad identity inserted successfully'
);

-- Invalid MyKad (letters / wrong length) rejected
select extensions.throws_ok(
  $$insert into private.learner_identities (user_id, id_type, id_number)
    values ('83000000-0000-0000-0000-000000000003', 'mykad', '90010101555') $$,
  '23514',
  null,
  'private.learner_identities rejects non-12-digit MyKad'
);

-- Duplicate identity rejected
select extensions.throws_ok(
  $$insert into private.learner_identities (user_id, id_type, id_number)
    values ('83000000-0000-0000-0000-000000000003', 'mykad', '900101015555')$$,
  '23505',
  null,
  'private.learner_identities rejects duplicate (id_type, id_number)'
);

-- Valid Passport
insert into private.learner_identities (user_id, id_type, id_number)
values ('83000000-0000-0000-0000-000000000003', 'passport', 'A12345678');

select extensions.ok(
  exists (select 1 from private.learner_identities where user_id = '83000000-0000-0000-0000-000000000003'),
  'valid uppercase passport identity inserted successfully'
);

-- 8. Test RLS and Permissions (Fail-closed & Private Isolation)
-- Verify anon cannot select from new tables
set local role anon;

select extensions.throws_ok(
  $$select * from private.learner_identities$$,
  '42501',
  null,
  'anon role denied access to private.learner_identities'
);

select extensions.is_empty(
  $$select * from public.cohort_courses$$,
  'anon receives 0 rows from cohort_courses (RLS fail-closed)'
);

select extensions.is_empty(
  $$select * from public.cohort_learner_roster$$,
  'anon receives 0 rows from cohort_learner_roster (RLS fail-closed)'
);

select extensions.is_empty(
  $$select * from public.staff_access_entries$$,
  'anon receives 0 rows from staff_access_entries (RLS fail-closed)'
);

select extensions.is_empty(
  $$select * from public.access_invitations$$,
  'anon receives 0 rows from access_invitations (RLS fail-closed)'
);

-- Verify authenticated cannot select from private.learner_identities
set local role authenticated;

select extensions.throws_ok(
  $$select * from private.learner_identities$$,
  '42501',
  null,
  'authenticated role denied access to private.learner_identities'
);

select extensions.is_empty(
  $$select * from public.cohort_courses$$,
  'authenticated receives 0 rows from cohort_courses (RLS fail-closed)'
);

select extensions.is_empty(
  $$select * from public.cohort_learner_roster$$,
  'authenticated receives 0 rows from cohort_learner_roster (RLS fail-closed)'
);

select extensions.is_empty(
  $$select * from public.staff_access_entries$$,
  'authenticated receives 0 rows from staff_access_entries (RLS fail-closed)'
);

select extensions.is_empty(
  $$select * from public.access_invitations$$,
  'authenticated receives 0 rows from access_invitations (RLS fail-closed)'
);

-- 9. Test Legacy Confirmation Trigger Invariance (Safeguard A)
-- Prove that confirming an invited user still transitions to 'active' (NOT 'pending_registration')
set local role postgres;

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('83000000-0000-0000-0000-000000000099', 'invited_legacy@test.local', null, '{"full_name":"Legacy User"}');

update public.profiles
set organization_id = '81000000-0000-0000-0000-000000000001', account_status = 'pending_verification'
where id = '83000000-0000-0000-0000-000000000099';

select extensions.is(
  (select account_status from public.profiles where id = '83000000-0000-0000-0000-000000000099'),
  'pending_verification'::public.account_status,
  'unconfirmed user profile starts at pending_verification'
);

-- Simulate email confirmation by updating email_confirmed_at on auth.users
update auth.users
set email_confirmed_at = now()
where id = '83000000-0000-0000-0000-000000000099';

select extensions.is(
  (select account_status from public.profiles where id = '83000000-0000-0000-0000-000000000099'),
  'active'::public.account_status,
  'existing confirmation trigger transitions pending_verification to active (NOT pending_registration)'
);

select * from extensions.finish();
rollback;
