-- Form submissions and sign-in attempts: what each form must carry, and that only the server
-- (service role) can count attempts. Run with `npm run db:test`. Everything is rolled back.
begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

select throws_ok(
  $$insert into public.submissions (kind, first_name, email, message) values ('news', 'Бат', 'bat@test.local', 'Мэдээний агуулга')$$,
  '23514', null, 'a news tip needs a headline'
);
select throws_ok(
  $$insert into public.submissions (kind, first_name, email, message) values ('ad', 'Бат', 'bat@test.local', 'Сурталчилгааны хүсэлт')$$,
  '23514', null, 'an advertising request needs an organization'
);
select lives_ok(
  $$insert into public.submissions (kind, first_name, phone, organization, title, files_url, message, ip_hash)
    values ('news', 'Бат', '+97699112233', 'Сургууль', 'Олимпиад', 'https://example.com/files', 'Мэдээний агуулга', 'abc')$$,
  'a complete news tip is stored with its headline, link and IP hash'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is((select count(*) from public.auth_attempts), 0::bigint, 'anon: cannot read sign-in attempts');
select throws_ok(
  $$insert into public.auth_attempts (action, ip_hash) values ('login', 'x')$$,
  '42501', null, 'anon: cannot write sign-in attempts'
);
select throws_ok(
  $$select public.record_auth_attempt('login', 'x', 15)$$,
  '42501', null, 'anon: cannot call record_auth_attempt'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
select throws_ok(
  $$select public.record_auth_attempt('login', 'x', 15)$$,
  '42501', null, 'signed-in users cannot call record_auth_attempt'
);
reset role;

insert into public.auth_attempts (action, ip_hash, created_at)
values ('login', 'old', now() - interval '2 days'), ('login', 'hash-a', now() - interval '20 minutes');

set local role service_role;
select public.record_auth_attempt('login', 'hash-a', 15);
select public.record_auth_attempt('login', 'hash-a', 15);
select is(
  public.record_auth_attempt('login', 'hash-a', 15),
  3,
  'counts this address''s attempts within the window, the new one included'
);
select is(
  public.record_auth_attempt('forgot_password', 'hash-a', 15),
  1,
  'each form is counted on its own'
);
reset role;

select ok(
  not exists (select 1 from public.auth_attempts where ip_hash = 'old'),
  'attempts older than a day are cleared'
);

select * from finish();
rollback;
