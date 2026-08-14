create function private.resource_organization_id(target_resource_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select r.organization_id from public.resources r where r.id = target_resource_id;
$$;

create function private.can_read_resource(target_resource_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active_user()
    and exists (
      select 1
      from public.resources r
      where r.id = target_resource_id
        and r.status = 'published'
        and r.current_version_id is not null
        and (r.available_from is null or r.available_from <= now())
        and (r.available_until is null or r.available_until > now())
        and private.has_effective_course_access(r.course_id)
        and (
          (
            private.has_role(array['learner']::public.app_role[])
            and exists (
              select 1 from public.resource_audiences ra
              where ra.resource_id = r.id and ra.audience = 'learner'
            )
          )
          or (
            private.has_role(array['instructor']::public.app_role[])
            and private.is_assigned_instructor_for_course(r.course_id)
            and exists (
              select 1 from public.resource_audiences ra
              where ra.resource_id = r.id
                and ra.audience in ('learner', 'instructor')
            )
          )
        )
    );
$$;

revoke all on function private.resource_organization_id(uuid) from public;
revoke all on function private.can_read_resource(uuid) from public;
grant execute on function private.resource_organization_id(uuid)
  to authenticated, service_role;
grant execute on function private.can_read_resource(uuid)
  to authenticated, service_role;

alter table public.courses enable row level security;
alter table public.bls_topics enable row level security;
alter table public.teaching_stages enable row level security;
alter table public.course_entitlements enable row level security;
alter table public.resources enable row level security;
alter table public.resource_versions enable row level security;
alter table public.resource_audiences enable row level security;
alter table public.resource_topics enable row level security;
alter table public.resource_teaching_stages enable row level security;
alter table public.resource_relations enable row level security;
alter table public.resource_access_events enable row level security;

revoke all on table public.courses from anon, authenticated;
revoke all on table public.bls_topics from anon, authenticated;
revoke all on table public.teaching_stages from anon, authenticated;
revoke all on table public.course_entitlements from anon, authenticated;
revoke all on table public.resources from anon, authenticated;
revoke all on table public.resource_versions from anon, authenticated;
revoke all on table public.resource_audiences from anon, authenticated;
revoke all on table public.resource_topics from anon, authenticated;
revoke all on table public.resource_teaching_stages from anon, authenticated;
revoke all on table public.resource_relations from anon, authenticated;
revoke all on table public.resource_access_events from anon, authenticated;

grant select, insert on table public.courses to authenticated;
grant update (
  slug, title, description, status, updated_by
) on table public.courses to authenticated;
grant update (course_id) on table public.cohorts to authenticated;
grant select, insert on table public.bls_topics to authenticated;
grant update (slug, name, description, display_order, active)
  on table public.bls_topics to authenticated;
grant select, insert on table public.teaching_stages to authenticated;
grant update (slug, name, description, display_order, active)
  on table public.teaching_stages to authenticated;
grant select, insert on table public.course_entitlements to authenticated;
grant update (
  access_type, starts_at, expires_at, status, revoked_at, revoked_by,
  revocation_reason
) on table public.course_entitlements to authenticated;
grant select, insert on table public.resources to authenticated;
grant update (
  slug, title, status, estimated_minutes, featured, available_from,
  available_until, current_version_id, updated_by
) on table public.resources to authenticated;
grant select, insert on table public.resource_versions to authenticated;
grant update (
  title, summary, content, youtube_video_id, storage_path, content_hash,
  guideline_source, guideline_year, reviewed_by, reviewed_at, next_review_at,
  approved_by, approved_at, status
) on table public.resource_versions to authenticated;
grant select, insert, update, delete on table public.resource_audiences
  to authenticated;
grant select, insert, update, delete on table public.resource_topics
  to authenticated;
grant select, insert, update, delete on table public.resource_teaching_stages
  to authenticated;
grant select, insert, update, delete on table public.resource_relations
  to authenticated;

grant select, insert, update, delete on table public.courses to service_role;
grant select, insert, update, delete on table public.bls_topics to service_role;
grant select, insert, update, delete on table public.teaching_stages to service_role;
grant select, insert, update, delete on table public.course_entitlements to service_role;
grant select, insert, update, delete on table public.resources to service_role;
grant select, insert, update, delete on table public.resource_versions to service_role;
grant select, insert, update, delete on table public.resource_audiences to service_role;
grant select, insert, update, delete on table public.resource_topics to service_role;
grant select, insert, update, delete on table public.resource_teaching_stages to service_role;
grant select, insert, update, delete on table public.resource_relations to service_role;
grant select, insert on table public.resource_access_events to service_role;

create policy courses_select_authorized on public.courses for select
to authenticated using (
  private.is_admin_in_organization(organization_id)
  or private.has_effective_course_access(id)
);
create policy courses_insert_admin on public.courses for insert
to authenticated with check (
  private.is_admin_in_organization(organization_id)
  and created_by = (select auth.uid())
);
create policy courses_update_admin on public.courses for update
to authenticated using (private.is_admin_in_organization(organization_id))
with check (private.is_admin_in_organization(organization_id));

create policy bls_topics_select_authorized on public.bls_topics for select
to authenticated using (
  private.is_admin_in_organization(organization_id)
  or (
    organization_id = private.current_organization_id()
    and private.has_any_effective_course_access(organization_id)
  )
);
create policy bls_topics_insert_admin on public.bls_topics for insert
to authenticated with check (private.is_admin_in_organization(organization_id));
create policy bls_topics_update_admin on public.bls_topics for update
to authenticated using (private.is_admin_in_organization(organization_id))
with check (private.is_admin_in_organization(organization_id));

create policy teaching_stages_select_authorized on public.teaching_stages for select
to authenticated using (
  private.is_admin_in_organization(organization_id)
  or (
    organization_id = private.current_organization_id()
    and private.has_any_effective_course_access(organization_id)
  )
);
create policy teaching_stages_insert_admin on public.teaching_stages for insert
to authenticated with check (private.is_admin_in_organization(organization_id));
create policy teaching_stages_update_admin on public.teaching_stages for update
to authenticated using (private.is_admin_in_organization(organization_id))
with check (private.is_admin_in_organization(organization_id));

create policy course_entitlements_select_authorized
on public.course_entitlements for select to authenticated using (
  user_id = (select auth.uid())
  or private.is_admin_in_organization(organization_id)
);
create policy course_entitlements_insert_admin
on public.course_entitlements for insert to authenticated with check (
  private.is_admin_in_organization(organization_id)
  and granted_by = (select auth.uid())
);
create policy course_entitlements_update_admin
on public.course_entitlements for update to authenticated
using (private.is_admin_in_organization(organization_id))
with check (private.is_admin_in_organization(organization_id));

create policy resources_select_authorized on public.resources for select
to authenticated using (
  private.is_admin_in_organization(organization_id)
  or private.can_read_resource(id)
);
create policy resources_insert_admin on public.resources for insert
to authenticated with check (
  private.is_admin_in_organization(organization_id)
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
);
create policy resources_update_admin on public.resources for update
to authenticated using (private.is_admin_in_organization(organization_id))
with check (
  private.is_admin_in_organization(organization_id)
  and updated_by = (select auth.uid())
);

create policy resource_versions_select_authorized
on public.resource_versions for select to authenticated using (
  private.is_admin_in_organization(
    private.resource_organization_id(resource_id)
  )
  or (
    private.can_read_resource(resource_id)
    and exists (
      select 1 from public.resources r
      where r.id = resource_versions.resource_id
        and r.current_version_id = resource_versions.id
    )
  )
);
create policy resource_versions_insert_admin
on public.resource_versions for insert to authenticated with check (
  private.is_admin_in_organization(
    private.resource_organization_id(resource_id)
  )
  and created_by = (select auth.uid())
);
create policy resource_versions_update_admin
on public.resource_versions for update to authenticated
using (
  private.is_admin_in_organization(
    private.resource_organization_id(resource_id)
  )
)
with check (
  private.is_admin_in_organization(
    private.resource_organization_id(resource_id)
  )
);

create policy resource_audiences_select_authorized
on public.resource_audiences for select to authenticated using (
  private.is_admin_in_organization(
    private.resource_organization_id(resource_id)
  ) or private.can_read_resource(resource_id)
);
create policy resource_audiences_insert_admin
on public.resource_audiences for insert to authenticated with check (
  private.is_admin_in_organization(
    private.resource_organization_id(resource_id)
  ) and created_by = (select auth.uid())
);
create policy resource_audiences_update_admin
on public.resource_audiences for update to authenticated
using (private.is_admin_in_organization(private.resource_organization_id(resource_id)))
with check (private.is_admin_in_organization(private.resource_organization_id(resource_id)));
create policy resource_audiences_delete_admin
on public.resource_audiences for delete to authenticated using (
  private.is_admin_in_organization(private.resource_organization_id(resource_id))
);

create policy resource_topics_select_authorized
on public.resource_topics for select to authenticated using (
  private.is_admin_in_organization(private.resource_organization_id(resource_id))
  or private.can_read_resource(resource_id)
);
create policy resource_topics_insert_admin
on public.resource_topics for insert to authenticated with check (
  private.is_admin_in_organization(private.resource_organization_id(resource_id))
  and created_by = (select auth.uid())
);
create policy resource_topics_update_admin
on public.resource_topics for update to authenticated
using (private.is_admin_in_organization(private.resource_organization_id(resource_id)))
with check (private.is_admin_in_organization(private.resource_organization_id(resource_id)));
create policy resource_topics_delete_admin
on public.resource_topics for delete to authenticated using (
  private.is_admin_in_organization(private.resource_organization_id(resource_id))
);

create policy resource_teaching_stages_select_authorized
on public.resource_teaching_stages for select to authenticated using (
  private.is_admin_in_organization(private.resource_organization_id(resource_id))
  or private.can_read_resource(resource_id)
);
create policy resource_teaching_stages_insert_admin
on public.resource_teaching_stages for insert to authenticated with check (
  private.is_admin_in_organization(private.resource_organization_id(resource_id))
  and created_by = (select auth.uid())
);
create policy resource_teaching_stages_update_admin
on public.resource_teaching_stages for update to authenticated
using (private.is_admin_in_organization(private.resource_organization_id(resource_id)))
with check (private.is_admin_in_organization(private.resource_organization_id(resource_id)));
create policy resource_teaching_stages_delete_admin
on public.resource_teaching_stages for delete to authenticated using (
  private.is_admin_in_organization(private.resource_organization_id(resource_id))
);

create policy resource_relations_select_authorized
on public.resource_relations for select to authenticated using (
  (
    private.is_admin_in_organization(private.resource_organization_id(resource_id))
    and private.is_admin_in_organization(
      private.resource_organization_id(related_resource_id)
    )
  )
  or (
    private.can_read_resource(resource_id)
    and private.can_read_resource(related_resource_id)
  )
);
create policy resource_relations_insert_admin
on public.resource_relations for insert to authenticated with check (
  private.is_admin_in_organization(private.resource_organization_id(resource_id))
  and private.is_admin_in_organization(
    private.resource_organization_id(related_resource_id)
  )
  and created_by = (select auth.uid())
);
create policy resource_relations_update_admin
on public.resource_relations for update to authenticated
using (
  private.is_admin_in_organization(private.resource_organization_id(resource_id))
  and private.is_admin_in_organization(
    private.resource_organization_id(related_resource_id)
  )
)
with check (
  private.is_admin_in_organization(private.resource_organization_id(resource_id))
  and private.is_admin_in_organization(
    private.resource_organization_id(related_resource_id)
  )
);
create policy resource_relations_delete_admin
on public.resource_relations for delete to authenticated using (
  private.is_admin_in_organization(private.resource_organization_id(resource_id))
  and private.is_admin_in_organization(
    private.resource_organization_id(related_resource_id)
  )
);

create policy resource_access_events_select_admin
on public.resource_access_events for select to authenticated using (
  private.is_admin_in_organization(organization_id)
);

create function public.publish_resource_version(
  target_resource_id uuid,
  target_version_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_organization uuid;
  version_resource uuid;
  version_status public.resource_status;
begin
  if actor is null or not private.is_active_user() then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select organization_id into target_organization
  from public.resources
  where id = target_resource_id
  for update;

  if target_organization is null
    or not private.is_admin_in_organization(target_organization) then
    raise exception 'Not authorized to publish this resource'
      using errcode = '42501';
  end if;

  select resource_id, status into version_resource, version_status
  from public.resource_versions
  where id = target_version_id
  for update;

  if version_resource is distinct from target_resource_id
    or version_status <> 'approved' then
    raise exception 'Only an approved version of this resource can be published'
      using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.resource_audiences
    where resource_id = target_resource_id
  ) or not exists (
    select 1 from public.resource_topics
    where resource_id = target_resource_id
  ) then
    raise exception 'Published resources require an audience and topic'
      using errcode = '23514';
  end if;

  update public.resources
  set current_version_id = target_version_id,
      status = 'published',
      updated_by = actor
  where id = target_resource_id;
end;
$$;

revoke all on function public.publish_resource_version(uuid, uuid)
  from public, anon;
grant execute on function public.publish_resource_version(uuid, uuid)
  to authenticated, service_role;

comment on function public.publish_resource_version(uuid, uuid) is
  'Publishes an approved immutable version after same-organization administrator authorization and classification checks.';

create function private.audit_course_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
begin
  if actor is null then return new; end if;
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id,
    metadata, request_id
  ) values (
    actor,
    case when tg_op = 'INSERT' then 'course.created' else 'course.updated' end,
    'course', new.id, new.organization_id,
    jsonb_build_object('slug', new.slug, 'status', new.status),
    gen_random_uuid()
  );
  return new;
end;
$$;

create function private.audit_course_entitlement_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
begin
  if actor is null then return new; end if;
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id,
    metadata, request_id
  ) values (
    actor,
    case
      when tg_op = 'INSERT' then 'course.entitlement_granted'
      when new.status = 'revoked' and old.status <> 'revoked'
        then 'course.entitlement_revoked'
      else 'course.entitlement_updated'
    end,
    'course_entitlement', new.id, new.organization_id,
    jsonb_build_object(
      'course_id', new.course_id, 'user_id', new.user_id,
      'access_type', new.access_type, 'status', new.status,
      'expires_at', new.expires_at
    ),
    gen_random_uuid()
  );
  return new;
