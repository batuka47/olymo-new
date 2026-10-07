-- Categories managed in /admin/categories: only admins write them; secondary categories keep each
-- article's category_slugs; slugs and the events row are guarded; delete_category moves articles.
-- Run with `npm run db:test`. Everything is rolled back.
begin;

create extension if not exists pgtap with schema extensions;
select plan(31);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-cat-editor@test.local', now(), now()),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-cat-admin@test.local', now(), now());
update public.profiles set role = 'editor' where id = '00000000-0000-0000-0000-0000000000e1';
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';

-- The migration keeps the seven categories and moves the olympiad checks into a column.
select ok(
  (select array_agg(slug order by sort_order) from public.categories)
    = array['education', 'olympiad', 'world', 'sports', 'technology', 'science', 'events'],
  'the 7 categories keep their slugs and order'
);
select ok(
  (select array_agg(slug) from public.categories where has_olympiad_fields) = array['olympiad'],
  'only olympiad has the olympiad fields'
);
select ok(
  (select bool_and(show_in_nav and is_active) from public.categories),
  'every existing category stays in the menu and active'
);
select ok(
  not (select bool_or(show_on_home) from public.categories),
  'no category is ticked for the home page at first (the automatic rule applies)'
);

insert into public.articles (id, slug, title, category_slug, status, publish_at) values
  ('00000000-0000-0000-0000-00000000c001', 'cat-main', 'Main', 'science', 'published', now() - interval '1 hour'),
  ('00000000-0000-0000-0000-00000000c002', 'cat-other', 'Other', 'world', 'published', now() - interval '1 hour');

-- Secondary categories ---------------------------------------------------------------------------
select ok(
  (select category_slugs from public.articles where slug = 'cat-main') = array['science'],
  'a new article is listed in its main category'
);
insert into public.article_categories (article_id, category_slug) values
  ('00000000-0000-0000-0000-00000000c001', 'technology'),
  ('00000000-0000-0000-0000-00000000c001', 'education');
select ok(
  (select category_slugs from public.articles where slug = 'cat-main')
    = array['science', 'education', 'technology'],
  'secondary categories follow the main one'
);
update public.articles set category_slug = 'education' where slug = 'cat-main';
select ok(
  (select category_slugs from public.articles where slug = 'cat-main') = array['education', 'technology'],
  'a secondary category that becomes the main one is listed once'
);
delete from public.article_categories
  where article_id = '00000000-0000-0000-0000-00000000c001' and category_slug = 'technology';
select ok(
  (select category_slugs from public.articles where slug = 'cat-main') = array['education'],
  'removing a secondary category takes it off the list'
);
select throws_ok(
  $$insert into public.articles (slug, title, category_slug) values ('in-events', 'X', 'events')$$,
  '23514', null, 'an article cannot be filed under events'
);
select throws_ok(
  $$insert into public.article_categories (article_id, category_slug) values ('00000000-0000-0000-0000-00000000c002', 'events')$$,
  '23514', null, 'events cannot be a secondary category either'
);
select ok(
  exists (select 1 from public.search_content(null, 'technology') where slug = 'cat-other') = false
    and exists (select 1 from public.search_content(null, 'world') where slug = 'cat-other'),
  'search filters by category'
);
insert into public.article_categories (article_id, category_slug) values ('00000000-0000-0000-0000-00000000c002', 'sports');
select ok(
  exists (select 1 from public.search_content(null, 'sports') where slug = 'cat-other'),
  'the search category filter finds secondary categories'
);

-- anon and editors read, editors cannot write categories ----------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select ok(
  (select count(*) from public.article_categories where article_id = '00000000-0000-0000-0000-00000000c002') = 1,
  'anon: reads secondary categories of published articles'
);
select throws_ok(
  $$insert into public.categories (slug, label) values ('anon-cat', 'X')$$,
  '42501', null, 'anon: cannot add categories'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
select throws_ok(
  $$insert into public.categories (slug, label) values ('editor-cat', 'X')$$,
  '42501', null, 'editor: cannot add categories'
);
with changed as (update public.categories set label = 'X' where slug = 'world' returning 1)
select ok((select count(*) from changed) = 0, 'editor: cannot rename categories');
with removed as (delete from public.categories where slug = 'sports' returning 1)
select ok((select count(*) from removed) = 0, 'editor: cannot delete categories');
insert into public.article_categories (article_id, category_slug) values ('00000000-0000-0000-0000-00000000c002', 'science');
select ok(
  (select category_slugs from public.articles where slug = 'cat-other') = array['world', 'science', 'sports'],
  'editor: sets secondary categories on an article'
);

-- admins write categories ------------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.categories (slug, label, sort_order) values ('urlag', 'Урлаг', 8), ('soyol', 'Соёл', 9)$$,
  'admin: adds categories'
);
select throws_ok(
  $$insert into public.categories (slug, label) values ('Урлаг', 'Урлаг')$$,
  '23514', null, 'a slug must be Latin kebab-case'
);
select lives_ok($$update public.categories set slug = 'urlag-soyol' where slug = 'urlag'$$, 'admin: renames the slug of an unused category');
select throws_ok(
  $$update public.categories set slug = 'shinjleh-ukhaan' where slug = 'science'$$,
  'P0001', 'Category "science" has articles; its slug cannot change', 'the slug of a category in use is fixed'
);
select throws_ok(
  $$update public.categories set slug = 'arga-hemjee' where slug = 'events'$$,
  'P0001', null, 'the events slug is fixed'
);
select throws_ok($$delete from public.categories where slug = 'events'$$, 'P0001', null, 'events cannot be deleted');
select throws_ok($$delete from public.categories where slug = 'world'$$, '23503', null, 'a category in use cannot be deleted');
select throws_ok($$select public.delete_category('sports')$$, '23503', null, 'nor one only used as a secondary category');

select lives_ok($$select public.reorder_categories(array['soyol', 'urlag-soyol'])$$, 'admin: reorders categories');
select ok(
  (select array_agg(slug order by sort_order, slug) from public.categories where slug in ('soyol', 'urlag-soyol'))
    = array['soyol', 'urlag-soyol'],
  'the new order is saved'
);

-- Move and delete: cat-other (main world; secondary science, sports) moves out of sports, then
-- out of world into science, which it was already listed in.
select lives_ok($$select public.delete_category('sports', 'urlag-soyol')$$, 'admin: moves a secondary category and deletes it');
select lives_ok($$select public.delete_category('world', 'science')$$, 'admin: moves articles and deletes a category');
select ok(
  (select category_slug = 'science' and category_slugs = array['science', 'urlag-soyol'] from public.articles where slug = 'cat-other')
    and not exists (select 1 from public.categories where slug in ('sports', 'world')),
  'moved articles keep every other category, each listed once'
);

select * from finish();
rollback;
