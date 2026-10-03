-- Site search: what readers can find, how filters and ranking work, and popular tags.
-- Run with `npm run db:test`. Everything is rolled back.
begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

-- "Квазарлаг" is made up, so the seed data never matches it.
insert into public.articles (id, slug, title, excerpt, category_slug, status, publish_at) values
  ('00000000-0000-0000-0000-0000000005a1', 'kvz-title', 'Квазарлаг олимпиадын бүртгэл', null, 'olympiad', 'published', now() - interval '2 days'),
  ('00000000-0000-0000-0000-0000000005a2', 'kvz-excerpt', 'Шинэ судалгаа', 'Квазарлаг туршилтын дүн', 'science', 'published', now() - interval '1 day'),
  ('00000000-0000-0000-0000-0000000005a3', 'kvz-draft', 'Квазарлаг ноорог', null, 'education', 'draft', null),
  ('00000000-0000-0000-0000-0000000005a4', 'kvz-future', 'Квазарлаг ирээдүй', null, 'education', 'scheduled', now() + interval '1 day');

insert into public.events (id, slug, title, starts_at, status, publish_at) values
  ('00000000-0000-0000-0000-0000000005e1', 'kvz-event', 'Квазарлаг хакатон', now() + interval '5 days', 'published', now() - interval '1 hour'),
  ('00000000-0000-0000-0000-0000000005e2', 'kvz-event-draft', 'Квазарлаг ноорог эвент', now() + interval '5 days', 'draft', null);

insert into public.tags (slug, label) values ('kvz-tag', 'Квазар'), ('kvz-hidden', 'Нуугдсан');
insert into public.article_tags (article_id, tag_slug) values
  ('00000000-0000-0000-0000-0000000005a1', 'kvz-tag'),
  ('00000000-0000-0000-0000-0000000005a2', 'kvz-tag'),
  ('00000000-0000-0000-0000-0000000005a3', 'kvz-hidden');

select is(
  public.search_tsquery('Квазарлаг олимп'),
  $$'квазарлаг' & 'олимп':*$$::tsquery,
  'query words are lowercased and ANDed, the last one as a prefix'
);

set local role anon;

select results_eq(
  $$select slug from public.search_content('квазарл') order by slug$$,
  $$values ('kvz-event'), ('kvz-excerpt'), ('kvz-title')$$,
  'a partial word finds published articles (title or excerpt) and events, nothing unpublished'
);
select is(
  (select type from public.search_content('квазарлаг хакатон') limit 1),
  'event',
  'events come back with type = event, and the full match first'
);
select is(
  (select slug from public.search_content('квазарлаг') offset 2),
  'kvz-excerpt',
  'a match in the title ranks above a match in the excerpt only'
);
select is(
  (select slug from public.search_content('квазрлаг олимпиадын') limit 1),
  'kvz-title',
  'a typo still finds the title (trigram similarity), first'
);
select ok(
  (select rank from public.search_content('квазарлаг олимпиадын') where slug = 'kvz-title')
    > (select rank from public.search_content('квазрлаг олимпиадын') where slug = 'kvz-title'),
  'a full-text match ranks above a trigram-only match'
);
select results_eq(
  $$select slug from public.search_content('квазарлаг', 'events')$$,
  $$values ('kvz-event')$$,
  'category events searches events only'
);
select results_eq(
  $$select slug from public.search_content('квазарлаг', 'science')$$,
  $$values ('kvz-excerpt')$$,
  'an article category leaves events out'
);
select results_eq(
  $$select slug from public.search_content(null, null, 'kvz-tag')$$,
  $$values ('kvz-excerpt'), ('kvz-title')$$,
  'a tag alone lists its published articles, newest first'
);
select is(
  (select count(*) from public.search_content('квазарлаг', null, 'kvz-hidden')),
  0::bigint,
  'a tag on a draft finds nothing'
);
select results_eq(
  $$select slug, total_count from public.search_content('квазарлаг', null, null, 1, 1)$$,
  $$values ('kvz-title'::text, 3::bigint)$$,
  'limit and offset page the list; total_count counts every match'
);
select is(
  (select count(*) from public.search_content('квазарлаг', null, null, 0, -5)),
  1::bigint,
  'limit and offset are clamped to sane values'
);
select results_eq(
  $$select slug, article_count from public.popular_tags() where slug like 'kvz-%'$$,
  $$values ('kvz-tag'::text, 2::bigint)$$,
  'popular tags count published articles only'
);

reset role;

select is(
  (select count(*) from public.search_content('квазарлаг') where slug like '%draft%' or slug = 'kvz-future'),
  0::bigint,
  'staff calls see published content only too'
);

select * from finish();
rollback;
