# НЭР — education news for Mongolian students

A Mongolian-language news site for secondary-school (ЕБС) and university students. It publishes
olympiad, competition and scholarship announcements quickly and clearly. Revenue comes from paid
featured posts (Онцлох) and banner ads.

The working name lives in `src/config/site.ts` (`siteConfig.name`). Built by Anir Agency.

Project rules for contributors and coding agents are in [CLAUDE.md](CLAUDE.md). The visual spec is in
[design/](design/README.md).

## Stack

- Next.js (App Router), TypeScript strict, Tailwind CSS v4
- Supabase (Postgres, Auth, Storage, RLS); schema in `supabase/migrations`
- Hosted on Vercel

## Requirements

- Node.js 20.9 or newer (22 LTS recommended)
- npm (ships with Node)
- Docker Desktop, running, for the local Supabase stack

## Setup

```bash
npm install
npx supabase start            # first run downloads the Supabase Docker images
npx supabase status           # prints the local URL and keys
cp .env.example .env.local    # fill in the values (see below)
npm run dev                   # http://localhost:3000
```

## Local Supabase

The Supabase CLI is a dev dependency, so every command runs through `npx supabase …`.

| Command                 | What it does                                                     |
| ----------------------- | ---------------------------------------------------------------- |
| `npx supabase start`    | Start Postgres, Auth, Storage and Studio in Docker               |
| `npx supabase status`   | Show local URLs and keys                                         |
| `npx supabase db reset` | Recreate the local database from migrations, then run `seed.sql` |
| `npx supabase stop`     | Stop the containers (data is kept until the next `db reset`)     |
| `npm run db:types`      | Regenerate `src/lib/supabase/types.ts` from the local database   |
| `npm run db:test`       | Run the pgTAP tests in `supabase/tests` (RLS, triggers, checks)  |

- **Studio** (table editor, auth users, storage): http://127.0.0.1:54323
- **Env values:** copy "API URL", "Publishable key" and "Secret key" from `npx supabase status`
  into `.env.local`.
- **Sample content:** `supabase/seed.sql` loads 6 articles, 2 events and 1 ad. Every title starts
  with `[ЖИШЭЭ]`. The seed only runs locally.
