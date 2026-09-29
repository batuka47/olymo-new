# НЭР — education news for Mongolian students

A Mongolian-language news site for secondary-school (ЕБС) and university students. It publishes
olympiad, competition and scholarship announcements quickly and clearly. Revenue comes from paid
featured posts (Онцлох) and banner ads.

The working name lives in `src/config/site.ts` (`siteConfig.name`). Built by Anir Agency.

Project rules for contributors and coding agents are in [CLAUDE.md](CLAUDE.md). The visual spec is in
[design/](design/README.md).

## Stack

- Next.js (App Router), TypeScript strict, Tailwind CSS v4
- Supabase (Postgres, Auth, Storage, RLS), not wired up yet
- Hosted on Vercel

## Requirements

- Node.js 20.9 or newer (22 LTS recommended)
- npm (ships with Node)

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

## Scripts

| Command             | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Start the dev server with hot reload                    |
| `npm run build`     | Production build                                        |
| `npm run start`     | Serve the production build (run `build` first)          |
| `npm run lint`      | ESLint (Next.js rules + Prettier compatibility)         |
| `npm run typecheck` | Generate Next.js route types, then `tsc --noEmit`       |
| `npm run format`    | Format all files with Prettier (sorts Tailwind classes) |

Before merging, `lint`, `typecheck` and `build` must all pass.

## Environment variables

All configuration comes from env vars. `.env.example` lists every variable with a comment. Copy it to
`.env.local` for local work. `.env*.local` files are git-ignored.

| Variable               | Required | Description                                                  |
| ---------------------- | -------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL` | yes      | Public base URL, no trailing slash. The build fails if unset |

## Project layout

```
design/              visual spec (reference only, not shipped)
messages/mn.json     all UI text, read through t() from src/lib/i18n.ts
src/app/             routes, root layout, global styles and design tokens (globals.css)
src/components/ui/   shared UI primitives (Button, …)
src/config/          siteConfig and the category list (single source of truth for slugs)
src/lib/             fonts, i18n helper
```

## Deploy (Vercel from GitHub)

1. Push the repository to GitHub.
2. In Vercel, click **Add New → Project** and import the GitHub repo. The framework preset is
   detected as Next.js, so leave the build settings at their defaults.
3. Under **Settings → Environment Variables**, add every variable from `.env.example` for
   **Production** and **Preview**. Use the real domain for Production.
4. Deploy. Every push to `main` then deploys to production, and every pull request gets a preview URL.
5. To add a custom domain, go to **Settings → Domains** and follow the DNS instructions there.
