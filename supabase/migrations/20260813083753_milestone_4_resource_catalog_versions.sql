create type public.resource_type as enum (
  'guide', 'checklist', 'pdf', 'youtube_video'
);
create type public.resource_status as enum (
  'draft', 'under_review', 'approved', 'published', 'retired', 'archived'
);
create type public.resource_audience as enum ('learner', 'instructor');

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,
  slug text not null check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  title text not null check (char_length(trim(title)) between 2 and 180),
  resource_type public.resource_type not null,
  status public.resource_status not null default 'draft',
  estimated_minutes integer check (
    estimated_minutes is null or estimated_minutes between 1 and 600
  ),
  featured boolean not null default false,
  available_from timestamptz,
  available_until timestamptz,
  current_version_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resources_availability_window_valid check (
    available_until is null
    or available_from is null
    or available_until > available_from
  ),
  constraint resources_published_version_required check (
    status <> 'published' or current_version_id is not null
  )
);

create unique index resources_course_slug_unique
  on public.resources (course_id, slug);
create index resources_organization_status_idx
  on public.resources (organization_id, status);
create index resources_course_status_order_idx
  on public.resources (course_id, status, featured desc, title);
create index resources_created_by_idx on public.resources (created_by)
  where created_by is not null;
create index resources_updated_by_idx on public.resources (updated_by)
  where updated_by is not null;
create index resources_current_version_id_idx on public.resources (current_version_id)
  where current_version_id is not null;

create trigger resources_set_updated_at before update on public.resources
for each row execute function private.set_updated_at();

create table public.resource_versions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete restrict,
  version_number integer not null check (version_number > 0),
  resource_type public.resource_type not null,
  title text not null check (char_length(trim(title)) between 2 and 180),
  summary text not null check (char_length(trim(summary)) between 2 and 600),
  content jsonb,
  youtube_video_id text,
  storage_path text,
  content_hash text,
  guideline_source text,
  guideline_year integer check (
    guideline_year is null or guideline_year between 1950 and 2200
  ),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  next_review_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  status public.resource_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint resource_versions_resource_number_unique
    unique (resource_id, version_number),
  constraint resource_versions_locator_valid check (
    (
      resource_type in ('guide', 'checklist')
      and content is not null
      and jsonb_typeof(content) in ('object', 'array')
      and youtube_video_id is null
      and storage_path is null
    )
    or (
      resource_type = 'pdf'
      and content is null
      and youtube_video_id is null
      and storage_path is not null
      and storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/[^/]+[.]pdf$'
    )
    or (
      resource_type = 'youtube_video'
      and youtube_video_id is not null
      and char_length(trim(youtube_video_id)) between 6 and 32
      and storage_path is null
    )
  ),
  constraint resource_versions_review_valid check (
    (reviewed_at is null and reviewed_by is null)
    or (reviewed_at is not null and reviewed_by is not null)
  ),
  constraint resource_versions_approval_valid check (
    (
      status in ('approved', 'published', 'retired', 'archived')
      and approved_at is not null
      and approved_by is not null
      and reviewed_at is not null
      and reviewed_by is not null
    )
    or (
      status in ('draft', 'under_review')
      and approved_at is null
      and approved_by is null
    )
  ),
  constraint resource_versions_next_review_valid check (
    next_review_at is null
    or reviewed_at is null
    or next_review_at > reviewed_at
  )
);

alter table public.resources
  add constraint resources_current_version_id_fkey
    foreign key (current_version_id)
    references public.resource_versions (id)
    on delete restrict
    deferrable initially immediate;

create index resource_versions_resource_created_idx
  on public.resource_versions (resource_id, created_at desc);
create index resource_versions_reviewed_by_idx
  on public.resource_versions (reviewed_by)
  where reviewed_by is not null;
create index resource_versions_approved_by_idx
  on public.resource_versions (approved_by)
  where approved_by is not null;
create index resource_versions_created_by_idx
  on public.resource_versions (created_by)
  where created_by is not null;

create table public.resource_audiences (
  resource_id uuid not null references public.resources (id) on delete restrict,
  audience public.resource_audience not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  primary key (resource_id, audience)
);

create index resource_audiences_created_by_idx
  on public.resource_audiences (created_by)
  where created_by is not null;

