begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select extensions.plan(21);

select extensions.has_trigger(
  'public', 'bls_topics', 'bls_topics_prevent_unsafe_deactivation',
  'BLS topics protect published resource discovery'
);
select extensions.has_trigger(
  'public', 'teaching_stages', 'teaching_stages_prevent_unsafe_deactivation',
  'teaching stages protect published instructor discovery'
);
select extensions.results_eq(
  $$select has_table_privilege('authenticated', 'public.bls_topics', 'DELETE')$$,
  array[false], 'authenticated users cannot delete BLS topics'
);
select extensions.results_eq(
  $$select has_table_privilege('authenticated', 'public.teaching_stages', 'DELETE')$$,
  array[false], 'authenticated users cannot delete teaching stages'
);
select extensions.results_eq(
  $$select has_column_privilege('authenticated', 'public.bls_topics', 'slug', 'UPDATE')$$,
  array[false], 'BLS topic slugs are immutable to browser roles'
);

insert into public.organizations (id, name, slug)
values
  ('25000000-0000-0000-0000-000000000001', 'Taxonomy Test One', 'taxonomy-test-one'),
  ('25000000-0000-0000-0000-000000000002', 'Taxonomy Test Two', 'taxonomy-test-two');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('35000000-0000-0000-0000-000000000001', 'taxonomy-learner@example.test', now(), '{"full_name":"Taxonomy Learner"}'),
  ('35000000-0000-0000-0000-000000000002', 'taxonomy-admin@example.test', now(), '{"full_name":"Taxonomy Admin"}'),
  ('35000000-0000-0000-0000-000000000003', 'taxonomy-other-admin@example.test', now(), '{"full_name":"Other Taxonomy Admin"}');

update public.profiles
set organization_id = '25000000-0000-0000-0000-000000000001',
    account_status = 'active'
where id in (
  '35000000-0000-0000-0000-000000000001',
  '35000000-0000-0000-0000-000000000002'
);
update public.profiles
set organization_id = '25000000-0000-0000-0000-000000000002',
    account_status = 'active'
where id = '35000000-0000-0000-0000-000000000003';

insert into public.user_roles (user_id, role)
values
  ('35000000-0000-0000-0000-000000000001', 'learner'),
  ('35000000-0000-0000-0000-000000000002', 'admin'),
  ('35000000-0000-0000-0000-000000000003', 'admin');

insert into public.courses (id, organization_id, slug, title, status)
values
  ('68000000-0000-0000-0000-000000000001', '25000000-0000-0000-0000-000000000001', 'taxonomy-course', 'Taxonomy Course', 'published'),
  ('68000000-0000-0000-0000-000000000002', '25000000-0000-0000-0000-000000000002', 'taxonomy-course', 'Other Taxonomy Course', 'published');

insert into public.bls_topics (
  id, organization_id, slug, name, display_order, active
)
values
  ('69000000-0000-0000-0000-000000000001', '25000000-0000-0000-0000-000000000001', 'primary-topic', 'Primary topic', 0, true),
  ('69000000-0000-0000-0000-000000000002', '25000000-0000-0000-0000-000000000001', 'alternative-topic', 'Alternative topic', 1, true),
  ('69000000-0000-0000-0000-000000000003', '25000000-0000-0000-0000-000000000001', 'inactive-topic', 'Inactive topic', 2, false);

insert into public.teaching_stages (
  id, organization_id, slug, name, display_order, active
)
values
  ('6a000000-0000-0000-0000-000000000001', '25000000-0000-0000-0000-000000000001', 'primary-stage', 'Primary stage', 0, true),
  ('6a000000-0000-0000-0000-000000000002', '25000000-0000-0000-0000-000000000001', 'alternative-stage', 'Alternative stage', 1, true);

