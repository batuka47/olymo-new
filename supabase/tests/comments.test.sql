-- Comments as readers write them through the API: what the database itself allows. Readers have
-- their own token, so these rules hold even without the site's server actions.
-- Run with `npm run db:test`. Everything is rolled back.
begin;

create extension if not exists pgtap with schema extensions;
select plan(27);

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-0000000007a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reader-one@test.local', '{"full_name":"Google Нэр"}', now(), now()),
  ('00000000-0000-0000-0000-0000000007a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reader-two@test.local', '{"name":"Хоёрдугаар"}', now(), now()),
  ('00000000-0000-0000-0000-0000000007a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'banned.reader@test.local', '{}', now(), now());

select is((select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000007a1'), 'Google Нэр', 'display name from Google full_name');
select is((select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000007a2'), 'Хоёрдугаар', 'display name from Google name');
select is((select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000007a3'), 'banned.reader', 'display name from the email');

update public.profiles set banned = true where id = '00000000-0000-0000-0000-0000000007a3';

insert into public.articles (id, slug, title, category_slug, status, publish_at, comments_closed) values
  ('00000000-0000-0000-0000-0000000007b1', 'comments-open', 'Open', 'education', 'published', now() - interval '1 day', false),
  ('00000000-0000-0000-0000-0000000007b2', 'comments-closed', 'Closed', 'education', 'published', now() - interval '1 day', true);

-- reader one -------------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000007a1","role":"authenticated"}', true);

select throws_ok(
  $$insert into public.comments (article_id, user_id, body) values ('00000000-0000-0000-0000-0000000007b1', '00000000-0000-0000-0000-0000000007a2', 'Өөр хүний нэрээр')$$,
  '42501', null, 'cannot comment as someone else'
);
select lives_ok(
  $$insert into public.comments (id, article_id, user_id, body, status, held, report_count)
    values ('00000000-0000-0000-0000-0000000007c1', '00000000-0000-0000-0000-0000000007b1', '00000000-0000-0000-0000-0000000007a1', 'Сайхан мэдээ', 'hidden', true, 99)$$,
  'comments as themselves'
);
select ok(
  (select status = 'visible' and not held and report_count = 0 from public.comments where id = '00000000-0000-0000-0000-0000000007c1'),
  'status, held and report count are set by the database, not the reader'
);
select throws_like(
  $$insert into public.comments (article_id, user_id, body) values ('00000000-0000-0000-0000-0000000007b1', '00000000-0000-0000-0000-0000000007a1', 'Хоёр дахь')$$,
  '%comments_rate_limited%', 'one comment per 30 seconds'
);
select throws_like(
  $$insert into public.comments (article_id, user_id, body) values ('00000000-0000-0000-0000-0000000007b2', '00000000-0000-0000-0000-0000000007a1', 'Хаалттай')$$,
  '%comments_closed%', 'not on an article with comments closed'
);
select lives_ok(
  $$update public.comments set body = 'Засварласан' where id = '00000000-0000-0000-0000-0000000007c1'$$,
  'edits own comment within 15 minutes'
);
select ok(
  (select edited_at is not null from public.comments where id = '00000000-0000-0000-0000-0000000007c1'),
  'an edit is marked'
);
select throws_ok(
  $$update public.comments set status = 'hidden' where id = '00000000-0000-0000-0000-0000000007c1'$$,
  '42501', null, 'cannot change the status'
);
select throws_ok(
  $$update public.profiles set banned = true where id = '00000000-0000-0000-0000-0000000007a1'$$,
  '42501', null, 'cannot ban'
);
update public.profiles set display_name = 'Шинэ нэр' where id = '00000000-0000-0000-0000-0000000007a1';
select throws_like(
  $$update public.profiles set display_name = 'Гурав дахь нэр' where id = '00000000-0000-0000-0000-0000000007a1'$$,
  '%display_name_locked%', 'the display name changes once'
);
reset role;

-- reader two -------------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000007a2","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.comments (id, article_id, user_id, body, parent_id)
    values ('00000000-0000-0000-0000-0000000007c2', '00000000-0000-0000-0000-0000000007b1', '00000000-0000-0000-0000-0000000007a2', 'Энэ новш юм', '00000000-0000-0000-0000-0000000007c1')$$,
  'replies to a comment'
);
select ok(
  (select status = 'hidden' and held from public.comments where id = '00000000-0000-0000-0000-0000000007c2'),
  'a bad word holds the comment hidden for review'
);
select is(
  (select count(*) from public.comments where id = '00000000-0000-0000-0000-0000000007c1' and body = 'Засварласан'),
  1::bigint, 'sees the other reader''s visible comment'
);
update public.comments set body = 'Хакердсан' where id = '00000000-0000-0000-0000-0000000007c1';
delete from public.comments where id = '00000000-0000-0000-0000-0000000007c1';
reset role;
select is(
  (select body from public.comments where id = '00000000-0000-0000-0000-0000000007c1'),
  'Засварласан', 'cannot edit or delete someone else''s comment'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000007a2","role":"authenticated"}', true);
select lives_ok(
  $$insert into public.comment_reports (comment_id, user_id) values ('00000000-0000-0000-0000-0000000007c1', '00000000-0000-0000-0000-0000000007a2')$$,
  'reports someone else''s comment'
);
select throws_ok(
  $$insert into public.comment_reports (comment_id, user_id) values ('00000000-0000-0000-0000-0000000007c1', '00000000-0000-0000-0000-0000000007a2')$$,
  '23505', null, 'only once'
);
select throws_ok(
  $$insert into public.comment_reports (comment_id, user_id) values ('00000000-0000-0000-0000-0000000007c2', '00000000-0000-0000-0000-0000000007a2')$$,
  '42501', null, 'not one''s own comment'
);
reset role;
select is(
  (select report_count from public.comments where id = '00000000-0000-0000-0000-0000000007c1'),
  1, 'a report counts'
);

-- A reply to a reply, and the 15 minutes, set up as the owner.
update public.comments set created_at = now() - interval '16 minutes' where id = '00000000-0000-0000-0000-0000000007c2';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000007a1","role":"authenticated"}', true);
select throws_like(
  $$insert into public.comments (article_id, user_id, body, parent_id)
    values ('00000000-0000-0000-0000-0000000007b1', '00000000-0000-0000-0000-0000000007a1', 'Гүн', '00000000-0000-0000-0000-0000000007c2')$$,
  '%comments_bad_parent%', 'replies are one level deep'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000007a2","role":"authenticated"}', true);
update public.comments set body = 'Хожуу засвар' where id = '00000000-0000-0000-0000-0000000007c2';
reset role;
select is(
  (select body from public.comments where id = '00000000-0000-0000-0000-0000000007c2'),
  'Энэ новш юм', 'no edits after 15 minutes'
);

-- banned -----------------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000007a3","role":"authenticated"}', true);
select throws_like(
  $$insert into public.comments (article_id, user_id, body) values ('00000000-0000-0000-0000-0000000007b1', '00000000-0000-0000-0000-0000000007a3', 'Хориотой')$$,
  '%comments_banned%', 'a banned reader cannot comment'
);
reset role;

-- reading ----------------------------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select results_eq(
  $$select author_name, body from public.article_comments('00000000-0000-0000-0000-0000000007b1')$$,
  $$values ('Шинэ нэр'::text, 'Засварласан'::text)$$,
  'visitors see visible comments with the author''s name, not held ones'
);
select is(public.article_comment_count('00000000-0000-0000-0000-0000000007b1'), 1, 'the count leaves held comments out');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000007a2","role":"authenticated"}', true);
select results_eq(
  $$select body, hidden, is_own, reported from public.article_comments('00000000-0000-0000-0000-0000000007b1')$$,
  $$values ('Засварласан'::text, false, false, true), ('Энэ новш юм'::text, true, true, false)$$,
  'authors also see their own held reply, marked hidden, under its comment'
);
reset role;

select * from finish();
rollback;
