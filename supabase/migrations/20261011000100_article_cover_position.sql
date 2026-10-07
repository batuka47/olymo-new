-- "Нүүр зургийн байрлал": where the cover goes on the article page. 'below' (under the title) is
-- the layout every existing article already has; 'above' puts it over the title, 'beside' next to
-- it on desktop (stacked on phones).

alter table public.articles
  add column cover_position text not null default 'below'
    check (cover_position in ('above', 'below', 'beside'));

-- The view's `select *` was expanded when it was created; recreate it to include the new column.
create or replace view public.published_articles
with (security_invoker = true)
as
select *
from public.articles
where status in ('published', 'scheduled') and publish_at <= now();
