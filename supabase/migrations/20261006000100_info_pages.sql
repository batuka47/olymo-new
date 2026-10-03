-- Info pages edited in /admin/pages: a lead and structured blocks on site_pages, limits on FAQ
-- items, and the team shown on /about.

-- description: the lead under the title, also the page's meta description.
-- blocks: page-specific fields the editor shows as form fields, checked by the app
-- (src/lib/site-pages/blocks.ts): /about has rationale, vision and mission; /partner has benefits.
alter table public.site_pages
  add column description text not null default '' check (char_length(description) <= 300),
  add column blocks jsonb not null default '{}'::jsonb check (jsonb_typeof(blocks) = 'object');

alter table public.faq_items
  add constraint faq_items_question_length check (char_length(question) between 1 and 300),
  add constraint faq_items_answer_length check (char_length(answer) between 1 and 3000);

create index faq_items_sort_order_idx on public.faq_items (sort_order);

-- Team ---------------------------------------------------------------------------------------

-- Photos live in media/team/{id}/ (see src/lib/media.ts).
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  role text not null default '' check (char_length(role) <= 100),
  photo_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger team_members_set_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

create index team_members_sort_order_idx on public.team_members (sort_order);

alter table public.team_members enable row level security;

create policy "Anyone reads team members"
  on public.team_members for select to anon, authenticated
  using (true);
create policy "Staff insert team members"
  on public.team_members for insert to authenticated
  with check ((select private.is_staff()));
create policy "Staff update team members"
  on public.team_members for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff delete team members"
  on public.team_members for delete to authenticated
  using ((select private.is_staff()));
