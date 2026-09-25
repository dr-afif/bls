begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select extensions.plan(25);

-- ============================================================================
-- 1. Schema Existence & Structure Checks
-- ============================================================================

-- profiles.preferred_language
select extensions.has_column(
  'public',
  'profiles',
  'preferred_language',
  'profiles.preferred_language column exists'
);

select extensions.col_default_is(
  'public',
  'profiles',
  'preferred_language',
  'en',
  'profiles.preferred_language defaults to en'
);

-- courses bilingual columns
select extensions.has_column(
  'public',
  'courses',
  'title_ms',
  'courses.title_ms column exists'
);

select extensions.has_column(
  'public',
  'courses',
  'description_ms',
  'courses.description_ms column exists'
);

-- cohorts bilingual columns
select extensions.has_column(
  'public',
  'cohorts',
  'name_ms',
  'cohorts.name_ms column exists'
);

select extensions.has_column(
  'public',
  'cohorts',
  'description_ms',
  'cohorts.description_ms column exists'
);

-- resource_language enum and resources.content_language
select extensions.has_type(
  'public',
  'resource_language',
  'public.resource_language enum type exists'
);

select extensions.enum_has_labels(
  'public',
  'resource_language',
  array['en', 'ms', 'bilingual', 'language_independent'],
  'public.resource_language contains expected canonical values'
);

select extensions.has_column(
  'public',
  'resources',
  'content_language',
  'resources.content_language column exists'
);

select extensions.col_default_is(
  'public',
  'resources',
  'content_language',
  'en'::public.resource_language,
  'resources.content_language defaults to en'
);

-- ============================================================================
-- 2. Constraints Checks
-- ============================================================================

-- profiles.preferred_language constraint rejects invalid locale
insert into auth.users (id, email) values ('90000000-0000-0000-0000-000000000099', 'invalid-lang@example.test');

select extensions.results_eq(
  $$select preferred_language from public.profiles where id = '90000000-0000-0000-0000-000000000099'$$,
  array['en'],
  'new profile created via auth trigger automatically receives default en'
);

select extensions.throws_ok(
  $$update public.profiles set preferred_language = 'fr' where id = '90000000-0000-0000-0000-000000000099'$$,
  '23514',
  null,
  'profiles.preferred_language rejects invalid locale fr'
);

select extensions.throws_ok(
  $$update public.profiles set preferred_language = '' where id = '90000000-0000-0000-0000-000000000099'$$,
  '23514',
  null,
  'profiles.preferred_language rejects empty string'
);

-- ============================================================================
-- 3. Data Setup for RLS & Access Checks
-- ============================================================================

insert into public.organizations (id, name, slug)
values ('81000000-0000-0000-0000-000000000001', 'Bilingual Test Org', 'bilingual-test-org');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('82000000-0000-0000-0000-000000000001', 'active_learner@test.local', now(), '{"full_name":"Active Learner"}'),
  ('82000000-0000-0000-0000-000000000002', 'other_learner@test.local', now(), '{"full_name":"Other Learner"}'),
  ('82000000-0000-0000-0000-000000000003', 'suspended_learner@test.local', now(), '{"full_name":"Suspended Learner"}'),
  ('82000000-0000-0000-0000-000000000004', 'org_admin@test.local', now(), '{"full_name":"Org Admin"}');

update public.profiles
set organization_id = '81000000-0000-0000-0000-000000000001',
    account_status = 'active'
where id in (
  '82000000-0000-0000-0000-000000000001',
  '82000000-0000-0000-0000-000000000002',
  '82000000-0000-0000-0000-000000000004'
);

update public.profiles
set organization_id = '81000000-0000-0000-0000-000000000001',
    account_status = 'suspended'
where id = '82000000-0000-0000-0000-000000000003';

insert into public.user_roles (user_id, role)
values
  ('82000000-0000-0000-0000-000000000001', 'learner'),
  ('82000000-0000-0000-0000-000000000002', 'learner'),
  ('82000000-0000-0000-0000-000000000003', 'learner'),
  ('82000000-0000-0000-0000-000000000004', 'admin');

-- Existing profiles resolve 'en'
select extensions.results_eq(
  $$select preferred_language from public.profiles where id = '82000000-0000-0000-0000-000000000001'$$,
  array['en'],
  'existing profile preferred_language defaults to en'
);

-- ============================================================================
-- 4. Active User Self-Service & Protection Checks
-- ============================================================================

-- Active user updates own preferred_language to 'ms'
set local role authenticated;
set local request.jwt.claims = '{"sub":"82000000-0000-0000-0000-000000000001","role":"authenticated"}';

