begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select extensions.plan(82);

-- ============================================================================
-- 1. Schema, Types, Columns, and Indexes Existence Checks
-- ============================================================================
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

-- Requirement 6: Generic metadata column must be removed from access_invitations
select extensions.hasnt_column(
  'public',
  'access_invitations',
  'metadata',
  'access_invitations does not contain generic metadata column'
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

-- ============================================================================
-- Setup Test Fixtures
-- ============================================================================
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

-- ============================================================================
-- 2. Cohort Courses Inheritance Semantics & Compatibility (Requirement 1)
-- ============================================================================
-- Verify backfilled seed cohorts have NULL overrides
select extensions.is(
  (
    select count(*)
    from public.cohort_courses
    where start_at is not null or end_at is not null or venue is not null
  ),
  0::bigint,
  'all backfilled cohort_courses relationships have NULL schedule/venue overrides'
);

-- Insert new legacy cohort with parent schedule and venue
insert into public.cohorts (
  id, organization_id, course_id, code, name, start_at, end_at, venue, status
) values (
  '84000000-0000-0000-0000-000000000001',
  '81000000-0000-0000-0000-000000000001',
  '82000000-0000-0000-0000-000000000001',
  'COHORT-ALPHA',
  'Cohort Alpha',
  now() + interval '1 day',
  now() + interval '2 days',
  'Main Hall A',
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

-- Newly created mirror row has NULL overrides
select extensions.is(
  (
    select count(*)
    from public.cohort_courses
    where cohort_id = '84000000-0000-0000-0000-000000000001'
      and (start_at is not null or end_at is not null or venue is not null)
  ),
  0::bigint,
  'newly created legacy cohort mirror row has NULL schedule/venue overrides'
);

-- Updating parent cohort start_at/end_at/venue does NOT populate or freeze overrides
update public.cohorts
set start_at = now() + interval '3 days',
    end_at = now() + interval '4 days',
    venue = 'Updated Hall B'
where id = '84000000-0000-0000-0000-000000000001';

select extensions.is(
  (
    select count(*)
    from public.cohort_courses
    where cohort_id = '84000000-0000-0000-0000-000000000001'
      and (start_at is not null or end_at is not null or venue is not null)
  ),
  0::bigint,
  'updating parent cohort schedule/venue preserves NULL overrides in cohort_courses'
);

-- Effective resolution via coalesce reflects parent cohort values
select extensions.is(
  (
    select coalesce(cc.venue, c.venue)
    from public.cohort_courses cc
    join public.cohorts c on c.id = cc.cohort_id
    where cc.cohort_id = '84000000-0000-0000-0000-000000000001'
  ),
  'Updated Hall B',
  'effective resolution via coalesce dynamically reflects updated parent cohort venue'
);

-- Updating legacy course_id safely updates mirror row without duplicate
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

-- Organization mismatch rejection on legacy cohort insert
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

-- Direct cohort_courses schedule check
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

-- Direct cohort_courses cross-organization rejection
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

-- ============================================================================
-- 3. One Active Cohort Per Learner Safeguard
-- ============================================================================
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

-- ============================================================================
-- 4. Cohort Learner Roster Invariants
-- ============================================================================
insert into public.cohort_learner_roster (
  id, organization_id, cohort_id, email, roster_status
) values (
  '85000000-0000-0000-0000-000000000001',
  '81000000-0000-0000-0000-000000000001',
  '84000000-0000-0000-0000-000000000001',
  'newlearner@test.local',
  'staged'
);

insert into public.cohort_learner_roster (
  id, organization_id, cohort_id, email, roster_status
) values (
  '85000000-0000-0000-0000-000000000002',
  '81000000-0000-0000-0000-000000000001',
  '84000000-0000-0000-0000-000000000001',
  'secondlearner@test.local',
  'staged'
);

select extensions.ok(
  exists (select 1 from public.cohort_learner_roster where id = '85000000-0000-0000-0000-000000000001'),
  'valid cohort_learner_roster row inserted successfully'
);

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

-- ============================================================================
-- 5. Staff Access Entries Invariants
-- ============================================================================
insert into public.staff_access_entries (
  id, organization_id, email, intended_role, status
) values (
  '86000000-0000-0000-0000-000000000001',
  '81000000-0000-0000-0000-000000000001',
  'instructor_candidate@test.local',
  'instructor',
  'staged'
);

insert into public.staff_access_entries (
  id, organization_id, email, intended_role, status
) values (
  '86000000-0000-0000-0000-000000000002',
  '81000000-0000-0000-0000-000000000001',
  'admin_candidate@test.local',
  'admin',
  'staged'
);

select extensions.ok(
  exists (select 1 from public.staff_access_entries where id = '86000000-0000-0000-0000-000000000001'),
  'valid staff_access_entries row inserted successfully'
);

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

-- ============================================================================
-- 6. Access Invitations Invariants & Target Exclusivity
-- ============================================================================
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

-- ============================================================================
-- 7. Token Hash Shape & Status Lifecycle Constraints (Requirements 3 & 5)
-- ============================================================================
-- Token hash shape: lowercase 64-char hex
-- Reject plaintext
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role,
    status, token_hash, sent_at, expires_at
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000002',
    'new_learner_cohort',
    'secondlearner@test.local',
    'learner',
    'sent',
    'plaintext_token_not_a_hash',
    now(),
    now() + interval '7 days'
  )$$,
  '23514',
  null,
  'token_hash rejects plaintext string'
);

