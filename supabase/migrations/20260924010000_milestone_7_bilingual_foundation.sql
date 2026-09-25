-- Milestone 7 - Phase 7.2A: Bilingual Locale & Preference Foundation

-- 1. User profile preferred language
alter table public.profiles
  add column preferred_language text not null default 'en',
  add constraint profiles_preferred_language_check check (preferred_language in ('en', 'ms'));

comment on column public.profiles.preferred_language is
  'User preferred UI and course language. Active users may update their own preference; pending registration sets it via registration RPC.';

grant select, update (preferred_language) on table public.profiles to authenticated;

-- Enforce user-owned preferred_language updates.
-- Existing profiles_update_authorized allows administrators to update profile rows,
-- but preferred_language must be strictly self-owned.
create or replace function private.validate_profile_preferred_language_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
begin
  if old.preferred_language is not distinct from new.preferred_language then
    return new;
  end if;

  if actor is null then
    return new;
  end if;

  if actor <> new.id then
    raise exception 'Cannot update another user''s preferred language'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_profile_preferred_language_update()
  from public;

comment on function private.validate_profile_preferred_language_update() is
  'Ensures preferred_language updates are strictly user-owned by the profile owner; trusted direct/service operations have no auth.uid().';

create trigger profiles_validate_preferred_language_update
before update of preferred_language on public.profiles
for each row execute function private.validate_profile_preferred_language_update();

-- 2. Bilingual course metadata
alter table public.courses
  add column title_ms text null,
  add column description_ms text null,
  add constraint courses_title_ms_check check (
    title_ms is null or char_length(trim(title_ms)) between 2 and 160
  );

comment on column public.courses.title_ms is
  'Authored Bahasa Melayu course title. English title remains fallback.';
comment on column public.courses.description_ms is
  'Authored Bahasa Melayu course description. English description remains fallback.';

grant select, update (title_ms, description_ms) on table public.courses to authenticated;

-- 3. Bilingual cohort metadata
alter table public.cohorts
  add column name_ms text null,
  add column description_ms text null,
  add constraint cohorts_name_ms_check check (
    name_ms is null or char_length(trim(name_ms)) between 2 and 160
  );

comment on column public.cohorts.name_ms is
  'Authored Bahasa Melayu cohort name. English name remains fallback.';
comment on column public.cohorts.description_ms is
  'Authored Bahasa Melayu cohort description. English description remains fallback.';

grant select, update (name_ms, description_ms) on table public.cohorts to authenticated;

-- 4. Resource content language classification
create type public.resource_language as enum (
  'en',
  'ms',
  'bilingual',
  'language_independent'
);

comment on type public.resource_language is
  'Language classification for educational resource content.';

alter table public.resources
  add column content_language public.resource_language not null default 'en';

comment on column public.resources.content_language is
  'Language classification of the resource content itself.';

grant select, update (content_language) on table public.resources to authenticated;
