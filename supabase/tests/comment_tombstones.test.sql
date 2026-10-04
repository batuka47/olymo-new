-- Deleting comments others answered: they become tombstones and the replies stay; everything
-- else is deleted. Run with `npm run db:test`. Everything is rolled back.
begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at) values
  ('00000000-0000-0000-0000-0000000008a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tomb-author@test.local', now(), now()),
  ('00000000-0000-0000-0000-0000000008a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tomb-replier@test.local', now(), now()),
  ('00000000-0000-0000-0000-0000000008a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tomb-third@test.local', now(), now());

insert into public.articles (id, slug, title, category_slug, status, publish_at) values
  ('00000000-0000-0000-0000-0000000008b1', 'tombstones', 'Tombstones', 'education', 'published', now() - interval '1 day');

-- Set up as the owner (no user): the API rules do not apply, author names are filled in.
insert into public.comments (id, article_id, user_id, body, parent_id) values
  -- the author's comments: answered by others, not answered, a reply in someone else's thread,
  -- and one answered only by the author
  ('00000000-0000-0000-0000-0000000008c1', '00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008a1', 'Хариулттай', null),
  ('00000000-0000-0000-0000-0000000008c2', '00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008a1', 'Хариултгүй', null),
  ('00000000-0000-0000-0000-0000000008c3', '00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008a2', 'Хоёрдугаарын сэдэв', null),
  ('00000000-0000-0000-0000-0000000008c4', '00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008a1', 'Өөртөө хариулсан', null),
  -- the replier's comments, for deleting one at a time
  ('00000000-0000-0000-0000-0000000008c5', '00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008a2', 'Устгах хариулттай', null),
  ('00000000-0000-0000-0000-0000000008c6', '00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008a2', 'Устгах хариултгүй', null);
insert into public.comments (id, article_id, user_id, body, parent_id) values
  ('00000000-0000-0000-0000-0000000008d1', '00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008a2', 'Хариулт 1', '00000000-0000-0000-0000-0000000008c1'),
  ('00000000-0000-0000-0000-0000000008d3', '00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008a1', 'Зохиогчийн хариулт', '00000000-0000-0000-0000-0000000008c3'),
  ('00000000-0000-0000-0000-0000000008d4', '00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008a1', 'Өөрийн хариулт', '00000000-0000-0000-0000-0000000008c4'),
  ('00000000-0000-0000-0000-0000000008d5', '00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008a3', 'Гуравдугаарын хариулт', '00000000-0000-0000-0000-0000000008c5');
insert into public.comment_reports (comment_id, user_id) values
  ('00000000-0000-0000-0000-0000000008c1', '00000000-0000-0000-0000-0000000008a3');

-- A reader deletes their own comments ---------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008a2","role":"authenticated"}', true);
delete from public.comments where id = '00000000-0000-0000-0000-0000000008c5';
delete from public.comments where id = '00000000-0000-0000-0000-0000000008c6';
select throws_like(
  $$insert into public.comments (article_id, user_id, body, parent_id)
    values ('00000000-0000-0000-0000-0000000008b1', '00000000-0000-0000-0000-0000000008a2', 'Булшинд', '00000000-0000-0000-0000-0000000008c5')$$,
  '%comments_bad_parent%', 'nobody replies to a tombstone'
);
select throws_ok(
  $$update public.comments set deleted_at = now() where id = '00000000-0000-0000-0000-0000000008c3'$$,
  '42501', null, 'a reader cannot make a tombstone by hand'
);
reset role;

select ok(
  (select deleted_at is not null and body = '' and user_id is null and author_name = '' and status = 'visible'
   from public.comments where id = '00000000-0000-0000-0000-0000000008c5'),
  'deleting an answered comment leaves a tombstone: no text, no author'
);
select ok(
  exists (select 1 from public.comments where id = '00000000-0000-0000-0000-0000000008d5'),
  '…and the reply under it stays'
);
select ok(
  not exists (select 1 from public.comments where id = '00000000-0000-0000-0000-0000000008c6'),
  'deleting an unanswered comment deletes it'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select results_eq(
  $$select body, deleted, is_own from public.article_comments('00000000-0000-0000-0000-0000000008b1') where id = '00000000-0000-0000-0000-0000000008c5'$$,
  $$values (''::text, true, false)$$,
  'visitors see the tombstone, marked deleted, with nothing in it'
);
select results_eq(
  $$select body from public.article_comments('00000000-0000-0000-0000-0000000008b1') where parent_id = '00000000-0000-0000-0000-0000000008c5'$$,
  $$values ('Гуравдугаарын хариулт'::text)$$,
  '…with the reply under it'
);
select is(
  public.article_comment_count('00000000-0000-0000-0000-0000000008b1'), 8,
  'tombstones are not counted'
);
reset role;

-- The last reply under a tombstone goes: so does the tombstone.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000008a3","role":"authenticated"}', true);
delete from public.comments where id = '00000000-0000-0000-0000-0000000008d5';
reset role;
select ok(
  not exists (select 1 from public.comments where id = '00000000-0000-0000-0000-0000000008c5'),
  'a tombstone without replies is removed'
);

-- The author deletes their account ------------------------------------------------------------------
delete from auth.users where id = '00000000-0000-0000-0000-0000000008a1';

select ok(
  (select deleted_at is not null and user_id is null and body = '' from public.comments where id = '00000000-0000-0000-0000-0000000008c1'),
  'account deleted: a comment others answered becomes a tombstone'
);
select ok(
  exists (select 1 from public.comments where id = '00000000-0000-0000-0000-0000000008d1' and body = 'Хариулт 1'),
  '…and the other reader''s reply stays'
);
select is(
  (select count(*) from public.comment_reports where comment_id = '00000000-0000-0000-0000-0000000008c1'),
  0::bigint, '…its reports go with its text'
);
select ok(
  not exists (select 1 from public.comments where id = '00000000-0000-0000-0000-0000000008c2'),
  'an unanswered comment goes'
);
select ok(
  not exists (select 1 from public.comments where id = '00000000-0000-0000-0000-0000000008d3'),
  'a reply in someone else''s thread goes'
);
select ok(
  exists (select 1 from public.comments where id = '00000000-0000-0000-0000-0000000008c3' and deleted_at is null),
  '…and that thread is untouched'
);
select ok(
  not exists (select 1 from public.comments where id in ('00000000-0000-0000-0000-0000000008c4', '00000000-0000-0000-0000-0000000008d4')),
  'a comment answered only by its own author goes with that reply'
);
select is(
  (select count(*) from public.comments where user_id = '00000000-0000-0000-0000-0000000008a1'),
  0::bigint, 'nothing is left in the deleted reader''s name'
);
select is(
  (select count(*) from public.comments where deleted_at is not null and article_id = '00000000-0000-0000-0000-0000000008b1'),
  1::bigint, 'one tombstone in all'
);

-- Staff still delete whole threads.
delete from public.comments where id = '00000000-0000-0000-0000-0000000008c3';
select ok(
  not exists (select 1 from public.comments where parent_id = '00000000-0000-0000-0000-0000000008c3'),
  'a delete without a reader''s session (staff tools, SQL) removes the thread'
);

select * from finish();
rollback;
