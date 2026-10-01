-- View counting for the public article page. Readers never write to articles: the page's server
-- action calls record_article_view() with the service role. No reader data is stored.

-- A view is not an edit. updated_at versions image URLs and sorts the admin list, so it must not
-- move when only view_count changes (record_article_view is the only writer of view_count).
drop trigger articles_set_updated_at on public.articles;

create trigger articles_set_updated_at
  before update on public.articles
  for each row
  when (old.view_count is not distinct from new.view_count)
  execute function public.set_updated_at();

-- Counts only articles readers can see (same rule as published_articles).
create function public.record_article_view(article_id uuid)
returns void
language sql
set search_path = ''
as $$
  update public.articles
  set view_count = view_count + 1
  where id = record_article_view.article_id
    and status in ('published', 'scheduled')
    and publish_at <= now();
$$;

-- Without this anyone could inflate counts through /rest/v1/rpc/record_article_view.
revoke execute on function public.record_article_view(uuid) from public, anon, authenticated;
grant execute on function public.record_article_view(uuid) to service_role;
