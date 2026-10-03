-- Site search (/search): one ranked list of published articles and events, plus popular tags.

-- Events get the search setup articles have had since the first migration: a weighted 'simple'
-- tsvector (title A, excerpt B) with a GIN index, and a trigram index on the title.
alter table public.events
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('simple'::regconfig, coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple'::regconfig, coalesce(excerpt, '')), 'B')
  ) stored;

create index events_search_idx on public.events using gin (search_vector);
create index events_title_trgm_idx on public.events using gin (title extensions.gin_trgm_ops);

-- select * was expanded when the view was created; recreate it so it includes search_vector.
create or replace view public.published_events
with (security_invoker = true)
as
select *
from public.events
where status in ('published', 'scheduled') and publish_at <= now();

-- The words of a query as the 'simple' parser splits them, ANDed, the last one as a prefix
-- because the reader may still be typing it: "улсын олимп" -> 'улсын' & 'олимп':*.
-- Hyphenated words count by their parts, so "math-olymp" finds "math-olympiad".
create function public.search_tsquery(q text)
returns tsquery
language sql
stable
set search_path = ''
as $$
  with words as (
    select token.lexemes[1] as word, token.position
    from pg_catalog.ts_debug('simple'::regconfig, coalesce(q, ''))
      with ordinality as token(alias, description, token, dictionaries, dictionary, lexemes, position)
    where token.lexemes[1] is not null
      and token.alias not in ('asciihword', 'hword', 'numhword')
  )
  select pg_catalog.to_tsquery(
    'simple'::regconfig,
    string_agg(
      pg_catalog.quote_literal(word)
        || case when position = (select max(position) from words) then ':*' else '' end,
      ' & ' order by position
    )
  )
  from words;
$$;

-- Published articles and events matching q, best first. Full-text matches (title, excerpt) rank
-- above trigram matches on the title alone, which catch typos and word forms the prefix misses
-- ("олимпад" finds "Олимпиадын"). Without q, the filters alone list matches, newest first.
-- category = 'events' searches events only; a tag searches articles only (events have no tags).
-- total_count is the number of matches before limit/offset, repeated on every row.
create function public.search_content(
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
-- 0.55 instead of pg_trgm's 0.6 catches inflected words ("тэтгэлгийн хөтөлбөр" finds "тэтгэлэгт
-- хөтөлбөрүүд" at 0.58) and still leaves out titles sharing one word of two ("физик олимпиад"
-- against a maths olympiad, 0.53). Supabase lets this be stored only once pg_trgm is loaded in the
-- session, which the trigram index at the top of this file does.
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
    where (search_content.category is null or a.category_slug = search_content.category)
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

-- Tags with the most published articles, for the search page before anything is typed.
create function public.popular_tags(tag_limit integer default 12)
returns table (slug text, label text, article_count bigint)
language sql
stable
set search_path = ''
as $$
  select t.slug, t.label, count(*) as article_count
  from public.tags t
  join public.article_tags link on link.tag_slug = t.slug
  join public.published_articles a on a.id = link.article_id
  group by t.slug, t.label
  order by article_count desc, t.label
  limit least(greatest(tag_limit, 1), 50);
$$;

-- Readers search with the anon key. The functions run with the caller's rights (security
-- invoker), so RLS and the published_* views decide what can be found.
revoke execute on function public.search_tsquery(text) from public;
revoke execute on function public.search_content(text, text, text, integer, integer) from public;
revoke execute on function public.popular_tags(integer) from public;
grant execute on function public.search_tsquery(text) to anon, authenticated, service_role;
grant execute on function public.search_content(text, text, text, integer, integer)
  to anon, authenticated, service_role;
grant execute on function public.popular_tags(integer) to anon, authenticated, service_role;
