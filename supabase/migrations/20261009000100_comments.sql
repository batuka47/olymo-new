-- Reader accounts and comments. Readers write with their own session, so everything that must
-- hold is enforced here, not only in the server actions: a reader can call the REST API directly.

-- Profiles ---------------------------------------------------------------------------------------

-- banned: staff stopped this account from commenting. name_changed_at: readers may change the
-- display name they got at sign-up once.
alter table public.profiles
  add column banned boolean not null default false,
  add column name_changed_at timestamptz;

-- Display name from Google (full_name or name) or the email address before the @.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
        split_part(new.email, '@', 1)
      ),
      80
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- What a signed-in user may change on a profile: admins the role, staff the ban, and readers their
-- own display name once. Requests without a user (service role, SQL editor) may change anything.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  if new.role is distinct from old.role and not private.is_admin() then
    raise exception 'Only admins can change a profile role' using errcode = '42501';
  end if;
  if new.banned is distinct from old.banned and not private.is_staff() then
    raise exception 'Only staff can ban or unban' using errcode = '42501';
  end if;
  if new.name_changed_at is distinct from old.name_changed_at and not private.is_staff() then
    raise exception 'name_changed_at is set by the database' using errcode = '42501';
  end if;
  if new.display_name is distinct from old.display_name and not private.is_staff() then
    if old.name_changed_at is not null then
      raise exception 'display_name_locked' using errcode = '42501';
    end if;
    new.name_changed_at := now();
  end if;
  return new;
end;
$$;

create function private.is_banned()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select banned from public.profiles where id = (select auth.uid())),
    false
  );
$$;

grant execute on function private.is_banned() to anon, authenticated, service_role;

-- Articles ---------------------------------------------------------------------------------------

-- "Сэтгэгдэл хаах" in the article editor: existing comments stay, new ones are refused.
alter table public.articles add column comments_closed boolean not null default false;

-- Comments ---------------------------------------------------------------------------------------

-- parent_id: one level of replies. edited_at: the author changed the text. held: the word filter
-- hid it until staff look (status 'hidden'); staff showing it clears the flag. author_name: the
-- author's display name, kept here so the public can read names with comments without reading
-- profiles (set on insert, updated when the name changes).
alter table public.comments
  add column parent_id uuid references public.comments (id) on delete cascade,
  add column edited_at timestamptz,
  add column held boolean not null default false,
  add column author_name text not null default '';

create index comments_parent_id_idx on public.comments (parent_id) where parent_id is not null;
create index comments_user_created_at_idx on public.comments (user_id, created_at desc);
create index comments_report_count_idx on public.comments (report_count desc, created_at desc)
  where report_count > 0;

