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
- **An admin account:** in Studio open Authentication → Add user (tick "Auto confirm"), then run in
  the SQL editor:
  ```sql
  update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
  ```

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