end;
$$;

create function private.audit_resource_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
begin
  if actor is null then return new; end if;
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id,
    metadata, request_id
  ) values (
    actor,
    case
      when tg_op = 'INSERT' then 'resource.created'
      when new.status = 'published' and old.status <> 'published'
        then 'resource.published'
      when new.status = 'retired' and old.status <> 'retired'
        then 'resource.retired'
      else 'resource.updated'
    end,
    'resource', new.id, new.organization_id,
    jsonb_build_object(
      'course_id', new.course_id, 'slug', new.slug,
      'resource_type', new.resource_type, 'status', new.status,
      'current_version_id', new.current_version_id
    ),
    gen_random_uuid()
  );
  return new;
end;
$$;

create function private.audit_resource_version_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  target_organization uuid;
begin
  if actor is null then return new; end if;
  select organization_id into target_organization
  from public.resources where id = new.resource_id;
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id,
    metadata, request_id
  ) values (
    actor,
    case
      when tg_op = 'INSERT' then 'resource.version_created'
      when new.status = 'approved' and old.status <> 'approved'
        then 'resource.version_approved'
      else 'resource.version_updated'
    end,
    'resource_version', new.id, target_organization,
    jsonb_build_object(
      'resource_id', new.resource_id, 'version_number', new.version_number,
      'status', new.status
    ),
    gen_random_uuid()
  );
  return new;
