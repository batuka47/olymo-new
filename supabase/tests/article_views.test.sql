-- View counting: only the service role can count, only visible articles are counted, and a view
-- does not change updated_at. Run with `npm run db:test`. Everything is rolled back.
begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

insert into public.articles (id, slug, title, category_slug, status, publish_at, updated_at) values
  ('00000000-0000-0000-0000-0000000000f1', 'views-live', 'Live', 'education', 'published', now() - interval '1 day', '2026-01-01'),
  ('00000000-0000-0000-0000-0000000000f2', 'views-draft', 'Draft', 'education', 'draft', null, '2026-01-01'),
  ('00000000-0000-0000-0000-0000000000f3', 'views-future', 'Future', 'education', 'scheduled', now() + interval '1 day', '2026-01-01');

set local role anon;
select throws_ok(
  $$select public.record_article_view('00000000-0000-0000-0000-0000000000f1')$$,
  '42501', null, 'anon cannot call record_article_view'
);
reset role;

set local role authenticated;
select throws_ok(
  $$select public.record_article_view('00000000-0000-0000-0000-0000000000f1')$$,
  '42501', null, 'signed-in users cannot call record_article_view'
);
reset role;

set local role service_role;
select public.record_article_view('00000000-0000-0000-0000-0000000000f1');
select public.record_article_view('00000000-0000-0000-0000-0000000000f1');
select public.record_article_view('00000000-0000-0000-0000-0000000000f2');
select public.record_article_view('00000000-0000-0000-0000-0000000000f3');
reset role;

select is((select view_count from public.articles where slug = 'views-live'), 2, 'published article counts every view');
select is((select view_count from public.articles where slug = 'views-draft'), 0, 'draft is not counted');
select is((select view_count from public.articles where slug = 'views-future'), 0, 'scheduled article before publish_at is not counted');
select is(
  (select updated_at from public.articles where slug = 'views-live'),
  '2026-01-01'::timestamptz,
  'a view does not change updated_at'
);

update public.articles set title = 'Live, edited' where slug = 'views-live';
select is((select updated_at from public.articles where slug = 'views-live'), now(), 'an edit still sets updated_at');
select is((select view_count from public.articles where slug = 'views-live'), 2, 'an edit keeps view_count');

select * from finish();
rollback;
