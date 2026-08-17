create function private.validate_quiz_parentage()
returns trigger language plpgsql security definer set search_path = '' as $$
declare course_organization uuid; version_quiz uuid;
begin
  select organization_id into course_organization from public.courses where id = new.course_id;
  if course_organization is null or course_organization <> new.organization_id then
    raise exception 'QUIZ_COURSE_ORGANIZATION_MISMATCH' using errcode = '23514';
  end if;
  if new.current_version_id is not null then
    select quiz_id into version_quiz from public.quiz_versions where id = new.current_version_id;
    if version_quiz is distinct from new.id then
      raise exception 'QUIZ_CURRENT_VERSION_MISMATCH' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create function private.validate_question_parentage()
returns trigger language plpgsql security definer set search_path = '' as $$
declare course_organization uuid; version_question uuid;
begin
  select organization_id into course_organization from public.courses where id = new.course_id;
  if course_organization is null or course_organization <> new.organization_id then
    raise exception 'QUESTION_COURSE_ORGANIZATION_MISMATCH' using errcode = '23514';
  end if;
  if new.current_version_id is not null then
    select question_id into version_question from public.question_versions where id = new.current_version_id;
    if version_question is distinct from new.id then
      raise exception 'QUESTION_CURRENT_VERSION_MISMATCH' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create function private.validate_question_publication()
returns trigger language plpgsql security definer set search_path = '' as $$
declare option_count integer; correct_count integer;
begin
  if new.status = 'published' and old.status <> 'published' then
    select count(*), count(*) filter (where is_correct)
      into option_count, correct_count
    from public.question_options where question_version_id = new.id;
    if option_count < 2 or correct_count <> 1 then
      raise exception 'QUESTION_REQUIRES_OPTIONS_AND_ONE_CORRECT_ANSWER' using errcode = '23514';
    end if;
    if not exists (select 1 from public.question_version_topics where question_version_id = new.id) then
      raise exception 'QUESTION_REQUIRES_TOPIC' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create function private.validate_quiz_publication()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'published' and old.status <> 'published' then
    if not exists (select 1 from public.quiz_version_questions where quiz_version_id = new.id) then
      raise exception 'QUIZ_REQUIRES_QUESTIONS' using errcode = '23514';
    end if;
    if exists (
      select 1 from public.quiz_version_questions qvq
      join public.question_versions qv on qv.id = qvq.question_version_id
      where qvq.quiz_version_id = new.id and qv.status <> 'published'
    ) then
      raise exception 'QUIZ_REQUIRES_PUBLISHED_QUESTION_VERSIONS' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create function private.prevent_new_published_child()
returns trigger language plpgsql security definer set search_path = '' as $$
declare protected boolean;
begin
  if tg_table_name in ('question_options', 'question_version_topics') then
    select qv.status in ('published', 'retired') into protected
    from public.question_versions qv where qv.id = new.question_version_id;
  else
    select qv.status in ('published', 'retired') into protected
    from public.quiz_versions qv where qv.id = new.quiz_version_id;
  end if;
  if coalesce(protected, false) then
    raise exception 'PUBLISHED_ASSESSMENT_CONTENT_IMMUTABLE' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger quizzes_validate_parentage before insert or update of organization_id, course_id, current_version_id
on public.quizzes for each row execute function private.validate_quiz_parentage();
create trigger questions_validate_parentage before insert or update of organization_id, course_id, current_version_id
on public.questions for each row execute function private.validate_question_parentage();
create trigger question_versions_validate_publication before update of status on public.question_versions
for each row execute function private.validate_question_publication();
create trigger quiz_versions_validate_publication before update of status on public.quiz_versions
for each row execute function private.validate_quiz_publication();
create trigger question_options_prevent_published_insert before insert on public.question_options
for each row execute function private.prevent_new_published_child();
create trigger question_topics_prevent_published_insert before insert on public.question_version_topics
for each row execute function private.prevent_new_published_child();
create trigger quiz_questions_prevent_published_insert before insert on public.quiz_version_questions
for each row execute function private.prevent_new_published_child();

revoke all on function private.validate_quiz_parentage() from public, anon, authenticated;
revoke all on function private.validate_question_parentage() from public, anon, authenticated;
revoke all on function private.validate_question_publication() from public, anon, authenticated;
revoke all on function private.validate_quiz_publication() from public, anon, authenticated;
revoke all on function private.prevent_new_published_child() from public, anon, authenticated;
