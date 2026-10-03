-- Ad clicks and impressions. Readers never write to ads: the /r/ad/[id] route and the impression
-- server action call these functions with the service role. No reader data is stored.

-- Counting is not an edit. updated_at versions the ad image URLs, so it must not move when only
-- the counters change (the functions below are their only writers).
drop trigger ads_set_updated_at on public.ads;

create trigger ads_set_updated_at
  before update on public.ads
  for each row
  when (
    old.click_count is not distinct from new.click_count
    and old.impression_count is not distinct from new.impression_count
  )
  execute function public.set_updated_at();

-- Returns where to send the reader; null when the ad does not exist.
create function public.record_ad_click(ad_id uuid)
returns text
language sql
set search_path = ''
as $$
  update public.ads
  set click_count = click_count + 1
  where id = record_ad_click.ad_id
  returning link_url;
$$;

create function public.record_ad_impression(ad_id uuid)
returns void
language sql
set search_path = ''
as $$
  update public.ads
  set impression_count = impression_count + 1
  where id = record_ad_impression.ad_id;
$$;

-- Without this anyone could inflate the counters through /rest/v1/rpc.
revoke execute on function public.record_ad_click(uuid) from public, anon, authenticated;
revoke execute on function public.record_ad_impression(uuid) from public, anon, authenticated;
grant execute on function public.record_ad_click(uuid) to service_role;
grant execute on function public.record_ad_impression(uuid) to service_role;