create table public.resource_topics (
  resource_id uuid not null references public.resources (id) on delete restrict,
  topic_id uuid not null references public.bls_topics (id) on delete restrict,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  primary key (resource_id, topic_id)
);

create index resource_topics_topic_id_idx on public.resource_topics (topic_id);
create index resource_topics_created_by_idx
  on public.resource_topics (created_by)
  where created_by is not null;

create table public.resource_teaching_stages (
  resource_id uuid not null references public.resources (id) on delete restrict,
  teaching_stage_id uuid not null
    references public.teaching_stages (id) on delete restrict,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  primary key (resource_id, teaching_stage_id)
);

create index resource_teaching_stages_stage_id_idx
  on public.resource_teaching_stages (teaching_stage_id);
create index resource_teaching_stages_created_by_idx
  on public.resource_teaching_stages (created_by)
  where created_by is not null;

create table public.resource_relations (
  resource_id uuid not null references public.resources (id) on delete restrict,
  related_resource_id uuid not null
    references public.resources (id) on delete restrict,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  primary key (resource_id, related_resource_id),
  constraint resource_relations_not_self check (resource_id <> related_resource_id)
);

create index resource_relations_related_resource_id_idx
  on public.resource_relations (related_resource_id);
create index resource_relations_created_by_idx
  on public.resource_relations (created_by)
  where created_by is not null;

create table public.resource_access_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  resource_id uuid not null references public.resources (id) on delete restrict,
  resource_version_id uuid not null
    references public.resource_versions (id) on delete restrict,
  action text not null check (
    action in (
      'opened', 'closed', 'signed_url_issued', 'video_played',
      'video_paused', 'pdf_page_viewed'
    )
  ),
  request_id uuid not null default gen_random_uuid(),
  metadata jsonb not null default '{}'::jsonb check (
    jsonb_typeof(metadata) = 'object'
  ),
  created_at timestamptz not null default now()
);

create index resource_access_events_user_created_idx
  on public.resource_access_events (user_id, created_at desc);
create index resource_access_events_resource_created_idx
  on public.resource_access_events (resource_id, created_at desc);
create index resource_access_events_version_id_idx
  on public.resource_access_events (resource_version_id);
create index resource_access_events_organization_created_idx
  on public.resource_access_events (organization_id, created_at desc);

create function private.validate_resource()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  course_organization uuid;
  current_resource_id uuid;
  current_status public.resource_status;
begin
  select organization_id into course_organization
  from public.courses where id = new.course_id;

  if course_organization is null or course_organization <> new.organization_id then
    raise exception 'Resource and course must belong to the same organization'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE'
    and (new.organization_id, new.course_id, new.resource_type)
      is distinct from (old.organization_id, old.course_id, old.resource_type)
    and exists (
      select 1 from public.resource_versions rv where rv.resource_id = old.id
    ) then
    raise exception 'Versioned resource identity cannot be changed'
      using errcode = '23514';
  end if;

  if new.current_version_id is not null then
    select resource_id, status into current_resource_id, current_status
    from public.resource_versions
    where id = new.current_version_id;

    if current_resource_id is distinct from new.id
      or current_status not in ('approved', 'published') then
      raise exception 'Current version must be approved and belong to the resource'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create function private.validate_resource_version()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  parent_type public.resource_type;
  expected_version integer;
  resource_organization uuid;
  reviewer_organization uuid;
  approver_organization uuid;
  actor uuid := (select auth.uid());
