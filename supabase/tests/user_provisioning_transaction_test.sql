begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select extensions.plan(30);

-- Schema and function existence checks
select extensions.has_function(
  'public',
  'provision_invited_user',
  ARRAY['uuid', 'uuid', 'public.app_role', 'text', 'uuid', 'text', 'timestamp with time zone', 'timestamp with time zone'],
  'public.provision_invited_user function exists'
);

select extensions.has_function(
  'private',
  'handle_auth_user_confirmed',
  'private.handle_auth_user_confirmed function exists'
);

-- Setup test fixtures
insert into public.organizations (id, name, slug)
values
  ('91000000-0000-0000-0000-000000000001', 'Test Org 1', 'test-org-1'),
  ('91000000-0000-0000-0000-000000000002', 'Test Org 2', 'test-org-2');

-- Actor admin in Org 1
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('92000000-0000-0000-0000-000000000001', 'admin1@example.test', now(), '{"full_name":"Admin One"}');

update public.profiles
set organization_id = '91000000-0000-0000-0000-000000000001', account_status = 'active', full_name = 'Admin One'
where id = '92000000-0000-0000-0000-000000000001';

insert into public.user_roles (user_id, role)
values ('92000000-0000-0000-0000-000000000001', 'admin');

-- Target invited user 1 (unconfirmed email, fresh unprovisioned)
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('93000000-0000-0000-0000-000000000001', 'invited-learner@example.test', null, '{"full_name":"New Learner"}');

-- 1. Verify execution is denied to anon
set local role anon;
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000001'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'learner'::public.app_role,
    'Invited Learner',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  '42501',
  null,
  'execution denied to anon'
);

-- 2. Verify execution is denied to authenticated users
set local role authenticated;
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000001'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'learner'::public.app_role,
    'Invited Learner',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  '42501',
  null,
  'execution denied to authenticated'
);

-- 3. Verify execution is permitted to service_role for fresh unprovisioned profile
set local role service_role;
select extensions.lives_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000001'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'learner'::public.app_role,
    'Provisioned Learner One',
    '92000000-0000-0000-0000-000000000001'::uuid,
    'limited',
    now(),
    now() + interval '30 days'
  )$$,
  'service_role execution permitted for fresh unprovisioned target'
);

-- 4. Verify target profile updated properly
select extensions.results_eq(
  $$select organization_id, full_name, account_status from public.profiles where id = '93000000-0000-0000-0000-000000000001'$$,
  $$values ('91000000-0000-0000-0000-000000000001'::uuid, 'Provisioned Learner One'::text, 'pending_verification'::public.account_status)$$,
  'valid profile provisioning maintains pending_verification for unconfirmed user'
);

-- 5. Verify permitted role assigned
select extensions.results_eq(
  $$select role from public.user_roles where user_id = '93000000-0000-0000-0000-000000000001'$$,
  $$values ('learner'::public.app_role)$$,
  'permitted learner role assigned'
);

-- 6. Verify audit event created with safe metadata
select extensions.results_eq(
  $$select action, entity_type, organization_id from public.audit_events where entity_id = '93000000-0000-0000-0000-000000000001'$$,
  $$values ('auth.user.invited'::text, 'profile'::text, '91000000-0000-0000-0000-000000000001'::uuid)$$,
  'audit row created with expected action and entity'
);

-- 7. Reject unsupported elevated role (admin)
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000001'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'admin'::public.app_role,
    'Admin Elevation Attempt',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  '22023',
  null,
  'unsupported elevated admin role rejected'
);

-- 8. Reject unsupported elevated role (super_admin)
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000001'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'super_admin'::public.app_role,
    'Super Admin Elevation Attempt',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  '22023',
  null,
  'unsupported elevated super_admin role rejected'
);

-- 9. Reject cross-organization admin assignment
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000001'::uuid,
    '91000000-0000-0000-0000-000000000002'::uuid,
    'learner'::public.app_role,
    'Cross Org Attempt',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  '42501',
  null,
  'cross-organization invitation rejected for org admin'
);

-- 10. Reject invalid access period (past expiry)
-- Fresh user fixture for access period test
set local role postgres;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('93000000-0000-0000-0000-000000000010', 'access-period@example.test', null, '{"full_name":"Access Test"}');

set local role service_role;
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000010'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'learner'::public.app_role,
    'Past Expiry Attempt',
    '92000000-0000-0000-0000-000000000001'::uuid,
    'limited',
    now() - interval '2 days',
    now() - interval '1 day'
  )$$,
  '22023',
  null,
  'past expiry date rejected'
);

