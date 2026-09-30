-- Row level security. Every table has RLS on; anything not granted below is denied.
-- The service role bypasses RLS and is only used on the server (src/lib/supabase/admin.ts).

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.tags enable row level security;
alter table public.article_tags enable row level security;
alter table public.events enable row level security;
alter table public.ads enable row level security;
alter table public.site_pages enable row level security;
alter table public.faq_items enable row level security;
alter table public.submissions enable row level security;
alter table public.comments enable row level security;

-- Profiles: users see and edit their own; staff see all; admins edit all.
-- Role changes are additionally guarded by the profiles_guard_role trigger.

create policy "Users read own profile, staff read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()));

create policy "Users update own profile, admins update all"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- Reference content: public read, staff write.

create policy "Anyone reads categories"
  on public.categories for select to anon, authenticated
  using (true);
create policy "Staff insert categories"
  on public.categories for insert to authenticated
  with check ((select public.is_staff()));
create policy "Staff update categories"
  on public.categories for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff delete categories"
  on public.categories for delete to authenticated
  using ((select public.is_staff()));

create policy "Anyone reads tags"
  on public.tags for select to anon, authenticated
  using (true);
create policy "Staff insert tags"
  on public.tags for insert to authenticated
  with check ((select public.is_staff()));
create policy "Staff update tags"
  on public.tags for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff delete tags"
  on public.tags for delete to authenticated
  using ((select public.is_staff()));

create policy "Anyone reads site pages"
  on public.site_pages for select to anon, authenticated
  using (true);
create policy "Staff insert site pages"
  on public.site_pages for insert to authenticated
  with check ((select public.is_staff()));
create policy "Staff update site pages"
  on public.site_pages for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff delete site pages"
  on public.site_pages for delete to authenticated
  using ((select public.is_staff()));

create policy "Anyone reads FAQ items"
  on public.faq_items for select to anon, authenticated
  using (true);
create policy "Staff insert FAQ items"
  on public.faq_items for insert to authenticated
  with check ((select public.is_staff()));
create policy "Staff update FAQ items"
  on public.faq_items for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff delete FAQ items"
  on public.faq_items for delete to authenticated
  using ((select public.is_staff()));

-- Articles and events: the public sees published or scheduled items once publish_at has passed
-- (same rule as the published_articles and published_events views).

create policy "Public reads published articles, staff read all"
  on public.articles for select to anon, authenticated
  using (
    (status in ('published', 'scheduled') and publish_at <= now())
    or (select public.is_staff())
  );
create policy "Staff insert articles"
  on public.articles for insert to authenticated
  with check ((select public.is_staff()));
create policy "Staff update articles"
  on public.articles for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff delete articles"
  on public.articles for delete to authenticated
  using ((select public.is_staff()));

-- Tag links follow the visibility of their article (the subquery runs under articles RLS).
create policy "Public reads tags of visible articles"
  on public.article_tags for select to anon, authenticated
  using (exists (select 1 from public.articles a where a.id = article_id));
create policy "Staff insert article tags"
  on public.article_tags for insert to authenticated
  with check ((select public.is_staff()));
create policy "Staff delete article tags"
  on public.article_tags for delete to authenticated
  using ((select public.is_staff()));

create policy "Public reads published events, staff read all"
  on public.events for select to anon, authenticated
  using (
    (status in ('published', 'scheduled') and publish_at <= now())
    or (select public.is_staff())
  );
create policy "Staff insert events"
  on public.events for insert to authenticated
  with check ((select public.is_staff()));
create policy "Staff update events"
  on public.events for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff delete events"
  on public.events for delete to authenticated
  using ((select public.is_staff()));

-- Ads: the public sees active ads inside their date range.

create policy "Public reads running ads, staff read all"
  on public.ads for select to anon, authenticated
  using (
    (is_active and starts_at <= now() and (ends_at is null or ends_at > now()))
    or (select public.is_staff())
  );
create policy "Staff insert ads"
  on public.ads for insert to authenticated
  with check ((select public.is_staff()));
create policy "Staff update ads"
  on public.ads for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff delete ads"
  on public.ads for delete to authenticated
  using ((select public.is_staff()));

-- Submissions: inserted only by server actions with the service role (no insert policy).
-- Only admins read and triage them.

create policy "Admins read submissions"
  on public.submissions for select to authenticated
  using ((select public.is_admin()));
create policy "Admins update submissions"
  on public.submissions for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Comments: visible ones are public. Signed-in users write as themselves on visible articles;
-- the comments_guard_moderation trigger keeps status and report_count with staff.

create policy "Public reads visible comments, authors and staff read all"
  on public.comments for select to anon, authenticated
  using (
    status = 'visible'
    or user_id = (select auth.uid())
    or (select public.is_staff())
  );
create policy "Users comment as themselves"
  on public.comments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'visible'
    and report_count = 0
    and exists (select 1 from public.articles a where a.id = article_id)
  );
create policy "Authors and staff update comments"
  on public.comments for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()))
  with check (user_id = (select auth.uid()) or (select public.is_staff()));
create policy "Authors and staff delete comments"
  on public.comments for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));