update public.profiles
set preferred_language = 'ms'
where id = '82000000-0000-0000-0000-000000000001';

select extensions.results_eq(
  $$select preferred_language from public.profiles where id = '82000000-0000-0000-0000-000000000001'$$,
  array['ms'],
  'active user can update own preferred_language to ms'
);

-- Active user cannot update another user's preferred_language
update public.profiles
set preferred_language = 'ms'
where id = '82000000-0000-0000-0000-000000000002';

set local role postgres;
select extensions.results_eq(
  $$select preferred_language from public.profiles where id = '82000000-0000-0000-0000-000000000002'$$,
  array['en'],
  'user cannot update another users preferred_language'
);

-- Inactive/suspended user cannot update own preferred_language
set local role authenticated;
set local request.jwt.claims = '{"sub":"82000000-0000-0000-0000-000000000003","role":"authenticated"}';

update public.profiles
set preferred_language = 'ms'
where id = '82000000-0000-0000-0000-000000000003';

set local role postgres;
select extensions.results_eq(
  $$select preferred_language from public.profiles where id = '82000000-0000-0000-0000-000000000003'$$,
  array['en'],
  'suspended user cannot update own preferred_language'
);

-- User cannot alter protected account_status alongside preferred_language
set local role authenticated;
set local request.jwt.claims = '{"sub":"82000000-0000-0000-0000-000000000001","role":"authenticated"}';

select extensions.throws_ok(
  $$update public.profiles set preferred_language = 'en', account_status = 'suspended' where id = '82000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'learner cannot change account_status even when updating preferred_language'
);

-- Same-organization admin CANNOT change another user's preferred_language
set local role authenticated;
set local request.jwt.claims = '{"sub":"82000000-0000-0000-0000-000000000004","role":"authenticated"}';

select extensions.throws_ok(
  $$update public.profiles set preferred_language = 'ms' where id = '82000000-0000-0000-0000-000000000002'$$,
  '42501',
  'Cannot update another user''s preferred language',
  'same-organization admin cannot change another users preferred_language'
);

-- Admin can still update another legitimate administrator-managed profile field
update public.profiles
set department = 'Emergency Medicine'
where id = '82000000-0000-0000-0000-000000000002';

set local role postgres;
select extensions.results_eq(
  $$select department from public.profiles where id = '82000000-0000-0000-0000-000000000002'$$,
  array['Emergency Medicine'],
  'admin can update another profile field (department) successfully'
);

-- Updating another profile without changing preferred_language is permitted
set local role authenticated;
set local request.jwt.claims = '{"sub":"82000000-0000-0000-0000-000000000004","role":"authenticated"}';

update public.profiles
set profession = 'Nurse',
    preferred_language = 'en'
where id = '82000000-0000-0000-0000-000000000002';

set local role postgres;
select extensions.results_eq(
  $$select profession from public.profiles where id = '82000000-0000-0000-0000-000000000002'$$,
  array['Nurse'],
  'admin can update another profile when preferred_language is unchanged'
);

-- Trusted postgres/service operation can change preferred_language where needed
set local role postgres;
set local request.jwt.claims = '';

update public.profiles
set preferred_language = 'ms'
where id = '82000000-0000-0000-0000-000000000002';

select extensions.results_eq(
  $$select preferred_language from public.profiles where id = '82000000-0000-0000-0000-000000000002'$$,
  array['ms'],
  'trusted postgres/service role can update preferred_language'
);

-- ============================================================================
-- 5. Course / Cohort / Resource Constraints
-- ============================================================================

set local role postgres;

select extensions.throws_ok(
  $$insert into public.courses (organization_id, slug, title, title_ms, status)
    values ('81000000-0000-0000-0000-000000000001', 'course-short-ms', 'Course Title', 'x', 'draft')$$,
  '23514',
  null,
  'courses.title_ms rejects string shorter than 2 chars'
);

select extensions.throws_ok(
  $$insert into public.cohorts (organization_id, course_id, code, name, name_ms, start_at, end_at, status)
    values ('81000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'C-SHORT', 'Cohort Name', 'x', now(), now() + interval '1 hour', 'active')$$,
  '23514',
  null,
  'cohorts.name_ms rejects string shorter than 2 chars'
);

select extensions.throws_ok(
  $$insert into public.resources (organization_id, slug, title, resource_type, content_language, status)
    values ('81000000-0000-0000-0000-000000000001', 'res-invalid-lang', 'Resource Title', 'guide', 'klingon'::public.resource_language, 'draft')$$,
  '22P02',
  null,
  'resources.content_language rejects invalid enum value'
);

select * from extensions.finish();
rollback;
