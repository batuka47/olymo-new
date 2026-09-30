-- Content tables, indexes and the published_articles / published_events views.

-- Categories -----------------------------------------------------------------

create table public.categories (
  slug text primary key,
  label text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- Mirrors src/config/categories.ts, which the app uses as the source of truth for slugs.
insert into public.categories (slug, label, description, sort_order) values
  ('education', 'Боловсрол', 'Ерөнхий боловсролын сургууль, их сургуулийн элсэлт, боловсролын бодлогын мэдээ.', 1),
  ('olympiad', 'Олимпиад', 'Олимпиад, уралдааны зар, бүртгэлийн хугацаа, дүн.', 2),
  ('world', 'Дэлхийд', 'Гадаадад суралцах боломж, тэтгэлэг, олон улсын боловсролын мэдээ.', 3),
  ('sports', 'Спорт', 'Сурагч, оюутны спортын тэмцээн, амжилт.', 4),
  ('technology', 'Технологи', 'Технологи, программчлал, дижитал ур чадварын мэдээ.', 5),
  ('science', 'Шинжлэх ухаан', 'Шинжлэх ухааны нээлт, судалгаа, залуу судлаачдын амжилт.', 6),
  ('events', 'Эвентүүд', 'Сургалт, семинар, хакатон, нээлттэй хаалганы өдөр болон бусад арга хэмжээ.', 7);

-- Articles -------------------------------------------------------------------

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 200),
  excerpt text check (char_length(excerpt) <= 200),
  body_json jsonb,
  body_html text,
  category_slug text not null references public.categories (slug) on update cascade,
  cover_path text,
  cover_alt text,
  author_name text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  publish_at timestamptz,
  is_featured boolean not null default false,
  is_good_to_know boolean not null default false,
  is_breaking boolean not null default false,
  view_count integer not null default 0 check (view_count >= 0),
  seo_title text,
  seo_description text,

  -- Olympiad details, filled only for olympiad announcements.
  subject text check (subject in ('math', 'physics', 'chemistry', 'informatics', 'biology', 'other')),
  level_text text,
  registration_deadline date,
  exam_date date,
  audience text,
  location text,
  fee_text text,
  organizer text,
  registration_url text,

  search_vector tsvector generated always as (
    setweight(to_tsvector('simple'::regconfig, coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple'::regconfig, coalesce(excerpt, '')), 'B')
  ) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint articles_publish_at_required check (status = 'draft' or publish_at is not null)
);

create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

create index articles_status_publish_at_idx on public.articles (status, publish_at desc);
create index articles_category_publish_at_idx on public.articles (category_slug, publish_at desc);
create index articles_featured_idx on public.articles (publish_at desc) where is_featured;
create index articles_good_to_know_idx on public.articles (publish_at desc) where is_good_to_know;
create index articles_breaking_idx on public.articles (publish_at desc) where is_breaking;
create index articles_registration_deadline_idx on public.articles (registration_deadline)
  where registration_deadline is not null;
create index articles_search_idx on public.articles using gin (search_vector);
create index articles_title_trgm_idx on public.articles using gin (title extensions.gin_trgm_ops);

-- Public means "published or scheduled, and due": scheduled content goes live on its own at
-- publish_at, no cron job needed. The same rule is in the RLS policies for articles and events.
-- security_invoker keeps the caller's RLS in force when reading through the view.
create view public.published_articles
with (security_invoker = true)
as
select *
from public.articles
where status in ('published', 'scheduled') and publish_at <= now();

-- Tags -----------------------------------------------------------------------

create table public.tags (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tags_set_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();

create table public.article_tags (
  article_id uuid not null references public.articles (id) on delete cascade,
  tag_slug text not null references public.tags (slug) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, tag_slug)
);

create index article_tags_tag_slug_idx on public.article_tags (tag_slug);

-- Events ---------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 200),
  excerpt text check (char_length(excerpt) <= 200),
  body_json jsonb,
  body_html text,
  cover_path text,
  cover_alt text,
  event_type text,
  organizer text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  price_text text,
  contact_phone text,
  registration_url text,
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint events_publish_at_required check (status = 'draft' or publish_at is not null),
  constraint events_ends_after_start check (ends_at is null or ends_at >= starts_at)
);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create index events_status_starts_at_idx on public.events (status, starts_at);

create view public.published_events
with (security_invoker = true)
as
select *
from public.events
where status in ('published', 'scheduled') and publish_at <= now();

-- Ads ------------------------------------------------------------------------

create table public.ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_path text not null,
  image_path_mobile text,
  link_url text not null,
  placement text not null check (
    placement in (
      'home_1', 'home_2', 'home_3', 'home_4',
      'category_1', 'category_2', 'category_3',
      'article_side'
    )
  ),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  click_count integer not null default 0 check (click_count >= 0),
  impression_count integer not null default 0 check (impression_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ads_ends_after_start check (ends_at is null or ends_at > starts_at)
);

create trigger ads_set_updated_at
  before update on public.ads
  for each row execute function public.set_updated_at();

create index ads_placement_idx on public.ads (placement, starts_at) where is_active;

-- Static pages and FAQ -------------------------------------------------------

create table public.site_pages (
  slug text primary key check (slug in ('about', 'faq', 'editorial-policy', 'privacy', 'partner')),
  title text not null,
  body_json jsonb,
  body_html text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger site_pages_set_updated_at
  before update on public.site_pages
  for each row execute function public.set_updated_at();

insert into public.site_pages (slug, title) values
  ('about', 'Бидний тухай'),
  ('faq', 'Түгээмэл асуулт'),
  ('editorial-policy', 'Редакцийн ёс зүй'),
  ('privacy', 'Нууцлалын бодлого'),
  ('partner', 'Хамтарч ажиллах');

create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger faq_items_set_updated_at
  before update on public.faq_items
  for each row execute function public.set_updated_at();

-- Submissions (contact, advertising, partnership and news tips) --------------

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'ad', 'partner', 'news')),
  first_name text not null check (char_length(first_name) between 1 and 100),
  last_name text check (char_length(last_name) <= 100),
  phone text check (char_length(phone) <= 30),
  email text check (char_length(email) <= 254),
  organization text check (char_length(organization) <= 200),
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'done', 'spam')),
  admin_note text,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint submissions_contact_required check (phone is not null or email is not null)
);

create trigger submissions_set_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();

create index submissions_status_created_at_idx on public.submissions (status, created_at desc);

-- Comments -------------------------------------------------------------------

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  report_count integer not null default 0 check (report_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

create index comments_article_created_at_idx on public.comments (article_id, created_at);
create index comments_user_id_idx on public.comments (user_id);

-- Readers may edit their own text, but moderation fields stay with staff.
create function public.guard_comment_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or public.is_staff() then
    return new;
  end if;
  if new.status is distinct from old.status
    or new.report_count is distinct from old.report_count
    or new.article_id is distinct from old.article_id
    or new.user_id is distinct from old.user_id then
    raise exception 'Only staff can change comment moderation fields' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger comments_guard_moderation
  before update on public.comments
  for each row execute function public.guard_comment_moderation();