insert into public.resources (
  id, organization_id, course_id, slug, title, resource_type, status
)
values
  ('6b000000-0000-0000-0000-000000000001', '25000000-0000-0000-0000-000000000001', '68000000-0000-0000-0000-000000000001', 'published-taxonomy-resource', 'Published taxonomy resource', 'guide', 'approved'),
  ('6b000000-0000-0000-0000-000000000002', '25000000-0000-0000-0000-000000000001', '68000000-0000-0000-0000-000000000001', 'historical-taxonomy-resource', 'Historical taxonomy resource', 'guide', 'draft'),
  ('6b000000-0000-0000-0000-000000000003', '25000000-0000-0000-0000-000000000001', '68000000-0000-0000-0000-000000000001', 'new-assignment-resource', 'New assignment resource', 'guide', 'draft'),
  ('6b000000-0000-0000-0000-000000000004', '25000000-0000-0000-0000-000000000001', '68000000-0000-0000-0000-000000000001', 'inactive-publication-resource', 'Inactive publication resource', 'guide', 'approved');

insert into public.resource_audiences (resource_id, audience)
values
  ('6b000000-0000-0000-0000-000000000001', 'instructor'),
  ('6b000000-0000-0000-0000-000000000004', 'learner');
insert into public.resource_topics (resource_id, topic_id)
values
  ('6b000000-0000-0000-0000-000000000001', '69000000-0000-0000-0000-000000000001'),
  ('6b000000-0000-0000-0000-000000000002', '69000000-0000-0000-0000-000000000003'),
  ('6b000000-0000-0000-0000-000000000004', '69000000-0000-0000-0000-000000000003');
insert into public.resource_teaching_stages (resource_id, teaching_stage_id)
values (
  '6b000000-0000-0000-0000-000000000001',
  '6a000000-0000-0000-0000-000000000001'
);
insert into public.resource_versions (
  id, resource_id, version_number, resource_type, title, summary, content,
  guideline_source, guideline_year, reviewed_by, reviewed_at, next_review_at,
  approved_by, approved_at, status
)
values
  (
    '6c000000-0000-0000-0000-000000000001',
    '6b000000-0000-0000-0000-000000000004', 1, 'guide',
    'Inactive taxonomy version', 'Approved version with inactive taxonomy',
    '{"sections":[{"heading":"Test","body":"Fictional test content"}]}'::jsonb,
    'Test guidelines', 2025,
    '35000000-0000-0000-0000-000000000002', now(),
    now() + interval '1 year',
    '35000000-0000-0000-0000-000000000002', now(), 'approved'
  ),
  (
    '6c000000-0000-0000-0000-000000000002',
    '6b000000-0000-0000-0000-000000000001', 1, 'guide',
    'Published taxonomy version', 'Published taxonomy fixture version',
    '{"sections":[{"heading":"Test","body":"Fictional test content"}]}'::jsonb,
    'Test guidelines', 2025,
    '35000000-0000-0000-0000-000000000002', now(),
    now() + interval '1 year',
    '35000000-0000-0000-0000-000000000002', now(), 'approved'
  );

update public.resources
set status = 'published',
    current_version_id = '6c000000-0000-0000-0000-000000000002'
where id = '6b000000-0000-0000-0000-000000000001';

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"35000000-0000-0000-0000-000000000001","role":"authenticated"}';
select extensions.throws_ok(
  $$insert into public.bls_topics (organization_id, slug, name)
    values ('25000000-0000-0000-0000-000000000001', 'learner-topic', 'Learner topic')$$,
  '42501', null, 'learner cannot create a BLS topic'
);

set local request.jwt.claims =
  '{"sub":"35000000-0000-0000-0000-000000000002","role":"authenticated"}';
select extensions.lives_ok(
  $$insert into public.bls_topics (
      id, organization_id, slug, name, description, display_order
    ) values (
      '69000000-0000-0000-0000-000000000004',
      '25000000-0000-0000-0000-000000000001',
      'administrator-topic', 'Administrator topic', 'Created through RLS', 4
    )$$,
  'administrator creates a BLS topic in their organization'
);
select extensions.results_eq(
  $$select count(*) from public.audit_events
    where entity_id = '69000000-0000-0000-0000-000000000004'
      and action = 'resource_taxonomy.topic_created'$$,
  array[1::bigint], 'topic creation is audited'
);
select extensions.lives_ok(
  $$update public.bls_topics
    set name = 'Renamed administrator topic', display_order = 5
    where id = '69000000-0000-0000-0000-000000000004'$$,
  'administrator edits topic presentation fields'
);
select extensions.results_eq(
  $$select count(*) from public.audit_events
    where entity_id = '69000000-0000-0000-0000-000000000004'
      and action = 'resource_taxonomy.topic_updated'$$,
  array[1::bigint], 'topic editing is audited'
);
select extensions.throws_ok(
  $$update public.bls_topics set slug = 'changed-topic'
    where id = '69000000-0000-0000-0000-000000000004'$$,
  '42501', null, 'administrator cannot change a stable topic slug'
);