end;
$$;

create function private.audit_resource_classification_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  row_data record;
  target_organization uuid;
begin
  if actor is null then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  if tg_op = 'DELETE' then row_data := old; else row_data := new; end if;
  select organization_id into target_organization
  from public.resources where id = row_data.resource_id;
  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, organization_id,
    metadata, request_id
  ) values (
    actor,
    'resource.classification_' || lower(tg_op),
    tg_table_name, row_data.resource_id, target_organization,
    to_jsonb(row_data) - 'created_at', gen_random_uuid()
  );
  return row_data;
end;
$$;

revoke all on function private.audit_course_change() from public;
revoke all on function private.audit_course_entitlement_change() from public;
revoke all on function private.audit_resource_change() from public;
revoke all on function private.audit_resource_version_change() from public;
revoke all on function private.audit_resource_classification_change() from public;

create trigger courses_audit_change
after insert or update on public.courses
for each row execute function private.audit_course_change();
create trigger course_entitlements_audit_change
after insert or update on public.course_entitlements
for each row execute function private.audit_course_entitlement_change();
create trigger resources_audit_change
after insert or update on public.resources
for each row execute function private.audit_resource_change();
create trigger resource_versions_audit_change
after insert or update on public.resource_versions
for each row execute function private.audit_resource_version_change();
create trigger resource_audiences_audit_change
after insert or update or delete on public.resource_audiences
for each row execute function private.audit_resource_classification_change();
create trigger resource_topics_audit_change
after insert or update or delete on public.resource_topics
for each row execute function private.audit_resource_classification_change();
create trigger resource_teaching_stages_audit_change
after insert or update or delete on public.resource_teaching_stages
for each row execute function private.audit_resource_classification_change();
create trigger resource_relations_audit_change
after insert or update or delete on public.resource_relations
for each row execute function private.audit_resource_classification_change();

comment on table public.resource_access_events is
  'Append-only resource access evidence. Authenticated browser roles receive no direct privileges; trusted functions are added in a later phase.';
comment on function private.can_read_resource(uuid) is
  'Authorizes only active users with effective course access, a matching audience, and a currently available published resource.';