- **An admin account:** see [Admin area](#admin-area) below.
- **Emails** (staff invites) are not sent locally; they appear in Mailpit: http://127.0.0.1:54324

### Changing the schema

1. Create a migration: `npx supabase migration new short_description`, then write SQL in the new
   file in `supabase/migrations/`.
2. Apply it locally: `npx supabase db reset`, then `npm run db:test`.
3. Regenerate types: `npm run db:types`, and commit the migration together with `types.ts`.

Never edit a migration that has already been pushed to the hosted project; add a new one.

- **Publishing:** the public sees an article or event when its status is `published` or `scheduled`
  and `publish_at` has passed. "Scheduled" is simply published with a future date; no cron job.
- **Categories** live in both `src/config/categories.ts` and the `categories` table. Add or remove a
  category in both (the table through a new migration). `npm run check:categories`, part of
  `npm run lint`, fails if their slugs differ.

### Pushing migrations to the hosted project

```bash
npx supabase login                               # once per machine, opens the browser
npx supabase link --project-ref <project-ref>    # once per clone; ref is in the dashboard URL
npx supabase db push --dry-run                   # review what will run
npx supabase db push                             # apply pending migrations
```

`db push` applies migrations only. It does not run `seed.sql`, so sample content never reaches the
hosted database. After the first push, add the hosted URL and keys to Vercel (see Environment
variables).

## Admin area

The admin lives at `/admin` (sign in at `/admin/login`). Only accounts whose profile role is `admin`
or `editor` get in; there is no public sign-up for staff. Admins manage staff at `/admin/users`
(invite, change role, remove the staff role). Editors see everything except users and submissions.

### The first admin

`scripts/create-admin.ts` creates an admin account, or promotes an existing account to admin:

```bash
# bash / Git Bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' npx tsx scripts/create-admin.ts
```

```powershell
# PowerShell
$env:ADMIN_EMAIL="you@example.com"; $env:ADMIN_PASSWORD="a-long-password"; npx tsx scripts/create-admin.ts
```

The password needs at least 8 characters. The script reads `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SECRET_KEY` from the shell, falling back to `.env.local`. For the **hosted** project, set
those two variables in the shell to the hosted values for that one command. `npm run admin:create`
is a shortcut for the same script.

### Articles

`/admin/articles` lists, filters and searches articles; `/admin/articles/new` opens the editor.

- **Images** are resized in the browser to 1600, 800 and 400 px and uploaded to
  `media/articles/{id}/` as `cover-{width}.webp`. Browsers that cannot create WebP (Safari) upload
  JPEG instead (`cover-{width}.jpg`); the saved path keeps the extension, so the site always asks
  for the files that exist. The cover also gets a 1200 × 630 JPEG crop, `cover-og.jpg`, used as
  the share image on Facebook, Messenger and X. `next/image` uses a custom loader
  (`src/lib/images/loader.ts`) that only picks one of the stored widths; nothing is resized on the
  server.
- **Body text** is saved as Tiptap JSON. The server builds the HTML from that JSON and cleans it
  with an allow-list; HTML sent by a browser is never stored.
- **Publishing:** "Нийтлэх" publishes now, or at the chosen Ulaanbaatar time when "Огноо товлох" is
  selected. Drafts autosave every 30 seconds; published articles are only saved on "Шинэчлэх".
- **Preview** opens the public page in Next.js Draft Mode, so staff see drafts exactly as readers
  will. The yellow bar at the top has a link to leave preview.
- **Unpublishing** ("Ноорог болгох" on a live article) asks for confirmation first.
- **Deleting** an article also deletes its images; **duplicating** copies them.
- **Unused images:** images uploaded to an article that was never saved stay in storage. Admins can
  remove them with "Ашиглагдаагүй зураг цэвэрлэх" on the dashboard: it deletes `articles/{id}/`
  folders that have no article and nothing uploaded in the last 24 hours.

### Public article page

`/{category}/{slug}` is rendered on the server and cached (ISR, 60 s). The newest 50 articles are
built at deploy time; the rest are built on their first visit. Saving in the admin refreshes the
page immediately. A link with the wrong category answers 308 with the right address.

- **Key facts** ("Гол мэдээлэл") appear when any olympiad field is filled. Deadlines under 7 days
  away are lime; past ones say "Хугацаа дууссан". On phones the box sits above the text.
- **Most read** ("Их уншсан"): the 4 most viewed articles published in the last 30 days.
- **Related** ("Холбоотой мэдээ"): 3 articles, the ones sharing the most tags first, then the newest
  in the same category.
- **Views:** the page asks the server once per browser session (a `sessionStorage` flag, no cookie)
  to add one to `view_count`. Only the server can do that, through the `record_article_view`
  database function, and a view does not change `updated_at`. No reader data is stored.
- **Sharing:** Facebook, Messenger (`fb-messenger://` on phones, Facebook's send dialog on
  computers, which needs `NEXT_PUBLIC_FACEBOOK_APP_ID`), copy link, and the phone's own share sheet
  where the browser has one.

### Category pages

`/{category}` uses one template for every category except Эвентүүд (its own page comes later).

- **Banner:** the newest "Онцлох" article of the category. It is left out of the list below.
- **Бүх мэдээ:** 9 per page, `?page=N` with real links. Olympiad also has `?subject=` (Математик,
  Физик, …) and `?sort=deadline` ("Бүртгэл дуусах": open registrations closing soonest first, then
  the rest, newest first). Values the page does not offer answer 404, so each view has one address.
- **Cards** come from `src/components/site/article-card.tsx` (`grid`, `row`, `banner`); use it for
  every article list.
- **Caching:** reading `?page=` makes the page render on each request, so the database reads are
  cached instead (60 s, tag `articles`, in `src/lib/articles/category.ts`). Saving or deleting an
  article in the admin expires the tag, so changes show at once. Changes made directly in the
  database show within 60 seconds.

### Home page

`/` is ISR (60 s). All sections load in parallel and are filled top to bottom without repeating an
article (`arrangeHomeSections` in `src/lib/articles/home.ts`). A section with nothing to show is left
out and the section numbers close up.

| Section                | Content                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| Ticker (every page)    | 3 newest "Шинэ мэдээ" (`is_breaking`) articles                         |
| Hero                   | Search (`/search?q=`) and the newest "Онцлох" article                  |
| Онцлох                 | The next 4 "Онцлох" articles                                           |
| Олимпиадууд            | Olympiads still taking registrations, closing soonest first (scroller) |
| Мэдүүштэй              | 5 "Мэдүүштэй" articles + the "Тусгай нийтлэл" banner (see below)       |
| Салбар бүрээс          | Newest Спорт, Технологи, Шинжлэх ухаан article + the next event        |
| Удахгүй болох эвентүүд | The 3 events after that one (`events` table)                           |

**Тусгай нийтлэл:** the newest article marked "Нүүрний том баннер" in the editor whose last day
(optional, Ulaanbaatar time, inclusive) has not passed. It is a paid placement, so it is reserved
before the other sections are filled and never also shows in the hero or Онцлох. With no marked
article, the newest "Мэдүүштэй" article with a cover is used. Duplicating an article clears the mark.

Ad slots `home_1`–`home_4` follow Онцлох, Мэдүүштэй, Салбар бүрээс and the events, and hide with
them. Event lists are cached under the `events` tag (60 s).

### Inviting staff and resetting passwords

Both are emailed by Supabase Auth, and both links go to `/admin/auth/confirm`, which signs the
person in and sends them to `/admin/set-password` to choose a password. Any staff member can also
change their password on that page later.

- **Invite:** an admin invites from `/admin/users`.
- **Forgot password:** "Нууц үгээ мартсан?" on the login page opens `/admin/forgot-password`. It
  answers with the same message whether or not the email has an account, so it cannot be used to
  find out who works here.

One-time setup on the hosted project (Supabase dashboard):

1. **Authentication → URL Configuration:** set Site URL to the public site URL (the same value as
   `NEXT_PUBLIC_SITE_URL`).
2. **Authentication → Emails → Invite user:** paste the subject and body from
   `supabase/templates/invite.html`.
3. **Authentication → Emails → Reset password:** paste the subject and body from
   `supabase/templates/recovery.html`.
4. **Authentication → Emails → SMTP settings:** connect a real email sender (for example Resend).
   Supabase's built-in sender only delivers to your own team's addresses and is heavily rate limited.

The default Supabase templates do not work with this app: their links cannot be read by the server.
The subjects are in the comment at the top of each template file and in `supabase/config.toml`, which
configures all of this for local development.

## Scripts

| Command                    | What it does                                                 |
| -------------------------- | ------------------------------------------------------------ |
| `npm run dev`              | Start the dev server with hot reload                         |
| `npm run build`            | Production build                                             |
| `npm run start`            | Serve the production build (run `build` first)               |
| `npm run lint`             | ESLint, then `check:categories`                              |
| `npm run typecheck`        | Generate Next.js route types, then `tsc --noEmit`            |
| `npm run format`           | Format all files with Prettier (sorts Tailwind classes)      |
| `npm run db:types`         | Regenerate Supabase types from the local database            |
| `npm run db:test`          | Run the database tests (local Supabase must be running)      |
| `npm run check:categories` | Check `categories.ts` and the migrations list the same slugs |
| `npm run admin:create`     | Create or promote an admin (see Admin area)                  |

Before merging, `lint`, `typecheck` and `build` must all pass.

## Environment variables

All configuration comes from env vars. `.env.example` lists every variable with a comment. Copy it to
`.env.local` for local work. `.env*.local` files are git-ignored.

| Variable                               | Required | Description                                                  |
| -------------------------------------- | -------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`                 | yes      | Public base URL, no trailing slash. The build fails if unset |
| `NEXT_PUBLIC_SUPABASE_URL`             | yes      | Supabase API URL                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes      | Publishable key; safe in the browser, RLS applies            |
| `SUPABASE_SECRET_KEY`                  | yes      | Secret (service role) key; server only, bypasses RLS         |
| `NEXT_PUBLIC_FACEBOOK_APP_ID`          | no       | Facebook app ID; shows the Messenger share button on desktop |

## Project layout

```
design/              visual spec (reference only, not shipped)
messages/mn.json     all UI text, read through t() from src/lib/i18n.ts
src/app/             routes, root layout, global styles and design tokens (globals.css)
src/components/ui/   shared UI primitives (Button, …)
src/config/          siteConfig and the category list (single source of truth for slugs)
src/lib/             fonts, i18n helper
src/lib/supabase/    Supabase clients (server, browser, service-role admin) and generated types
supabase/            CLI config, migrations/ and seed.sql
```

## Deploy (Vercel from GitHub)

1. Push the repository to GitHub.
2. In Vercel, click **Add New → Project** and import the GitHub repo. The framework preset is
   detected as Next.js, so leave the build settings at their defaults.
3. Under **Settings → Environment Variables**, add every variable from `.env.example` for
   **Production** and **Preview**. Use the real domain for Production.
4. Deploy. Every push to `main` then deploys to production, and every pull request gets a preview URL.
5. To add a custom domain, go to **Settings → Domains** and follow the DNS instructions there.