-- Reject short hash
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role,
    status, token_hash, sent_at, expires_at
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000002',
    'new_learner_cohort',
    'secondlearner@test.local',
    'learner',
    'sent',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852',
    now(),
    now() + interval '7 days'
  )$$,
  '23514',
  null,
  'token_hash rejects short hex string (<64 characters)'
);

-- Reject uppercase hex
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role,
    status, token_hash, sent_at, expires_at
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000002',
    'new_learner_cohort',
    'secondlearner@test.local',
    'learner',
    'sent',
    'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
    now(),
    now() + interval '7 days'
  )$$,
  '23514',
  null,
  'token_hash rejects uppercase hex string'
);

-- Status lifecycle: prepared cannot have token_hash
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role,
    status, token_hash
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000002',
    'new_learner_cohort',
    'secondlearner@test.local',
    'learner',
    'prepared',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  )$$,
  '23514',
  null,
  'prepared status rejects populated token_hash'
);

-- Status lifecycle: sent requires token_hash, sent_at, expires_at
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role, status
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000002',
    'new_learner_cohort',
    'secondlearner@test.local',
    'learner',
    'sent'
  )$$,
  '23514',
  null,
  'sent status rejects missing token_hash and timestamps'
);

-- Status lifecycle: sent cannot have redeemed_at
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role,
    status, token_hash, sent_at, expires_at, redeemed_at
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000002',
    'new_learner_cohort',
    'secondlearner@test.local',
    'learner',
    'sent',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    now(),
    now() + interval '7 days',
    now()
  )$$,
  '23514',
  null,
  'sent status rejects populated redeemed_at'
);

-- Status lifecycle: redeemed requires redeemed_at and redeemed_by_user_id
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role,
    status, token_hash, sent_at, expires_at
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000002',
    'new_learner_cohort',
    'secondlearner@test.local',
    'learner',
    'redeemed',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    now(),
    now() + interval '7 days'
  )$$,
  '23514',
  null,
  'redeemed status rejects missing redeemed_at / redeemed_by_user_id'
);

