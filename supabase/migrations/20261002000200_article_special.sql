-- "Нүүрний том баннер": an article marked for the large "Тусгай нийтлэл" banner on the home page,
-- optionally until a date (inclusive, Ulaanbaatar time). Without one it stays until unmarked.

alter table public.articles
  add column is_special boolean not null default false,
  add column special_until date;

create index articles_special_idx on public.articles (publish_at desc) where is_special;

-- The view's `select *` was expanded when it was created; recreate it to include the new columns.
create or replace view public.published_articles
with (security_invoker = true)
as
select *
from public.articles
where status in ('published', 'scheduled') and publish_at <= now();
