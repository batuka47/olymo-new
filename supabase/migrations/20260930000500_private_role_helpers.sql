-- Security advisor lints 0028/0029: SECURITY DEFINER functions in the public schema are callable by
-- anyone as /rest/v1/rpc/<name>. Move the role checks to a schema the API does not expose and stop
-- direct calls to the signup trigger function. Policies keep working: they reference functions by
-- id, not by name.

create schema if not exists private;

-- RLS policies call these as the requesting role, so anon and authenticated still need access.
-- The service role needs it too: the guard triggers below name these functions, and Postgres
-- checks schema access before it evaluates the "no signed-in user" shortcut.
grant usage on schema private to anon, authenticated, service_role;

alter function public.is_staff() set schema private;
alter function public.is_admin() set schema private;

-- Trigger functions refer to the helpers by name, so point them at the new schema.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
    and (select auth.uid()) is not null
    and not private.is_admin() then
    raise exception 'Only admins can change a profile role' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.guard_comment_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or private.is_staff() then
    return new;
  end if;
  if new.status is distinct from old.status
    or new.report_count is distinct from old.report_count
    or new.article_id is distinct from old.article_id
    or new.user_id is distinct from old.user_id then
    raise exception 'Only staff can change comment moderation fields' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Only the auth.users trigger should run this; EXECUTE is not checked when a trigger fires.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
