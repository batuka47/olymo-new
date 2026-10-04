-- Deleting a comment that others have answered keeps their replies: the comment becomes a
-- tombstone ("Устгагдсан сэтгэгдэл": no text, no author, no actions) and the thread stays.
-- Comments nobody answered are deleted as before. This applies to a reader deleting one comment
-- and to a reader deleting their account. Staff deleting from /admin/comments still remove the
-- whole thread.

-- deleted_at marks a tombstone. Its text and author are removed, so user_id may now be empty.
alter table public.comments
  add column deleted_at timestamptz,
  alter column user_id drop not null;

alter table public.comments drop constraint comments_body_check;
alter table public.comments
  add constraint comments_body_check check (
    case
      when deleted_at is null then user_id is not null and char_length(body) between 1 and 1000
      else user_id is null and body = '' and author_name = ''
    end
  );

-- Empties a comment into a tombstone. It is shown (status 'visible') whatever it was before, so
-- the replies under it stay readable; its reports go with its text.
create function private.tombstone_comment(target uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.comment_reports where comment_id = target;
  update public.comments
  set deleted_at = now(), body = '', user_id = null, author_name = '', status = 'visible',
      held = false, report_count = 0, edited_at = null
  where id = target;
$$;

revoke execute on function private.tombstone_comment(uuid) from public, anon, authenticated;

-- A reader deleting their own comment that has replies: keep it as a tombstone and cancel the
-- delete. Staff deletes and deletes without a signed-in user go ahead.
create function public.keep_answered_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.deleted_at is null
    and old.user_id = (select auth.uid())
    and not private.is_staff()
    and exists (select 1 from public.comments r where r.parent_id = old.id) then
    perform private.tombstone_comment(old.id);
    return null;
  end if;
  return old;
end;
$$;

revoke execute on function public.keep_answered_comment() from public, anon, authenticated;

create trigger comments_keep_answered
  before delete on public.comments
  for each row execute function public.keep_answered_comment();

-- A tombstone whose last reply is deleted has nothing left to hold up: it goes too.
create function public.remove_empty_tombstone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.parent_id is not null then
    delete from public.comments p
    where p.id = old.parent_id
      and p.deleted_at is not null
      and not exists (select 1 from public.comments r where r.parent_id = p.id);
  end if;
  return null;
end;
$$;

revoke execute on function public.remove_empty_tombstone() from public, anon, authenticated;

create trigger comments_remove_empty_tombstone
  after delete on public.comments
  for each row execute function public.remove_empty_tombstone();

-- Deleting an account (auth user → profile): the reader's replies go, their comments that others
-- answered become tombstones, and the rest go with the profile (the foreign key cascades).
create function public.keep_answered_comments_of_deleted_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.comments where user_id = old.id and parent_id is not null;
  perform private.tombstone_comment(c.id)
  from public.comments c
  where c.user_id = old.id
    and exists (select 1 from public.comments r where r.parent_id = c.id);
  return old;
end;
$$;

revoke execute on function public.keep_answered_comments_of_deleted_profile()
  from public, anon, authenticated;

create trigger profiles_keep_answered_comments
  before delete on public.profiles
  for each row execute function public.keep_answered_comments_of_deleted_profile();

-- Nobody replies to a tombstone. Otherwise the same rules as before (…_comments.sql).
create or replace function public.check_comment_write()
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
      where p.id = new.parent_id
        and p.parent_id is null
        and p.deleted_at is null
        and p.article_id = new.article_id
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
    new.deleted_at := null;
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

-- Readers cannot turn a comment into a tombstone (or back) by hand.
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
    or new.author_name is distinct from old.author_name
    or new.deleted_at is distinct from old.deleted_at then
    raise exception 'Only staff can change comment moderation fields' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- The listing gains a deleted flag (tombstones). is_own is false, not null, for visitors.
drop function public.article_comments(uuid, timestamptz, uuid, integer);

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
  deleted boolean,
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
    c.deleted_at is not null,
    c.created_at,
    c.edited_at,
    coalesce(c.user_id = viewer.id, false),
    exists (
      select 1 from public.comment_reports r where r.comment_id = c.id and r.user_id = viewer.id
    )
  from threads c
  cross join viewer
  order by c.thread_at desc, c.thread_id desc, c.parent_id nulls first, c.created_at;
$$;

grant execute on function public.article_comments(uuid, timestamptz, uuid, integer)
  to anon, authenticated, service_role;

-- "Сэтгэгдэл (n)" does not count tombstones.
create or replace function public.article_comment_count(target_article uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer
  from public.comments c
  where c.article_id = target_article
    and c.status = 'visible'
    and c.deleted_at is null
    and exists (select 1 from public.published_articles a where a.id = c.article_id);
$$;
