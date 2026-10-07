-- Categories are managed by admins in /admin/categories instead of src/config/categories.ts.
-- The 7 existing categories keep their slugs. Олимпиад keeps the olympiad fields (key facts in the
-- editor, subject filter and deadline sort on its page), now a setting any category can have.
-- An article can also be listed in secondary categories ("Хамаарах категориуд"); its address keeps
-- the main one.

-- Categories -----------------------------------------------------------------------------------

alter table public.categories
  add column show_in_nav boolean not null default true,
  add column is_active boolean not null default true,
  add column has_olympiad_fields boolean not null default false,
  add constraint categories_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  add constraint categories_label_length check (char_length(btrim(label)) between 1 and 60),
  add constraint categories_description_length check (char_length(description) <= 300);

update public.categories set has_olympiad_fields = true where slug = 'olympiad';

-- Only admins change categories (editors pick them in the article editor).
drop policy "Staff insert categories" on public.categories;
drop policy "Staff update categories" on public.categories;
drop policy "Staff delete categories" on public.categories;

create policy "Admins insert categories"
  on public.categories for insert to authenticated
  with check ((select private.is_admin()));
create policy "Admins update categories"
  on public.categories for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete categories"
  on public.categories for delete to authenticated
  using ((select private.is_admin()));

-- "events" is the events section (/events lists the events table), built in code around this row:
-- articles cannot be filed there, and the row cannot be renamed or deleted.
alter table public.articles
  add constraint articles_not_in_events check (category_slug <> 'events');

-- Secondary categories --------------------------------------------------------------------------

create table public.article_categories (
  article_id uuid not null references public.articles (id) on delete cascade,
  -- No "on delete": a category in use cannot be deleted (see delete_category for moving first).
  category_slug text not null references public.categories (slug) on update cascade
    check (category_slug <> 'events'),
  primary key (article_id, category_slug)
);

create index article_categories_category_idx on public.article_categories (category_slug);

alter table public.article_categories enable row level security;

create policy "Anyone reads secondary categories of visible articles"
  on public.article_categories for select to anon, authenticated
  using (exists (select 1 from public.articles a where a.id = article_id));
create policy "Staff insert article categories"
  on public.article_categories for insert to authenticated
  with check ((select private.is_staff()));
create policy "Staff update article categories"
  on public.article_categories for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff delete article categories"
  on public.article_categories for delete to authenticated
  using ((select private.is_staff()));

-- Every category an article is listed in, the main one first. Category pages and the home page
-- filter on it (category_slugs @> '{slug}'); the triggers below keep it, nothing else writes it.
alter table public.articles add column category_slugs text[] not null default '{}';

create index articles_category_slugs_idx on public.articles using gin (category_slugs);

create function public.article_category_slugs(target_article uuid, main_slug text)
returns text[]
language sql
stable
set search_path = ''
as $$
  select array[main_slug] || array(
    select link.category_slug
    from public.article_categories link
    where link.article_id = target_article and link.category_slug <> main_slug
    order by link.category_slug
  );
$$;

create function public.articles_set_category_slugs()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.category_slugs := public.article_category_slugs(new.id, new.category_slug);
  return new;
end;
$$;

create trigger articles_set_category_slugs
  before insert or update on public.articles
  for each row execute function public.articles_set_category_slugs();

create function public.article_categories_refresh_article()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- OLD is null on insert and NEW on delete; the articles trigger recomputes the list.
  update public.articles set category_slugs = '{}'
  where id in (old.article_id, new.article_id);
  return null;
end;
$$;

create trigger article_categories_refresh_article
  after insert or update or delete on public.article_categories
  for each row execute function public.article_categories_refresh_article();

-- Fill the new column without touching updated_at (it versions image URLs and dates the sitemap).
alter table public.articles disable trigger articles_set_updated_at;
update public.articles set category_slugs = '{}';
alter table public.articles enable trigger articles_set_updated_at;

-- The view's `select *` was expanded when it was created; recreate it to include the new column.
create or replace view public.published_articles
with (security_invoker = true)
as
select *
from public.articles
where status in ('published', 'scheduled') and publish_at <= now();

-- Guards ---------------------------------------------------------------------------------------

-- Article addresses contain the main category: a slug changes only while no article is listed in
-- the category, so published links never break.
create function public.categories_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.slug = 'events' and (tg_op = 'DELETE' or new.slug <> old.slug) then
    raise exception 'The events category belongs to the events section and stays as it is';
  end if;
  if tg_op = 'UPDATE' and new.slug <> old.slug
    and exists (select 1 from public.articles a where a.category_slugs @> array[old.slug]) then
    raise exception 'Category "%" has articles; its slug cannot change', old.slug;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger categories_guard
  before update or delete on public.categories
  for each row execute function public.categories_guard();

-- Admin actions --------------------------------------------------------------------------------