begin
  perform 1 from public.resources where id = new.resource_id for update;

  select resource_type, organization_id
    into parent_type, resource_organization
  from public.resources where id = new.resource_id;

  if parent_type is null or parent_type <> new.resource_type then
    raise exception 'Resource version type must match the parent resource'
      using errcode = '23514';
  end if;

  if tg_op = 'INSERT' then
    select coalesce(max(version_number), 0) + 1 into expected_version
    from public.resource_versions where resource_id = new.resource_id;

    if new.version_number <> expected_version then
      raise exception 'Resource version numbers must increase without gaps'
        using errcode = '23514';
    end if;
  end if;

  if new.reviewed_by is not null then
    select organization_id into reviewer_organization
    from public.profiles where id = new.reviewed_by;
    if reviewer_organization is distinct from resource_organization then
      raise exception 'Resource reviewer must belong to the resource organization'
        using errcode = '23514';
    end if;
  end if;

  if new.approved_by is not null then
    select organization_id into approver_organization
    from public.profiles where id = new.approved_by;
    if approver_organization is distinct from resource_organization then
      raise exception 'Resource approver must belong to the resource organization'
        using errcode = '23514';
    end if;
  end if;

  if actor is not null and new.status = 'approved'
    and (tg_op = 'INSERT' or old.status <> 'approved')
    and new.approved_by <> actor then
    raise exception 'Resource approver must be the acting administrator'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create function private.prevent_immutable_resource_version_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status in ('approved', 'published', 'retired', 'archived')
    or exists (
      select 1 from public.resources r
      where r.current_version_id = old.id
    ) then
    raise exception 'Approved or historically selected resource versions are immutable'
      using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if new.resource_id <> old.resource_id
    or new.version_number <> old.version_number
    or new.resource_type <> old.resource_type then
    raise exception 'Resource version identity cannot be changed'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create function private.validate_resource_taxonomy_assignment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  resource_organization uuid;
  taxonomy_organization uuid;
begin
  select organization_id into resource_organization
  from public.resources where id = new.resource_id;

  if tg_table_name = 'resource_topics' then
    select organization_id into taxonomy_organization
    from public.bls_topics where id = new.topic_id;
  else
    select organization_id into taxonomy_organization
    from public.teaching_stages where id = new.teaching_stage_id;
  end if;

  if resource_organization is null or taxonomy_organization is null
    or resource_organization <> taxonomy_organization then
    raise exception 'Resource taxonomy must belong to the resource organization'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create function private.validate_resource_relation()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  source_organization uuid;
  source_course uuid;
  target_organization uuid;
  target_course uuid;
begin
  select organization_id, course_id into source_organization, source_course
  from public.resources where id = new.resource_id;
  select organization_id, course_id into target_organization, target_course
  from public.resources where id = new.related_resource_id;

  if source_organization is null or target_organization is null
    or source_organization <> target_organization
    or source_course <> target_course then
    raise exception 'Related resources must share an organization and course'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create function private.validate_resource_access_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  resource_organization uuid;
  version_resource uuid;
  profile_organization uuid;
begin
  select organization_id into resource_organization
  from public.resources where id = new.resource_id;
  select resource_id into version_resource
  from public.resource_versions where id = new.resource_version_id;
  select organization_id into profile_organization
  from public.profiles where id = new.user_id;

  if resource_organization is null
    or resource_organization <> new.organization_id
    or profile_organization <> new.organization_id
    or version_resource <> new.resource_id then
    raise exception 'Resource access event references are inconsistent'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_resource() from public;
revoke all on function private.validate_resource_version() from public;
revoke all on function private.prevent_immutable_resource_version_change()
  from public;
revoke all on function private.validate_resource_taxonomy_assignment()
  from public;
revoke all on function private.validate_resource_relation() from public;
revoke all on function private.validate_resource_access_event() from public;

create trigger resources_validate
before insert or update on public.resources
for each row execute function private.validate_resource();

create trigger resource_versions_validate
before insert or update on public.resource_versions
for each row execute function private.validate_resource_version();

create trigger resource_versions_prevent_immutable_change
before update or delete on public.resource_versions
for each row execute function private.prevent_immutable_resource_version_change();

create trigger resource_topics_validate
before insert or update on public.resource_topics
for each row execute function private.validate_resource_taxonomy_assignment();

create trigger resource_teaching_stages_validate
before insert or update on public.resource_teaching_stages
for each row execute function private.validate_resource_taxonomy_assignment();

create trigger resource_relations_validate
before insert or update on public.resource_relations
for each row execute function private.validate_resource_relation();

create trigger resource_access_events_validate
before insert or update on public.resource_access_events
for each row execute function private.validate_resource_access_event();

comment on table public.resource_versions is
  'Immutable content snapshots. Editing creates a new version; approved and historically selected versions cannot be changed.';
comment on table public.resource_access_events is
  'Append-only resource access evidence. Browser roles receive no direct write grant.';