-- A short list of words that hold a comment for review instead of publishing it. Entries ending
-- in * also match longer words ("fuck*" matches "fucking"); the others only the whole word, so
-- "баас" does not catch the name "Баасан". To change the list, replace this function in a new
-- migration.
create function public.comment_needs_review(body text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select exists (
    select 1
    from unnest(array[
      -- Mongolian, and Russian swearing common in Mongolian writing
      'новш', 'новшийн', 'новшнууд', 'баас', 'баастай', 'гичий', 'гичийн', 'янхан', 'янхны',
      'пизда*', 'пиздец', 'пизд', 'хуй', 'хуйня', 'хуйн', 'бля', 'блядь', 'блять', 'сука', 'ебать*',
      'ёбан*', 'уёбок',
      -- English
      'fuck*', 'motherfuck*', 'shit*', 'bitch*', 'cunt*', 'asshole*', 'dick', 'dickhead',
      'bastard*', 'whore*', 'slut*', 'nigger*', 'faggot*', 'porn*'
    ]) as word
    where ' ' || regexp_replace(lower(body), '[^[:alnum:]]+', ' ', 'g') || ' ' like
      case
        when right(word, 1) = '*' then '% ' || rtrim(word, '*') || '%'
        else '% ' || word || ' %'
      end
  );
$$;

-- The rules for signed-in writes through the API (the service role and trusted functions skip
-- them): only on public articles that are open, not when banned, replies one level deep on the
-- same article, 1 comment per 30 seconds, and the word filter. The writer cannot set status,
-- held, counts or the author's name.
create function public.check_comment_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.author_name := coalesce(
      (select display_name from public.profiles where id = new.user_id),
      ''
    );
  end if;
  if (select auth.uid()) is null or current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- The insert policy checks this too, but only after this trigger: say so before the others.
    if not exists (select 1 from public.articles a where a.id = new.article_id) then
      raise exception 'comments_article_unavailable' using errcode = '42501';
    end if;
    if private.is_banned() then
      raise exception 'comments_banned' using errcode = '42501';
    end if;
    if exists (
      select 1 from public.articles a where a.id = new.article_id and a.comments_closed
    ) then
      raise exception 'comments_closed' using errcode = '42501';
    end if;
    if new.parent_id is not null and not exists (
      select 1 from public.comments p
      where p.id = new.parent_id and p.parent_id is null and p.article_id = new.article_id
    ) then
      raise exception 'comments_bad_parent' using errcode = '23514';
    end if;
    if exists (
      select 1 from public.comments c
      where c.user_id = new.user_id and c.created_at > now() - interval '30 seconds'
    ) then
      raise exception 'comments_rate_limited' using errcode = 'P0001';
    end if;
    new.report_count := 0;
    new.edited_at := null;
    new.created_at := now();
    new.held := public.comment_needs_review(new.body);
    new.status := case when new.held then 'hidden' else 'visible' end;
  elsif new.body is distinct from old.body then
    new.edited_at := now();
    -- Text cleaned up by its author is released; staff-hidden comments stay hidden.
    if public.comment_needs_review(new.body) then
      new.held := true;
      new.status := 'hidden';
    elsif old.held then
      new.held := false;
      new.status := 'visible';
    end if;
  end if;
  return new;
end;
$$;

-- Runs after comments_guard_moderation (triggers fire in name order), so the guard sees what the
-- reader sent and this trigger may then set status and held itself.
create trigger comments_review
  before insert or update on public.comments
  for each row execute function public.check_comment_write();

-- The moderation guard applies to API roles only: trusted functions (security definer, running as
-- their owner) may keep counters such as report_count.
create or replace function public.guard_comment_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or current_user not in ('anon', 'authenticated')
    or private.is_staff() then
    return new;
  end if;
  if new.status is distinct from old.status
    or new.held is distinct from old.held
    or new.report_count is distinct from old.report_count
    or new.article_id is distinct from old.article_id
    or new.user_id is distinct from old.user_id
    or new.parent_id is distinct from old.parent_id
    or new.created_at is distinct from old.created_at
    or new.author_name is distinct from old.author_name then
    raise exception 'Only staff can change comment moderation fields' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Authors may edit and delete their own comments for 15 minutes; staff always. The insert policy
-- no longer pins status: check_comment_write sets it.
drop policy "Users comment as themselves" on public.comments;
drop policy "Authors and staff update comments" on public.comments;
drop policy "Authors and staff delete comments" on public.comments;

create policy "Users comment as themselves"
  on public.comments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.articles a where a.id = article_id)
  );
create policy "Authors for 15 minutes and staff update comments"
  on public.comments for update to authenticated
  using (
    (user_id = (select auth.uid()) and created_at > now() - interval '15 minutes')
    or (select private.is_staff())
  )
  with check (user_id = (select auth.uid()) or (select private.is_staff()));
create policy "Authors for 15 minutes and staff delete comments"
  on public.comments for delete to authenticated
  using (
    (user_id = (select auth.uid()) and created_at > now() - interval '15 minutes')
    or (select private.is_staff())
  );

-- A changed display name follows to the author's comments, including ones the author may no
-- longer edit, so this runs as its owner (which the moderation guard allows).
create function public.sync_comment_author_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.comments set author_name = coalesce(new.display_name, '') where user_id = new.id;
  return new;