-- ============================================================================
-- 8. Exact 7-Day Product Validity (Requirement 4)
-- ============================================================================
-- Reject +6 days
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role,
    status, token_hash, sent_at, expires_at
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000002',
    'new_learner_cohort',
    'secondlearner@test.local',
    'learner',
    'sent',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    now(),
    now() + interval '6 days'
  )$$,
  '23514',
  null,
  'access_invitations rejects +6 day expiry (must be exactly +7 days)'
);

-- Reject +8 days
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role,
    status, token_hash, sent_at, expires_at
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000002',
    'new_learner_cohort',
    'secondlearner@test.local',
    'learner',
    'sent',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    now(),
    now() + interval '8 days'
  )$$,
  '23514',
  null,
  'access_invitations rejects +8 day expiry (must be exactly +7 days)'
);

-- Accept exactly +7 days
insert into public.access_invitations (
  id, organization_id, cohort_roster_entry_id, invitation_type, email, intended_role,
  status, token_hash, sent_at, expires_at
) values (
  '87000000-0000-0000-0000-000000000002',
  '81000000-0000-0000-0000-000000000001',
  '85000000-0000-0000-0000-000000000002',
  'new_learner_cohort',
  'secondlearner@test.local',
  'learner',
  'sent',
  '1111111111111111111111111111111111111111111111111111111111111111',
  now(),
  now() + interval '7 days'
);

select extensions.ok(
  exists (select 1 from public.access_invitations where id = '87000000-0000-0000-0000-000000000002'),
  'access_invitations accepts exact +7 days expiry with valid 64-char hex hash'
);

-- Dynamic expiry resolution test
select extensions.is(
  (
    select count(*)
    from public.access_invitations
    where id = '87000000-0000-0000-0000-000000000002'
      and status = 'sent'
      and expires_at <= now()
  ),
  0::bigint,
  'fresh 7-day sent invitation is not expired at current time'
);

-- Historical field preservation: cannot null token_hash when marking expired
update public.access_invitations
set status = 'expired'
where id = '87000000-0000-0000-0000-000000000002';

select extensions.throws_ok(
  $$update public.access_invitations
    set token_hash = null
    where id = '87000000-0000-0000-0000-000000000002'$$,
  '23514',
  null,
  'historical fields (token_hash) cannot be nulled on expired attempt'
);

select extensions.throws_ok(
  $$update public.access_invitations
    set sent_at = null
    where id = '87000000-0000-0000-0000-000000000002'$$,
  '23514',
  null,
  'historical fields (sent_at) cannot be nulled on expired attempt'
);

-- ============================================================================
-- 9. Supersession Lineage Hardening (Requirement 2)
-- ============================================================================
-- Insert staff invitation in sent status
insert into public.access_invitations (
  id, organization_id, staff_access_entry_id, invitation_type, email, intended_role,
  status, token_hash, sent_at, expires_at
) values (
  '87000000-0000-0000-0000-000000000003',
  '81000000-0000-0000-0000-000000000001',
  '86000000-0000-0000-0000-000000000001',
  'staff_bootstrap',
  'instructor_candidate@test.local',
  'instructor',
  'sent',
  '2222222222222222222222222222222222222222222222222222222222222222',
  now(),
  now() + interval '7 days'
);

-- 1. Valid same-roster supersession
-- First transition prior attempt to superseded
update public.access_invitations
set status = 'superseded'
where id = '87000000-0000-0000-0000-000000000002';

insert into public.access_invitations (
  id, organization_id, cohort_roster_entry_id, invitation_type, email, intended_role,
  status, token_hash, sent_at, expires_at, supersedes_invitation_id
) values (
  '87000000-0000-0000-0000-000000000004',
  '81000000-0000-0000-0000-000000000001',
  '85000000-0000-0000-0000-000000000002',
  'new_learner_cohort',
  'secondlearner@test.local',
  'learner',
  'sent',
  '3333333333333333333333333333333333333333333333333333333333333333',
  now(),
  now() + interval '7 days',
  '87000000-0000-0000-0000-000000000002'
);

