insert into public.organizations (id, name, slug, active)
values (
  '10000000-0000-0000-0000-000000000001',
  'BLS Learning Demonstration Organisation',
  'bls-learning-demo',
  true
)
on conflict (id) do nothing;

insert into public.courses (
  id, organization_id, slug, title, description, status
)
values (
  '12000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'adult-bls',
  'Adult Basic Life Support',
  'Fictional course record for authenticated development testing.',
  'published'
)
on conflict (organization_id, slug) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status;

insert into public.cohorts (
  id,
  organization_id,
  course_id,
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
  demo_course.id,
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
join public.courses demo_course
  on demo_course.organization_id = '10000000-0000-0000-0000-000000000001'
  and demo_course.slug = 'adult-bls'
where admin_user.email = 'admin@bls.local'
on conflict (id) do update set
  course_id = excluded.course_id,
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

insert into public.bls_topics (
  id, organization_id, slug, name, description, display_order
)
values
  ('15000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'initial-assessment', 'Initial assessment', 'Safety, responsiveness and activation.', 10),
  ('15000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'high-quality-cpr', 'High-quality CPR', 'Compression and ventilation fundamentals.', 20),
  ('15000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'aed', 'AED use', 'Safe and effective automated defibrillation.', 30),
  ('15000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'team-dynamics', 'Team dynamics', 'Roles, communication and coordinated response.', 40),
  ('15000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'choking', 'Choking', 'Recognition and first response to airway obstruction.', 50),
  ('15000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'recovery-position', 'Recovery position', 'Safe positioning and reassessment.', 60)
on conflict (organization_id, slug) do update set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  active = true;

insert into public.teaching_stages (
  id, organization_id, slug, name, description, display_order
)
values
  ('16000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'prepare', 'Prepare', 'Before the physical course begins.', 10),
  ('16000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'demonstrate', 'Demonstrate', 'Instructor-led demonstration support.', 20),
  ('16000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'practice', 'Practice', 'Hands-on skills practice support.', 30),
  ('16000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'reinforce', 'Reinforce', 'Post-course reference and reinforcement.', 40)
on conflict (organization_id, slug) do update set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  active = true;

insert into public.course_entitlements (
  id, organization_id, user_id, course_id, cohort_id, access_type,
  starts_at, expires_at, status, granted_by
)
select
  entitlement.id,
  '10000000-0000-0000-0000-000000000001',
  target_user.id,
  demo_course.id,
  '11000000-0000-0000-0000-000000000001',
  'fixed_window',
  '2026-08-01 00:00:00+00',
  '2027-08-31 23:59:59+00',
  'active',
  admin_user.id
from (
  values
    ('17000000-0000-0000-0000-000000000001'::uuid, 'learner@bls.local'),
    ('17000000-0000-0000-0000-000000000002'::uuid, 'instructor@bls.local')
) as entitlement(id, email)
join auth.users target_user on target_user.email = entitlement.email
join auth.users admin_user on admin_user.email = 'admin@bls.local'
join public.courses demo_course
  on demo_course.organization_id = '10000000-0000-0000-0000-000000000001'
  and demo_course.slug = 'adult-bls'
on conflict (id) do update set
  course_id = excluded.course_id,
  cohort_id = excluded.cohort_id,
  starts_at = excluded.starts_at,
  expires_at = excluded.expires_at,
  status = 'active',
  revoked_by = null,
  revoked_at = null,
  revocation_reason = null;

insert into public.resources (
  id, organization_id, course_id, slug, title, resource_type, status,
  estimated_minutes, featured, created_by, updated_by
)
select
  source.id, '10000000-0000-0000-0000-000000000001', demo_course.id,
  source.slug, source.title, source.resource_type, 'draft', source.minutes,
  source.featured, admin_user.id, admin_user.id
from (
  values
    ('13000000-0000-0000-0000-000000000001'::uuid, 'chain-of-survival', 'Chain of survival', 'guide'::public.resource_type, 4, true),
    ('13000000-0000-0000-0000-000000000002'::uuid, 'scene-safety-check', 'Scene safety check', 'checklist'::public.resource_type, 2, true),
    ('13000000-0000-0000-0000-000000000003'::uuid, 'adult-bls-algorithm', 'Adult BLS algorithm', 'pdf'::public.resource_type, 5, true),
    ('13000000-0000-0000-0000-000000000004'::uuid, 'compression-technique', 'Compression technique', 'youtube_video'::public.resource_type, 6, true),
    ('13000000-0000-0000-0000-000000000005'::uuid, 'aed-quick-guide', 'AED quick guide', 'guide'::public.resource_type, 5, false),
    ('13000000-0000-0000-0000-000000000006'::uuid, 'team-roles-checklist', 'Team roles checklist', 'checklist'::public.resource_type, 3, false),
    ('13000000-0000-0000-0000-000000000007'::uuid, 'adult-choking-reference', 'Adult choking reference', 'pdf'::public.resource_type, 4, false),
    ('13000000-0000-0000-0000-000000000008'::uuid, 'recovery-position-demo', 'Recovery position demonstration', 'youtube_video'::public.resource_type, 5, false)
) as source(id, slug, title, resource_type, minutes, featured)
join auth.users admin_user on admin_user.email = 'admin@bls.local'
join public.courses demo_course
  on demo_course.organization_id = '10000000-0000-0000-0000-000000000001'
  and demo_course.slug = 'adult-bls'
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  estimated_minutes = excluded.estimated_minutes,
  featured = excluded.featured,
  updated_by = excluded.updated_by;

insert into public.resource_versions (
  id, resource_id, version_number, resource_type, title, summary, content,
  youtube_video_id, storage_path, guideline_source, guideline_year,
  reviewed_by, reviewed_at, next_review_at, approved_by, approved_at,
  status, created_by
)
select
  source.id, source.resource_id, 1, source.resource_type, source.title,
  source.summary, source.content, source.youtube_video_id, source.storage_path,
  'Demonstration content — not clinical guidance', 2026,
  admin_user.id, '2026-08-01 00:00:00+00', '2027-08-01 00:00:00+00',
  admin_user.id, '2026-08-01 00:30:00+00', 'approved', admin_user.id
from (
  values
    ('14000000-0000-0000-0000-000000000001'::uuid, '13000000-0000-0000-0000-000000000001'::uuid, 'guide'::public.resource_type, 'Chain of survival', 'A concise fictional overview for interface testing.', '{"sections":[{"heading":"Recognise","body":"Check responsiveness and call for help."}]}'::jsonb, null::text, null::text),
    ('14000000-0000-0000-0000-000000000002'::uuid, '13000000-0000-0000-0000-000000000002'::uuid, 'checklist'::public.resource_type, 'Scene safety check', 'A fictional checklist for interface testing.', '{"items":["Check for hazards","Use appropriate protection","Confirm the area is safe"]}'::jsonb, null::text, null::text),
    ('14000000-0000-0000-0000-000000000003'::uuid, '13000000-0000-0000-0000-000000000003'::uuid, 'pdf'::public.resource_type, 'Adult BLS algorithm', 'A fictional protected PDF record for interface testing.', null::jsonb, null::text, '10000000-0000-0000-0000-000000000001/13000000-0000-0000-0000-000000000003/14000000-0000-0000-0000-000000000003/adult-bls-algorithm.pdf'),
    ('14000000-0000-0000-0000-000000000004'::uuid, '13000000-0000-0000-0000-000000000004'::uuid, 'youtube_video'::public.resource_type, 'Compression technique', 'A fictional video record for interface testing.', null::jsonb, 'demoCPR001', null::text),
    ('14000000-0000-0000-0000-000000000005'::uuid, '13000000-0000-0000-0000-000000000005'::uuid, 'guide'::public.resource_type, 'AED quick guide', 'A fictional AED guide for interface testing.', '{"sections":[{"heading":"Prepare","body":"Switch on the trainer and follow prompts."}]}'::jsonb, null::text, null::text),
    ('14000000-0000-0000-0000-000000000006'::uuid, '13000000-0000-0000-0000-000000000006'::uuid, 'checklist'::public.resource_type, 'Team roles checklist', 'A fictional team checklist for interface testing.', '{"items":["Identify a leader","Assign compressors","Confirm closed-loop communication"]}'::jsonb, null::text, null::text),
    ('14000000-0000-0000-0000-000000000007'::uuid, '13000000-0000-0000-0000-000000000007'::uuid, 'pdf'::public.resource_type, 'Adult choking reference', 'A fictional protected PDF record for interface testing.', null::jsonb, null::text, '10000000-0000-0000-0000-000000000001/13000000-0000-0000-0000-000000000007/14000000-0000-0000-0000-000000000007/adult-choking-reference.pdf'),
    ('14000000-0000-0000-0000-000000000008'::uuid, '13000000-0000-0000-0000-000000000008'::uuid, 'youtube_video'::public.resource_type, 'Recovery position demonstration', 'A fictional video record for interface testing.', null::jsonb, 'demoREC001', null::text)
) as source(id, resource_id, resource_type, title, summary, content, youtube_video_id, storage_path)
join auth.users admin_user on admin_user.email = 'admin@bls.local'
where not exists (
  select 1 from public.resource_versions existing where existing.id = source.id
);

insert into public.resource_audiences (resource_id, audience, created_by)
select resource.id, audience.kind, admin_user.id
from public.resources resource
cross join (
  values ('learner'::public.resource_audience), ('instructor'::public.resource_audience)
) as audience(kind)
join auth.users admin_user on admin_user.email = 'admin@bls.local'
where resource.id::text like '13000000-0000-0000-0000-00000000000%'
on conflict (resource_id, audience) do nothing;

insert into public.resource_topics (resource_id, topic_id, display_order, created_by)
select mapping.resource_id, mapping.topic_id, 10, admin_user.id
from (
  values
    ('13000000-0000-0000-0000-000000000001'::uuid, '15000000-0000-0000-0000-000000000001'::uuid),
    ('13000000-0000-0000-0000-000000000002'::uuid, '15000000-0000-0000-0000-000000000001'::uuid),
    ('13000000-0000-0000-0000-000000000003'::uuid, '15000000-0000-0000-0000-000000000002'::uuid),
    ('13000000-0000-0000-0000-000000000004'::uuid, '15000000-0000-0000-0000-000000000002'::uuid),
    ('13000000-0000-0000-0000-000000000005'::uuid, '15000000-0000-0000-0000-000000000003'::uuid),
    ('13000000-0000-0000-0000-000000000006'::uuid, '15000000-0000-0000-0000-000000000004'::uuid),
    ('13000000-0000-0000-0000-000000000007'::uuid, '15000000-0000-0000-0000-000000000005'::uuid),
    ('13000000-0000-0000-0000-000000000008'::uuid, '15000000-0000-0000-0000-000000000006'::uuid)
) as mapping(resource_id, topic_id)
join auth.users admin_user on admin_user.email = 'admin@bls.local'
on conflict (resource_id, topic_id) do nothing;

insert into public.resource_teaching_stages (
  resource_id, teaching_stage_id, display_order, created_by
)
select resource.id, stage.id, 10, admin_user.id
from public.resources resource
join public.teaching_stages stage
  on stage.organization_id = resource.organization_id and stage.slug = 'reinforce'
join auth.users admin_user on admin_user.email = 'admin@bls.local'
where resource.id::text like '13000000-0000-0000-0000-00000000000%'
on conflict (resource_id, teaching_stage_id) do nothing;

update public.resources resource
set current_version_id = version.id,
    status = 'published',
    updated_by = admin_user.id
from public.resource_versions version, auth.users admin_user
where version.resource_id = resource.id
  and version.version_number = 1
  and admin_user.email = 'admin@bls.local'
  and resource.id::text like '13000000-0000-0000-0000-00000000000%';

insert into public.resource_relations (
  resource_id, related_resource_id, display_order, created_by
)
select
  '13000000-0000-0000-0000-000000000003',
  '13000000-0000-0000-0000-000000000004',
  10,
  admin_user.id
from auth.users admin_user
where admin_user.email = 'admin@bls.local'
on conflict (resource_id, related_resource_id) do nothing;
