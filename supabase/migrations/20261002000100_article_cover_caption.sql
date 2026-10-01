-- Optional caption / photo credit shown under the cover on the article page.

alter table public.articles
  add column cover_caption text check (char_length(cover_caption) <= 200);

-- The view's `select *` was expanded when it was created; recreate it to include the new column.
create or replace view public.published_articles
with (security_invoker = true)
as
select *
from public.articles
where status in ('published', 'scheduled') and publish_at <= now();