select extensions.ok(
  exists (select 1 from public.access_invitations where id = '87000000-0000-0000-0000-000000000004'),
  'valid same-roster supersession succeeds'
);

-- 2. Valid same-staff supersession
update public.access_invitations
set status = 'superseded'
where id = '87000000-0000-0000-0000-000000000003';

insert into public.access_invitations (
  id, organization_id, staff_access_entry_id, invitation_type, email, intended_role,
  status, token_hash, sent_at, expires_at, supersedes_invitation_id
) values (
  '87000000-0000-0000-0000-000000000005',
  '81000000-0000-0000-0000-000000000001',
  '86000000-0000-0000-0000-000000000001',
  'staff_bootstrap',
  'instructor_candidate@test.local',
  'instructor',
  'sent',
  '4444444444444444444444444444444444444444444444444444444444444444',
  now(),
  now() + interval '7 days',
  '87000000-0000-0000-0000-000000000003'
);

select extensions.ok(
  exists (select 1 from public.access_invitations where id = '87000000-0000-0000-0000-000000000005'),
  'valid same-staff supersession succeeds'
);

-- 3. Reject learner A superseding learner B
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role,
    status, supersedes_invitation_id
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000001',
    'new_learner_cohort',
    'newlearner@test.local',
    'learner',
    'prepared',
    '87000000-0000-0000-0000-000000000002'
  )$$,
  'P0001',
  'Superseded invitation must target the same cohort roster entry',
  'reject learner A superseding invitation for learner B'
);

-- 4. Reject learner invitation superseding staff invitation
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, cohort_roster_entry_id, invitation_type, email, intended_role,
    status, supersedes_invitation_id
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '85000000-0000-0000-0000-000000000001',
    'new_learner_cohort',
    'newlearner@test.local',
    'learner',
    'prepared',
    '87000000-0000-0000-0000-000000000003'
  )$$,
  'P0001',
  'Superseded invitation must target the same cohort roster entry',
  'reject learner invitation superseding staff invitation'
);

-- 5. Reject staff A superseding staff B
select extensions.throws_ok(
  $$insert into public.access_invitations (
    organization_id, staff_access_entry_id, invitation_type, email, intended_role,
    status, supersedes_invitation_id
  ) values (
    '81000000-0000-0000-0000-000000000001',
    '86000000-0000-0000-0000-000000000002',
    'staff_bootstrap',
    'admin_candidate@test.local',
    'admin',
    'prepared',
    '87000000-0000-0000-0000-000000000003'
  )$$,
  'P0001',
  'Superseded invitation must target the same staff access entry',
  'reject staff A superseding invitation for staff B'
);

-- 6. Reject self-supersession
select extensions.throws_ok(
  $$update public.access_invitations
    set supersedes_invitation_id = id
    where id = '87000000-0000-0000-0000-000000000004'$$,
  'P0001',
  'Invitation cannot supersede itself',
  'reject invitation superseding itself'
);

-- ============================================================================
-- 10. Foreign Key Deletion Restrictions (Requirement 7)
-- ============================================================================
-- Attempting to delete a roster entry with invitation attempts throws FK violation
select extensions.throws_ok(
  $$delete from public.cohort_learner_roster where id = '85000000-0000-0000-0000-000000000002'$$,
  '23503',
  null,
  'deleting cohort_learner_roster entry with invitation history is restricted'
);

-- Attempting to delete a staff entry with invitation attempts throws FK violation
select extensions.throws_ok(
  $$delete from public.staff_access_entries where id = '86000000-0000-0000-0000-000000000001'$$,
  '23503',
  null,
  'deleting staff_access_entry with invitation history is restricted'
);

-- Attempting to delete a superseded invitation referenced by a new attempt throws FK violation
select extensions.throws_ok(
  $$delete from public.access_invitations where id = '87000000-0000-0000-0000-000000000002'$$,
  '23503',
  null,
  'deleting superseded invitation referenced by active attempt is restricted'
);