-- 11. Takeover prevention: Established user with organization cannot be reprovisioned
-- Target 1 now belongs to Org 1
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000001'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'learner'::public.app_role,
    'Takeover Attempt Org Member',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  '42501',
  'Target user already belongs to an organization',
  'established user with organization cannot be reprovisioned'
);

-- 12. Takeover prevention: Target with existing learner role cannot be reprovisioned
set local role postgres;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('93000000-0000-0000-0000-000000000011', 'role-learner@example.test', null, '{"full_name":"Learner Role"}');
insert into public.user_roles (user_id, role) values ('93000000-0000-0000-0000-000000000011', 'learner');

set local role service_role;
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000011'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'learner'::public.app_role,
    'Learner Role Takeover',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  '42501',
  'Target user already has assigned roles',
  'profile with an existing learner role cannot be reprovisioned'
);

-- 13. Takeover prevention: Target with existing instructor role cannot be reprovisioned
set local role postgres;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('93000000-0000-0000-0000-000000000012', 'role-instructor@example.test', null, '{"full_name":"Instructor Role"}');
insert into public.user_roles (user_id, role) values ('93000000-0000-0000-0000-000000000012', 'instructor');

set local role service_role;
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000012'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'learner'::public.app_role,
    'Instructor Role Takeover',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  '42501',
  'Target user already has assigned roles',
  'profile with existing instructor role cannot be reprovisioned'
);

-- 14. Takeover prevention: Target with existing admin role cannot be reprovisioned
set local role postgres;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('93000000-0000-0000-0000-000000000013', 'role-admin@example.test', null, '{"full_name":"Admin Role"}');
insert into public.user_roles (user_id, role) values ('93000000-0000-0000-0000-000000000013', 'admin');

set local role service_role;
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000013'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'learner'::public.app_role,
    'Admin Role Takeover',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  '42501',
  'Target user already has assigned roles',
  'profile with existing admin role cannot be reprovisioned'
);

-- 15. Takeover prevention: Target with existing super_admin role cannot be reprovisioned
set local role postgres;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('93000000-0000-0000-0000-000000000014', 'role-super@example.test', null, '{"full_name":"Super Admin Role"}');
insert into public.user_roles (user_id, role) values ('93000000-0000-0000-0000-000000000014', 'super_admin');

set local role service_role;
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000014'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'learner'::public.app_role,
    'Super Admin Role Takeover',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  '42501',
  'Target user already has assigned roles',
  'profile with existing super_admin role cannot be reprovisioned'
);

-- 16. Takeover prevention: Active profile cannot be reprovisioned
set local role postgres;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('93000000-0000-0000-0000-000000000015', 'active-profile@example.test', null, '{"full_name":"Active User"}');
update public.profiles set account_status = 'active' where id = '93000000-0000-0000-0000-000000000015';

set local role service_role;
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000015'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'learner'::public.app_role,
    'Active Takeover',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  '42501',
  'Target user profile is not in pending_verification state',
  'active profile cannot be reprovisioned'
);

-- 17. Takeover prevention: Suspended profile cannot be reprovisioned
set local role postgres;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('93000000-0000-0000-0000-000000000016', 'suspended-profile@example.test', null, '{"full_name":"Suspended User"}');
update public.profiles set account_status = 'suspended' where id = '93000000-0000-0000-0000-000000000016';

set local role service_role;
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000016'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'learner'::public.app_role,
    'Suspended Takeover',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  '42501',
  'Target user profile is not in pending_verification state',
  'suspended profile cannot be reprovisioned'
);

-- 18. Takeover prevention: Expired profile cannot be reprovisioned
set local role postgres;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('93000000-0000-0000-0000-000000000017', 'expired-profile@example.test', null, '{"full_name":"Expired User"}');
update public.profiles set account_status = 'expired' where id = '93000000-0000-0000-0000-000000000017';

set local role service_role;
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000017'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'learner'::public.app_role,
    'Expired Takeover',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  '42501',
  'Target user profile is not in pending_verification state',
  'expired profile cannot be reprovisioned'
);

-- 19, 20, 21, 22: Integrity preservation: Failed takeover attempt preserves victim state completely
-- Setup established victim in Org 1 with instructor role
set local role postgres;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('93000000-0000-0000-0000-000000000020', 'victim@example.test', now(), '{"full_name":"Victim Instructor"}');

update public.profiles
set organization_id = '91000000-0000-0000-0000-000000000001',
    account_status = 'active',
    full_name = 'Victim Instructor'
where id = '93000000-0000-0000-0000-000000000020';

insert into public.user_roles (user_id, role)
values ('93000000-0000-0000-0000-000000000020', 'instructor');

