-- Info pages: team members and FAQ items are public to read and staff-only to change; site page
-- blocks must be a JSON object. Run with `npm run db:test`. Everything is rolled back.
begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at) values
  ('00000000-0000-0000-0000-0000000006a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-info-reader@test.local', now(), now()),
  ('00000000-0000-0000-0000-0000000006a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-info-editor@test.local', now(), now());
update public.profiles set role = 'editor' where id = '00000000-0000-0000-0000-0000000006a2';

insert into public.team_members (id, name, role, sort_order)
values ('00000000-0000-0000-0000-0000000006b1', 'Туршилт', 'Редактор', 0);

select throws_ok(
  $$update public.site_pages set blocks = '[]'::jsonb where slug = 'about'$$,
  '23514', null, 'site page blocks must be a JSON object'
);
select throws_ok(
  $$insert into public.faq_items (question, answer) values ('', 'Хариулт')$$,
  '23514', null, 'a FAQ item needs a question'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select ok(
  exists (select 1 from public.team_members where id = '00000000-0000-0000-0000-0000000006b1'),
  'anon: reads team members'
);
select throws_ok(
  $$insert into public.team_members (name) values ('Хакер')$$,
  '42501', null, 'anon: cannot add team members'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000006a1","role":"authenticated"}', true);
select throws_ok(
  $$insert into public.team_members (name) values ('Уншигч')$$,
  '42501', null, 'reader: cannot add team members'
);
update public.team_members set name = 'Өөрчилсөн' where id = '00000000-0000-0000-0000-0000000006b1';
select is(
  (select name from public.team_members where id = '00000000-0000-0000-0000-0000000006b1'),
  'Туршилт',
  'reader: cannot rename team members'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000006a2","role":"authenticated"}', true);
insert into public.team_members (id, name, role, sort_order)
values ('00000000-0000-0000-0000-0000000006b2', 'Шинэ гишүүн', 'Дизайнер', 1);
select ok(
  exists (select 1 from public.team_members where id = '00000000-0000-0000-0000-0000000006b2'),
  'editor: adds team members'
);
update public.team_members set role = 'Ахлах дизайнер' where id = '00000000-0000-0000-0000-0000000006b2';
select is(
  (select role from public.team_members where id = '00000000-0000-0000-0000-0000000006b2'),
  'Ахлах дизайнер',
  'editor: edits team members'
);
delete from public.team_members where id = '00000000-0000-0000-0000-0000000006b2';
select ok(
  not exists (select 1 from public.team_members where id = '00000000-0000-0000-0000-0000000006b2'),
  'editor: removes team members'
);
update public.site_pages set description = 'Шинэ тайлбар' where slug = 'about';
select is(
  (select description from public.site_pages where slug = 'about'),
  'Шинэ тайлбар',
  'editor: edits a site page lead'
);
reset role;

select * from finish();
rollback;
