# Project: Mongolian education news site (working name in siteConfig.name)

## What it is
A Mongolian-language education news platform for secondary-school (ЕБС) and university students.
Mission: publish olympiad, competition and scholarship announcements quickly and clearly.
Income: paid "featured" (Онцлох) posts and banner ads. No merch, no shop.
Built by Anir Agency (4 people). The person publishing content is NOT a programmer.

## Stack (do not change without asking)
- Next.js App Router, TypeScript strict, Tailwind CSS, server components by default
- Supabase: Postgres, Auth, Storage, Row Level Security. Migrations in supabase/migrations
- Hosted on Vercel. All config from env vars. Never hard-code URLs, never use localhost in app code
- Tiptap for the admin rich-text editor; zod for validation; Resend for email; Cloudflare Turnstile for spam

## Content model (summary)
articles, categories, tags, events, ads, site_pages, submissions (contact / ad / partner),
comments, profiles (role: admin | editor | reader).
Categories are data, managed by admins in /admin/categories (table categories: label, slug, description,
sort_order, show_in_nav, is_active, has_olympiad_fields). The server reads them through
src/lib/categories/queries.ts (cached, expired on save); src/config/categories.ts holds only types and helpers.
Code never depends on a particular category slug, except "events" (EVENTS_CATEGORY_SLUG: the /events section).
Olympiad behaviour follows has_olympiad_fields, never a slug. Slugs may not be a top-level route
(RESERVED_SLUGS in src/config/routes.ts). Articles have one main category (in their URL) and optional
secondary ones (article_categories); lists filter on articles.category_slugs, kept by database triggers.
Initial categories: education=Боловсрол, olympiad=Олимпиад, world=Дэлхийд, sports=Спорт,
technology=Технологи, science=Шинжлэх ухаан, events=Эвентүүд
Olympiad subjects: math, physics, chemistry, informatics, biology, other.

## Design system (square, editorial, grid-lined; inspired by mux.com)
Visual spec lives in design/ (read design/README.md first): style-system, home-desktop, home-mobile,
article-desktop, category-desktop (.dc.html source + screenshots/*.png). Match them closely; when a
prompt names a board (e.g. "Мэдээ — desktop"), open that file before building.
Colors: paper #F3F0E8 (bg), ink #17181A (text, dark sections), line #D6D2C8 (1px dividers),
muted #55565A (meta), accent #2E3BFF (primary action, links, active nav), lime #C8F031 (highlights,
deadlines < 7 days), ink-line #3A3B3F (dividers on dark).
Fonts (next/font/google, subsets cyrillic + cyrillic-ext + latin): Unbounded 700/800 = display headings,
Onest 400-700 = body, JetBrains Mono 400-700 = labels, dates, buttons (uppercase, tracking 0.06em).
Radius 0 everywhere. No shadows, no gradients. Sections separated by 1px lines.
Layout: max width 1440, side margin 64px desktop / 16px mobile, 12-column grid.
Section headers: mono index number in accent ("01") + Unbounded heading.
Image placeholders: diagonal-stripe pattern on #DDD8CC.
Touch targets >= 44px. Text contrast >= 4.5:1.

## Rules
- All UI text in Mongolian Cyrillic, stored in messages/mn.json (keyed), read through a t() helper,
  so English can be added later. Content from the database is not translated.
- One responsive component per UI piece. Never separate Desktop/Mobile copies of the same thing.
- Public pages are server-rendered with ISR (revalidate 60) and revalidated on admin save.
- Every public page exports metadata (title, description, Open Graph image).
- Images: uploaded as WebP in 3 widths (400, 800, 1600), always lazy-loaded except the LCP image.
- Secrets only in env vars; .env.example lists every variable with a comment.
- Before finishing any task: npm run lint, npm run typecheck, npm run build must pass.
- End every task with a short report: files changed, commands run, what I must do by hand, what's left.
- Code should read as if written by a careful human: small functions, clear names, no filler comments.