-- Attempt takeover via service_role trying to reassign to Org 1 with learner role
set local role service_role;
do $$
begin
  perform public.provision_invited_user(
    '93000000-0000-0000-0000-000000000020'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'learner'::public.app_role,
    'Overwritten Name',
    '92000000-0000-0000-0000-000000000001'::uuid
  );
exception
  when others then
    null;
end;
$$;

-- 19. Failed takeover preserves organization
select extensions.results_eq(
  $$select organization_id from public.profiles where id = '93000000-0000-0000-0000-000000000020'$$,
  $$values ('91000000-0000-0000-0000-000000000001'::uuid)$$,
  'failed takeover attempt preserves organization'
);

-- 20. Failed takeover preserves all existing roles (no role wiped/replaced)
select extensions.results_eq(
  $$select role from public.user_roles where user_id = '93000000-0000-0000-0000-000000000020'$$,
  $$values ('instructor'::public.app_role)$$,
  'failed takeover attempt preserves all existing roles'
);

-- 21. Failed takeover preserves account status
select extensions.results_eq(
  $$select account_status from public.profiles where id = '93000000-0000-0000-0000-000000000020'$$,
  $$values ('active'::public.account_status)$$,
  'failed takeover attempt preserves account status'
);

-- 22. Failed takeover creates no invitation audit event
select extensions.is_empty(
  $$select 1 from public.audit_events where entity_id = '93000000-0000-0000-0000-000000000020' and action = 'auth.user.invited'$$,
  'failed takeover attempt creates no invitation audit event'
);

-- 23. Transaction rollback check on failure
-- Target user for transaction rollback test
set local role postgres;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('93000000-0000-0000-0000-000000000030', 'rollback-test@example.test', null, '{"full_name":"Original Name"}');

set local role service_role;
do $$
begin
  perform public.provision_invited_user(
    '93000000-0000-0000-0000-000000000030'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'super_admin'::public.app_role, -- will fail role check
    'Changed Name',
    '92000000-0000-0000-0000-000000000001'::uuid
  );
exception
  when others then
    null;
end;
$$;

select extensions.results_eq(
  $$select full_name, organization_id from public.profiles where id = '93000000-0000-0000-0000-000000000030'$$,
  $$values ('Original Name'::text, null::uuid)$$,
  'failed provisioning rolls back profile changes completely'
);

-- 24. Concurrency & fresh provisioning: Another fresh unprovisioned target provisions cleanly
set local role postgres;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('93000000-0000-0000-0000-000000000040', 'fresh-target@example.test', null, '{"full_name":"Fresh Target"}');

set local role service_role;
select extensions.lives_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000040'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'instructor'::public.app_role,
    'Fresh Instructor',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  'normal fresh pending_verification / org-null / zero-role target still provisions successfully'
);

-- 25. Verify email confirmation trigger transitions provisioned user to active
set local role postgres;
update auth.users
set email_confirmed_at = now()
where id = '93000000-0000-0000-0000-000000000001';

select extensions.results_eq(
  $$select account_status from public.profiles where id = '93000000-0000-0000-0000-000000000001'$$,
  $$values ('active'::public.account_status)$$,
  'email confirmation trigger transitions provisioned user to active'
);

-- 26. Verify email confirmation without organization transitions to pending_approval
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('93000000-0000-0000-0000-000000000050', 'self-signup@example.test', null, '{"full_name":"Self Signup"}');

update auth.users
set email_confirmed_at = now()
where id = '93000000-0000-0000-0000-000000000050';

select extensions.results_eq(
  $$select account_status from public.profiles where id = '93000000-0000-0000-0000-000000000050'$$,
  $$values ('pending_approval'::public.account_status)$$,
  'email confirmation without organization transitions to pending_approval'
);

-- 27 & 28: Concurrency safety: Prove that once target 40 has been provisioned, a concurrent attempt fails
select extensions.throws_ok(
  $$select public.provision_invited_user(
    '93000000-0000-0000-0000-000000000040'::uuid,
    '91000000-0000-0000-0000-000000000001'::uuid,
    'learner'::public.app_role,
    'Competing Attempt',
    '92000000-0000-0000-0000-000000000001'::uuid
  )$$,
  '42501',
  'Target user already belongs to an organization',
  'competing invocation cannot reprovision already provisioned profile'
);

select extensions.results_eq(
  $$select role from public.user_roles where user_id = '93000000-0000-0000-0000-000000000040'$$,
  $$values ('instructor'::public.app_role)$$,
  'competing invocation cannot alter existing role'
);

select extensions.finish();
rollback;
