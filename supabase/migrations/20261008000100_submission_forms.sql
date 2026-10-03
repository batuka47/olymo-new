-- The public forms (/contact, /advertise, /partner, /submit) and the rate limits on staff sign-in.

-- News tips ("Мэдээ илгээх") carry a headline and an optional link to files. Advertising and
-- partnership requests come from an organization. Phones are stored as +976XXXXXXXX.
alter table public.submissions
  add column title text check (char_length(title) <= 200),
  add column files_url text check (char_length(files_url) <= 500),
  add constraint submissions_news_title check (kind <> 'news' or title is not null),
  add constraint submissions_organization_required
    check (kind not in ('ad', 'partner') or organization is not null);

-- ip_hash is a salted SHA-256 of the sender's IP (never the IP itself), used to allow 5 forms per
-- IP per hour.
create index submissions_ip_hash_created_at_idx on public.submissions (ip_hash, created_at desc)
  where ip_hash is not null;

-- Sign-in and password reset attempts per IP hash. Sign-in runs on the server, so Supabase's own
-- limits see the server's address, not the visitor's. Only the service role uses this table: RLS
-- is on and there are no policies.
create table public.auth_attempts (
  id bigint generated always as identity primary key,
  action text not null check (action in ('login', 'forgot_password')),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index auth_attempts_lookup_idx on public.auth_attempts (action, ip_hash, created_at desc);

alter table public.auth_attempts enable row level security;

-- Records one attempt and returns how many this IP hash made for the action within the window,
-- this one included. Rows older than a day are no longer needed and are cleared on the way.
create function public.record_auth_attempt(
  attempt_action text,
  attempt_ip_hash text,
  window_minutes integer
)
returns integer
language sql
set search_path = ''
as $$
  delete from public.auth_attempts where created_at < now() - interval '1 day';
  insert into public.auth_attempts (action, ip_hash) values (attempt_action, attempt_ip_hash);
  select count(*)::integer
  from public.auth_attempts
  where action = attempt_action
    and ip_hash = attempt_ip_hash
    and created_at > now() - make_interval(mins => window_minutes);
$$;

revoke execute on function public.record_auth_attempt(text, text, integer)
  from public, anon, authenticated;
grant execute on function public.record_auth_attempt(text, text, integer) to service_role;
