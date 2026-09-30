-- Row level security, triggers and constraints, tested as anon, reader, editor and admin.
-- Run with `npm run db:test` (local Supabase must be running). Everything is rolled back.
begin;

create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Test users: the signup trigger must create reader profiles.
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reader@test.local', '{"display_name":"Уншигч"}', now(), now()),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'editor@test.local', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.local', '{}', now(), now());

select ok((select count(*) from public.profiles where role = 'reader' and id::text like '00000000-%') = 3, 'signup trigger creates reader profiles');
select ok((select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Уншигч', 'display_name taken from signup metadata');
select ok((select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'editor', 'display_name falls back to email name');

update public.profiles set role = 'editor' where id = '00000000-0000-0000-0000-00000000000b';
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000c';

-- Hidden content that the public must not see.
insert into public.articles (slug, title, category_slug, status) values ('test-draft', 'Draft', 'education', 'draft');
insert into public.articles (slug, title, category_slug, status, publish_at) values ('test-future', 'Future', 'education', 'published', now() + interval '1 day');
-- Scheduled content: hidden until publish_at, then public without any status change.
insert into public.articles (slug, title, category_slug, status, publish_at) values
  ('test-scheduled-future', 'Scheduled future', 'education', 'scheduled', now() + interval '1 day'),
  ('test-scheduled-past', 'Scheduled past', 'education', 'scheduled', now() - interval '1 hour');
insert into public.events (slug, title, starts_at, status, publish_at) values
  ('test-event-scheduled-future', 'Scheduled future', now() + interval '30 days', 'scheduled', now() + interval '1 day'),
  ('test-event-scheduled-past', 'Scheduled past', now() + interval '30 days', 'scheduled', now() - interval '1 hour');
select id as draft_id from public.articles where slug = 'test-draft' \gset
insert into public.ads (title, image_path, link_url, placement, starts_at, ends_at) values ('Expired', 'x.webp', 'https://example.com', 'home_2', now() - interval '10 days', now() - interval '1 day');
insert into public.ads (title, image_path, link_url, placement, is_active) values ('Inactive', 'x.webp', 'https://example.com', 'home_3', false);
insert into public.submissions (kind, first_name, email, message) values ('contact', 'Бат', 'bat@test.local', 'Сайн байна уу');

select ok((select count(*) from public.published_articles) = 7, 'view hides draft and future articles (as owner)');
select ok((select count(*) from public.published_events) = 3, 'events view hides future scheduled event (as owner)');

-- anon ----------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select ok((select count(*) from public.articles) = 7, 'anon: only published/scheduled, due articles');
select ok((select count(*) from public.published_articles) = 7, 'anon: published_articles view');
select ok(not exists (select 1 from public.articles where slug = 'test-scheduled-future'), 'anon: scheduled article with future publish_at is invisible');
select ok(exists (select 1 from public.articles where slug = 'test-scheduled-past'), 'anon: scheduled article with past publish_at is visible');
select ok(exists (select 1 from public.published_articles where slug = 'test-scheduled-past'), 'anon: published_articles includes due scheduled article');
select ok(not exists (select 1 from public.articles where slug in ('test-draft', 'test-future')), 'anon: draft and future published articles are invisible');
select ok((select count(*) from public.categories) = 7, 'anon: reads 7 categories');
select ok((select count(*) from public.site_pages) = 5, 'anon: reads site pages');
select ok(exists (select 1 from public.site_pages where slug = 'editorial-policy'), 'anon: site page slug is editorial-policy');
select ok((select count(*) from public.events) = 3, 'anon: reads published/scheduled, due events');
select ok(not exists (select 1 from public.events where slug = 'test-event-scheduled-future'), 'anon: scheduled event with future publish_at is invisible');
select ok(exists (select 1 from public.published_events where slug = 'test-event-scheduled-past'), 'anon: scheduled event with past publish_at is visible');
select ok((select count(*) from public.ads) = 1, 'anon: only running ads');
select ok((select count(*) from public.article_tags) = 3, 'anon: tags of visible articles');
select ok((select count(*) from public.submissions) = 0, 'anon: cannot read submissions');
select ok((select count(*) from public.profiles) = 0, 'anon: cannot read profiles');
select throws_ok($$insert into public.submissions (kind, first_name, email, message) values ('contact', 'X', 'x@test.local', 'hi')$$, '42501', null, 'anon: cannot insert submissions');
select throws_ok($$insert into public.comments (article_id, user_id, body) select id, '00000000-0000-0000-0000-00000000000a', 'hi' from public.articles limit 1$$, '42501', null, 'anon: cannot comment');
select throws_ok($$insert into public.articles (slug, title, category_slug) values ('anon-x', 'X', 'education')$$, '42501', null, 'anon: cannot insert articles');

-- reader --------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select ok((select count(*) from public.articles) = 7, 'reader: only published/scheduled, due articles');
select ok((select count(*) from public.profiles) = 1, 'reader: sees only own profile');
insert into public.comments (article_id, user_id, body)
  select id, '00000000-0000-0000-0000-00000000000a', 'Сайхан мэдээ' from public.articles where slug = 'esh-2027-shalgaltyn-huvaar';
select ok((select count(*) from public.comments) = 1, 'reader: comments as self');
select throws_ok($$insert into public.comments (article_id, user_id, body) select id, '00000000-0000-0000-0000-00000000000b', 'x' from public.articles limit 1$$, '42501', null, 'reader: cannot comment as someone else');
select throws_ok($$insert into public.comments (article_id, user_id, body, status) select id, '00000000-0000-0000-0000-00000000000a', 'x', 'hidden' from public.articles limit 1$$, '42501', null, 'reader: cannot insert with a custom status');
select throws_ok(format($$insert into public.comments (article_id, user_id, body) values (%L, '00000000-0000-0000-0000-00000000000a', 'x')$$, :'draft_id'), '42501', null, 'reader: cannot comment on a draft');
update public.comments set body = 'Засварласан' where user_id = '00000000-0000-0000-0000-00000000000a';
select ok((select body from public.comments limit 1) = 'Засварласан', 'reader: edits own comment');
select throws_ok($$update public.comments set status = 'hidden'$$, '42501', null, 'reader: cannot change comment status');
select throws_ok($$update public.comments set report_count = 5$$, '42501', null, 'reader: cannot change report_count');
update public.profiles set display_name = 'Шинэ нэр' where id = '00000000-0000-0000-0000-00000000000a';
select ok((select display_name from public.profiles) = 'Шинэ нэр', 'reader: edits own display_name');
select throws_ok($$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a'$$, '42501', null, 'reader: cannot promote self');
select throws_ok($$insert into public.articles (slug, title, category_slug) values ('reader-x', 'X', 'education')$$, '42501', null, 'reader: cannot insert articles');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('media', 'reader.webp')$$, '42501', null, 'reader: cannot upload media');

-- editor --------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

select ok(public.is_staff() and not public.is_admin(), 'editor: is_staff() true, is_admin() false');
select ok((select count(*) from public.articles) = 10, 'editor: sees drafts and future items');
select ok((select count(*) from public.published_articles) = 7, 'editor: view still shows only public articles');
select ok((select count(*) from public.events) = 4, 'editor: sees future scheduled events');
select ok((select count(*) from public.ads) = 3, 'editor: sees all ads');
insert into public.articles (slug, title, category_slug) values ('editor-draft', 'Editor draft', 'science');
update public.articles set is_featured = true where slug = 'editor-draft';
delete from public.articles where slug = 'editor-draft';
select ok(true, 'editor: insert, update, delete articles');
update public.comments set status = 'hidden';
select ok((select status from public.comments limit 1) = 'hidden', 'editor: hides comments');
select ok((select count(*) from public.submissions) = 0, 'editor: cannot read submissions');
with changed as (update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a' returning 1)
select ok((select count(*) from changed) = 0, 'editor: cannot change another profile');
insert into storage.objects (bucket_id, name) values ('media', 'editor-test.webp');
select ok(true, 'editor: uploads media');

-- admin ---------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);

select ok((select count(*) from public.submissions) = 1, 'admin: reads submissions');
update public.submissions set status = 'done', admin_note = 'Хариулсан';
select ok((select status from public.submissions limit 1) = 'done', 'admin: updates submissions');
update public.profiles set role = 'editor' where id = '00000000-0000-0000-0000-00000000000a';
select ok((select role from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'editor', 'admin: changes roles');

-- constraints, search, storage config ------------------------------------------
reset role;
select throws_ok($$insert into public.articles (slug, title, category_slug, excerpt) values ('long', 'X', 'education', repeat('а', 201))$$, '23514', null, 'excerpt longer than 200 is rejected');
select throws_ok($$insert into public.articles (slug, title, category_slug, status) values ('no-date', 'X', 'education', 'published')$$, '23514', null, 'published without publish_at is rejected');
select throws_ok($$insert into public.articles (slug, title, category_slug) values ('Bad Slug', 'X', 'education')$$, '23514', null, 'non-kebab slug is rejected');
select throws_ok($$insert into public.comments (article_id, user_id, body) select id, '00000000-0000-0000-0000-00000000000a', repeat('а', 1001) from public.articles limit 1$$, '23514', null, 'comment longer than 1000 is rejected');
select throws_ok($$insert into public.submissions (kind, first_name, message) values ('contact', 'X', 'hi')$$, '23514', null, 'submission without phone or email is rejected');
select ok(
  (select count(*) from public.articles where search_vector @@ to_tsquery('simple', 'олимпиад:*')) >= 1,
  'full-text: prefix search finds "олимпиад"'
);
select ok(
  (select title from public.articles order by similarity(title, 'матиматикийн олимпяд') desc limit 1) like '%Математикийн%',
  'trigram: typo "матиматикийн олимпяд" ranks the math article first'
);
select ok(
  (select public and file_size_limit = 5242880 and allowed_mime_types = array['image/webp','image/jpeg','image/png'] from storage.buckets where id = 'media'),
  'media bucket: public, 5 MB, webp/jpeg/png'
);
select ok(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity) = 0,
  'RLS enabled on every public table'
);

select * from finish();
rollback;