set local request.jwt.claims =
  '{"sub":"35000000-0000-0000-0000-000000000003","role":"authenticated"}';
select extensions.results_eq(
  $$with changed as (
      update public.bls_topics set name = 'Cross organization change'
      where id = '69000000-0000-0000-0000-000000000004'
      returning 1
    ) select count(*) from changed$$,
  array[0::bigint], 'other-organization administrator cannot edit the topic'
);

set local request.jwt.claims =
  '{"sub":"35000000-0000-0000-0000-000000000002","role":"authenticated"}';
select extensions.throws_ok(
  $$update public.bls_topics set active = false
    where id = '69000000-0000-0000-0000-000000000001'$$,
  '23514', 'Reassign published resources before deactivating this BLS topic',
  'last active topic of a published resource cannot be deactivated'
);

set local role postgres;
insert into public.resource_topics (resource_id, topic_id, display_order)
values (
  '6b000000-0000-0000-0000-000000000001',
  '69000000-0000-0000-0000-000000000002', 1
);
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"35000000-0000-0000-0000-000000000002","role":"authenticated"}';
select extensions.lives_ok(
  $$update public.bls_topics set active = false
    where id = '69000000-0000-0000-0000-000000000001'$$,
  'a referenced topic can be deactivated after an active replacement exists'
);
select extensions.throws_ok(
  $$update public.teaching_stages set active = false
    where id = '6a000000-0000-0000-0000-000000000001'$$,
  '23514', 'Reassign published instructor resources before deactivating this teaching stage',
  'last active teaching stage of a published instructor resource cannot be deactivated'
);

set local role postgres;
insert into public.resource_teaching_stages (
  resource_id, teaching_stage_id, display_order
)
values (
  '6b000000-0000-0000-0000-000000000001',
  '6a000000-0000-0000-0000-000000000002', 1
);
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"35000000-0000-0000-0000-000000000002","role":"authenticated"}';
select extensions.lives_ok(
  $$update public.teaching_stages set active = false
    where id = '6a000000-0000-0000-0000-000000000001'$$,
  'a referenced stage can be deactivated after an active replacement exists'
);
select extensions.results_eq(
  $$select count(*) from public.audit_events
    where actor_user_id = '35000000-0000-0000-0000-000000000002'
      and action in (
        'resource_taxonomy.topic_deactivated',
        'resource_taxonomy.teaching_stage_deactivated'
      )$$,
  array[2::bigint], 'taxonomy deactivation is audit recorded'
);
select extensions.throws_ok(
  $$select public.replace_resource_classifications(
    '6b000000-0000-0000-0000-000000000003',
    array['learner']::public.resource_audience[],
    array['69000000-0000-0000-0000-000000000003']::uuid[],
    array[]::uuid[]
  )$$,
  '23514', 'Topics must be active in the resource organization or already assigned',
  'inactive topic cannot be newly assigned'
);
select extensions.lives_ok(
  $$select public.replace_resource_classifications(
    '6b000000-0000-0000-0000-000000000002',
    array['learner']::public.resource_audience[],
    array['69000000-0000-0000-0000-000000000003']::uuid[],
    array[]::uuid[]
  )$$,
  'existing inactive assignment can be preserved until deliberately removed'
);
select extensions.throws_ok(
  $$select public.replace_resource_classifications(
    '6b000000-0000-0000-0000-000000000001',
    array['instructor']::public.resource_audience[],
    array['69000000-0000-0000-0000-000000000001']::uuid[],
    array['6a000000-0000-0000-0000-000000000001']::uuid[]
  )$$,
  '23514', 'Published resources require an audience and active topic',
  'published resource classifications must retain an active topic'
);
select extensions.throws_ok(
  $$select public.publish_resource_version(
    '6b000000-0000-0000-0000-000000000004',
    '6c000000-0000-0000-0000-000000000001'
  )$$,
  '23514', 'Published resources require an audience and active topic',
  'inactive-only taxonomy cannot satisfy publication requirements'
);

select * from extensions.finish();
rollback;