-- ============================================================================
-- 11. Private Learner Identities Shape Validation (Requirement 8)
-- ============================================================================
-- Valid MyKad (12 digits)
insert into private.learner_identities (user_id, id_type, id_number)
values ('83000000-0000-0000-0000-000000000002', 'mykad', '900101015555');

select extensions.ok(
  exists (select 1 from private.learner_identities where user_id = '83000000-0000-0000-0000-000000000002'),
  'canonical 12-digit MyKad identity inserted successfully'
);

-- Invalid MyKad (11 digits) rejected
select extensions.throws_ok(
  $$insert into private.learner_identities (user_id, id_type, id_number)
    values ('83000000-0000-0000-0000-000000000003', 'mykad', '90010101555')$$,
  '23514',
  null,
  'private.learner_identities rejects non-12-digit MyKad (11 digits)'
);

-- Invalid MyKad (13 digits) rejected
select extensions.throws_ok(
  $$insert into private.learner_identities (user_id, id_type, id_number)
    values ('83000000-0000-0000-0000-000000000003', 'mykad', '9001010155555')$$,
  '23514',
  null,
  'private.learner_identities rejects non-12-digit MyKad (13 digits)'
);

-- Invalid MyKad (letters) rejected
select extensions.throws_ok(
  $$insert into private.learner_identities (user_id, id_type, id_number)
    values ('83000000-0000-0000-0000-000000000003', 'mykad', '90010101555A')$$,
  '23514',
  null,
  'private.learner_identities rejects MyKad containing letters'
);

-- Duplicate identity rejected
select extensions.throws_ok(
  $$insert into private.learner_identities (user_id, id_type, id_number)
    values ('83000000-0000-0000-0000-000000000003', 'mykad', '900101015555')$$,
  '23505',
  null,
  'private.learner_identities rejects duplicate (id_type, id_number)'
);

-- Valid Passport (uppercase alphanumeric, length 9)
insert into private.learner_identities (user_id, id_type, id_number)
values ('83000000-0000-0000-0000-000000000003', 'passport', 'A12345678');

select extensions.ok(
  exists (select 1 from private.learner_identities where user_id = '83000000-0000-0000-0000-000000000003'),
  'valid uppercase alphanumeric passport identity inserted successfully'
);

-- Invalid Passport: contains hyphens rejected
select extensions.throws_ok(
  $$insert into private.learner_identities (user_id, id_type, id_number)
    values ('83000000-0000-0000-0000-000000000004', 'passport', 'A123-4567')$$,
  '23514',
  null,
  'private.learner_identities rejects passport containing hyphens'
);

-- Invalid Passport: lowercase letters rejected
select extensions.throws_ok(
  $$insert into private.learner_identities (user_id, id_type, id_number)
    values ('83000000-0000-0000-0000-000000000004', 'passport', 'a12345678')$$,
  '23514',
  null,
  'private.learner_identities rejects lowercase passport'
);

-- Invalid Passport: length < 6 rejected
select extensions.throws_ok(
  $$insert into private.learner_identities (user_id, id_type, id_number)
    values ('83000000-0000-0000-0000-000000000004', 'passport', 'A1234')$$,
  '23514',
  null,
  'private.learner_identities rejects passport shorter than 6 characters'
);

-- Invalid Passport: length > 20 rejected
select extensions.throws_ok(
  $$insert into private.learner_identities (user_id, id_type, id_number)
    values ('83000000-0000-0000-0000-000000000004', 'passport', 'A123456789012345678901')$$,
  '23514',
  null,
  'private.learner_identities rejects passport longer than 20 characters'
);

-- ============================================================================
-- 12. RLS and Security (Fail-Closed & Private Isolation)
-- ============================================================================
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

-- ============================================================================
-- 13. Legacy Confirmation Trigger Invariance
-- ============================================================================
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