-- Saves the order of the list in /admin/categories in one statement.
create function public.reorder_categories(slugs text[])
returns void
language sql
set search_path = ''
as $$
  update public.categories c
  set sort_order = ordered.position
  from unnest(slugs) with ordinality as ordered (slug, position)
  where c.slug = ordered.slug;
$$;

-- Deletes a category. With move_to, every article listed in it moves there first (main and
-- secondary), all in one transaction. Both run with the caller's rights: only admins get past the
-- categories policies.
create function public.delete_category(category text, move_to text default null)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if move_to is not null then
    if move_to = category then
      raise exception 'Articles must move to another category';
    end if;
    -- An article moving to a category it was already secondary in now has it as its main one.
    delete from public.article_categories link
    using public.articles a
    where a.id = link.article_id and a.category_slug = category and link.category_slug = move_to;
    -- Secondary links follow, unless the article is already in move_to.
    delete from public.article_categories link
    where link.category_slug = category
      and (
        exists (select 1 from public.articles a where a.id = link.article_id and a.category_slug = move_to)
        or exists (
          select 1 from public.article_categories other
          where other.article_id = link.article_id and other.category_slug = move_to
        )
      );
    update public.article_categories set category_slug = move_to where category_slug = category;
    update public.articles set category_slug = move_to where category_slug = category;
  end if;
  delete from public.categories where slug = category;
  if not found then
    raise exception 'Category "%" not found', category;
  end if;
end;
$$;

revoke execute on function public.reorder_categories(text[]) from public, anon;
revoke execute on function public.delete_category(text, text) from public, anon;
grant execute on function public.reorder_categories(text[]) to authenticated;
grant execute on function public.delete_category(text, text) to authenticated;

-- Search ---------------------------------------------------------------------------------------

-- Loads pg_trgm in this session, so the function below may store its setting (as in
-- 20261005000100_search.sql, where the trigram index did this).
select extensions.word_similarity('', '');

-- As in 20261005000100_search.sql, except that the category filter also finds articles listed in
-- the category as a secondary one.
create or replace function public.search_content(
  q text default null,
  category text default null,
  tag text default null,
  result_limit integer default 10,
  result_offset integer default 0
)
returns table (
  type text,
  id uuid,
  slug text,
  title text,
  excerpt text,
  cover_path text,
  cover_alt text,
  publish_at timestamptz,
  updated_at timestamptz,
  category_slug text,
  subject text,
  registration_deadline date,
  level_text text,
  author_name text,
  event_type text,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  price_text text,
  is_featured boolean,
  rank real,
  total_count bigint
)
language sql
stable
set search_path = ''
set pg_trgm.word_similarity_threshold = 0.55
as $$
  with input as (
    select phrase, public.search_tsquery(phrase) as query
    from (select nullif(left(btrim(q), 100), '') as phrase) as trimmed
  ),
  matches as (
    select
      'article'::text as type, a.id, a.slug, a.title, a.excerpt, a.cover_path, a.cover_alt,
      a.publish_at, a.updated_at, a.category_slug, a.subject, a.registration_deadline,
      a.level_text, a.author_name, null::text as event_type, null::timestamptz as starts_at,
      null::timestamptz as ends_at, null::text as location, null::text as price_text, a.is_featured,
      a.search_vector
    from public.published_articles a
    where (search_content.category is null or a.category_slugs @> array[search_content.category])
      and (
        search_content.tag is null
        or exists (
          select 1 from public.article_tags link
          where link.article_id = a.id and link.tag_slug = search_content.tag
        )
      )
    union all
    select
      'event', e.id, e.slug, e.title, e.excerpt, e.cover_path, e.cover_alt, e.publish_at,
      e.updated_at, null, null, null, null, null, e.event_type, e.starts_at, e.ends_at,
      e.location, e.price_text, e.is_featured, e.search_vector
    from public.published_events e
    where (search_content.category is null or search_content.category = 'events')
      and search_content.tag is null
  ),
  ranked as (
    select
      m.*,
      case
        when input.phrase is null then 0
        when m.search_vector @@ input.query
          then 1 + pg_catalog.ts_rank(m.search_vector, input.query)
            + extensions.word_similarity(input.phrase, m.title)
        else extensions.word_similarity(input.phrase, m.title)
      end::real as rank
    from matches m
    cross join input
    where input.phrase is null
      or m.search_vector @@ input.query
      or input.phrase operator(extensions.<%) m.title
  )
  select
    type, id, slug, title, excerpt, cover_path, cover_alt, publish_at, updated_at, category_slug,
    subject, registration_deadline, level_text, author_name, event_type, starts_at, ends_at,
    location, price_text, is_featured, rank, count(*) over () as total_count
  from ranked
  order by rank desc, publish_at desc, id
  limit least(greatest(result_limit, 1), 50)
  offset greatest(result_offset, 0);
$$;
