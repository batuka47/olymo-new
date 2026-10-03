-- Ad counters: only the service role can count, counting keeps updated_at, clicks return the link.
-- Run with `npm run db:test`. Everything is rolled back.
begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

insert into public.ads (id, title, image_path, link_url, placement, updated_at) values
  ('00000000-0000-0000-0000-0000000000a1', 'Counted', 'ads/x/desktop-1600.webp', 'https://example.com/landing', 'home_1', '2026-01-01');

set local role anon;
select throws_ok(
  $$select public.record_ad_click('00000000-0000-0000-0000-0000000000a1')$$,
  '42501', null, 'anon cannot call record_ad_click'
);
select throws_ok(
  $$select public.record_ad_impression('00000000-0000-0000-0000-0000000000a1')$$,
  '42501', null, 'anon cannot call record_ad_impression'
);
reset role;

set local role authenticated;
select throws_ok(
  $$select public.record_ad_impression('00000000-0000-0000-0000-0000000000a1')$$,
  '42501', null, 'signed-in users cannot call record_ad_impression'
);
reset role;

set local role service_role;
select is(
  public.record_ad_click('00000000-0000-0000-0000-0000000000a1'),
  'https://example.com/landing',
  'a click returns the link'
);
select is(public.record_ad_click('00000000-0000-0000-0000-0000000000ff'), null, 'an unknown ad returns null');
select public.record_ad_impression('00000000-0000-0000-0000-0000000000a1');
select public.record_ad_impression('00000000-0000-0000-0000-0000000000a1');
reset role;

select is((select click_count from public.ads where title = 'Counted'), 1, 'click counted');
select is((select impression_count from public.ads where title = 'Counted'), 2, 'impressions counted');
select is(
  (select updated_at from public.ads where title = 'Counted'),
  '2026-01-01'::timestamptz,
  'counting does not change updated_at'
);

update public.ads set title = 'Counted, edited' where title = 'Counted';
select is((select updated_at from public.ads where title = 'Counted, edited'), now(), 'an edit still sets updated_at');

select * from finish();
rollback;