end;
$$;

revoke execute on function public.sync_comment_author_name() from public, anon, authenticated;

create trigger profiles_sync_comment_author_name
  after update of display_name on public.profiles
  for each row
  when (old.display_name is distinct from new.display_name)
  execute function public.sync_comment_author_name();

-- Reports ("Мэдэгдэх"): one per reader and comment, never on one's own.
create table public.comment_reports (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_reports enable row level security;

create policy "Readers report others' visible comments"
  on public.comment_reports for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.comments c
      where c.id = comment_id and c.status = 'visible' and c.user_id <> (select auth.uid())
    )
  );
create policy "Reporters and staff read reports"
  on public.comment_reports for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_staff()));

-- report_count is kept here, as its owner, which the moderation guard allows.
create function public.count_comment_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.comments set report_count = report_count + 1 where id = new.comment_id;
  return new;
end;
$$;

revoke execute on function public.count_comment_report() from public, anon, authenticated;

create trigger comment_reports_count
  after insert on public.comment_reports
  for each row execute function public.count_comment_report();

-- Reading comments -------------------------------------------------------------------------------

-- A page of an article's comments for the site: visible ones (and the reader's own unpublished ones,
-- marked hidden),
-- newest first, 20 top-level at a time with all their replies. Runs with the caller's rights, so
-- RLS applies; only public articles answer.
create function public.article_comments(
  target_article uuid,
  before_created_at timestamptz default null,
  before_id uuid default null,
  page_size integer default 20
)
returns table (
  id uuid,
  parent_id uuid,
  author_name text,
  body text,
  hidden boolean,
  created_at timestamptz,
  edited_at timestamptz,
  is_own boolean,
  reported boolean
)
language sql
stable
set search_path = ''
as $$
  with viewer as (
    select (select auth.uid()) as id
  ),
  shown as (
    select c.*
    from public.comments c, viewer
    where c.article_id = target_article
      and (c.status = 'visible' or c.user_id = viewer.id)
      and exists (select 1 from public.published_articles a where a.id = c.article_id)
  ),
  page as (
    select s.*
    from shown s
    where s.parent_id is null
      and (
        before_created_at is null
        or (s.created_at, s.id) < (before_created_at, coalesce(before_id, s.id))
      )
    order by s.created_at desc, s.id desc
    limit least(greatest(page_size, 1), 50)
  ),
  -- Each row carries its thread's top-level comment, so threads sort newest first and the
  -- replies inside them oldest first.
  threads as (
    select p.*, p.created_at as thread_at, p.id as thread_id from page p
    union all
    select s.*, p.created_at, p.id from shown s join page p on s.parent_id = p.id
  )
  select
    c.id,
    c.parent_id,
    coalesce(nullif(c.author_name, ''), '—'),
    c.body,
    c.status <> 'visible',
    c.created_at,
    c.edited_at,
    c.user_id = viewer.id,
    exists (
      select 1 from public.comment_reports r where r.comment_id = c.id and r.user_id = viewer.id
    )
  from threads c
  cross join viewer
  order by c.thread_at desc, c.thread_id desc, c.parent_id nulls first, c.created_at;
$$;

grant execute on function public.article_comments(uuid, timestamptz, uuid, integer)
  to anon, authenticated, service_role;

-- "Сэтгэгдэл (n)": visible comments and replies on a public article.
create function public.article_comment_count(target_article uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer
  from public.comments c
  where c.article_id = target_article
    and c.status = 'visible'
    and exists (select 1 from public.published_articles a where a.id = c.article_id);
$$;

grant execute on function public.article_comment_count(uuid) to anon, authenticated, service_role;

-- Sign-in links by email are rate limited per address like staff sign-in (auth_attempts).
alter table public.auth_attempts drop constraint auth_attempts_action_check;
alter table public.auth_attempts
  add constraint auth_attempts_action_check
  check (action in ('login', 'forgot_password', 'magic_link'));
