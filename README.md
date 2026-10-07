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
- **Categories** are rows of the `categories` table, managed in `/admin/categories` (see Categories).
  No code depends on a particular slug except `events`, the events section.

### Pushing migrations to the hosted project

```bash
npx supabase login                               # once per machine, opens the browser
npx supabase link --project-ref <project-ref>    # once per clone; ref is in the dashboard URL
npx supabase db push --dry-run                   # review what will run
npx supabase db push                             # apply pending migrations
```

`db push` applies migrations only. It does not run `seed.sql`, so sample content never reaches the
hosted database. Never add `--include-seed`: it would send the samples too. `npm run lint`
checks that no migration carries sample content (`check:samples`). After the first push, add the hosted URL and keys to Vercel (see Environment
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
  `media/articles/{id}/` as `cover-{token}-{width}.webp`, where the token is new for every upload.
  Browsers that cannot create WebP (Safari) upload JPEG instead (`.jpg`); the saved path keeps the
  extension, so the site always asks for the files that exist. The cover also gets a 1200 × 630
  JPEG crop, `cover-{token}-og.jpg`, used as the share image on Facebook, Messenger and X.
  `next/image` uses a custom loader (`src/lib/images/loader.ts`) that only picks one of the stored
  widths; nothing is resized on the server, so Vercel's image optimization is never used.
- **Caching images:** a stored file never changes (replacing a cover uploads new names), so every
  upload is served with `Cache-Control: max-age=31536000` (a year). Images uploaded before this
  (`cover-1600.webp`, no token) keep working with their old one-hour setting.
- **Body text** is saved as Tiptap JSON. The server builds the HTML from that JSON and cleans it
  with an allow-list (`src/lib/editor/render-html.ts`); HTML sent by a browser is never stored.
  Articles written before the block editor open and render as before.
- **Block editor** (articles, events and info pages): "/" on an empty line opens a searchable
  block menu (Mongolian or Latin words, ↑↓ and Enter); hovering a block shows "+" (add a block
  below) and a grip to drag it elsewhere. The fixed toolbar does the same for people who don't use
  "/". Blocks: Гарчиг 1–3 (h2–h4; the title is the page's only h1), Энгийн / Жижиг текст,
  alignment, bold, italic, underline, strikethrough, links, lists, Эшлэл with an optional author,
  Хуваах зураас, Зураг, Зургийн слайдер, Хүснэгт, YouTube, Сошиал пост and Embed. The block types
  live in `src/lib/editor/nodes.ts` (what readers get) and `src/components/admin/body-editor/`
  (how they are edited).
- **Images in the text** can be uploaded, pasted or dropped, of any size: the browser resizes them
  to at most 2400 px wide (WebP, JPEG where WebP can't be made) as `body-{token}-{width}.webp`,
  with a progress bar. Only files that aren't images are refused. Each has a caption, a credit,
  alt text and a width: text, full, left or right (left and right are full width on phones).
- **No image fails on size** (text, covers, ads, team photos): a file still over 4.5 MB after
  resizing is re-encoded at lower quality (down to 0.6), then narrower (down to 1600 px), and no
  copy is larger than 16 million pixels, the most an iPhone can draw. The `media` bucket allows
  10 MB as a margin (`src/lib/images/fit.ts`).
- **YouTube** shows a thumbnail and play button; the youtube-nocookie.com player loads only on
  click. **Social posts** (Facebook, Instagram, X, TikTok) use each platform's own embed; its
  script loads only on pages with such a post, when the post nears the screen.
- **Embed:** a single iframe from an address in `src/config/embeds.ts` (Google Maps, Forms, Docs,
  Calendar, Drive, Canva, Vimeo, Spotify, SoundCloud, Facebook plugins) is shown as it is. Any
  other code runs in a sandboxed frame (`srcdoc`, `sandbox="allow-scripts allow-popups
allow-forms"`, never `allow-same-origin`) that reports its height to the page, so pasted code
  can't reach the site or the reader's session. To allow a new service, add its host and path to
  `allowedIframeSources`.
- **Cover position** ("Нүүр зургийн байрлал"): over the title, under it (the default, and every
  older article), or beside it on desktop (stacked under the excerpt on phones).
- **Богино тайлбар** (the excerpt) is required to publish, 50–200 characters; drafts save without
  it. The card beside it shows the link preview live: image, SEO title or title, SEO description
  or excerpt, and the domain.
- **The link** (slug) is the title in Latin letters and never contains Cyrillic; the full address
  shows under the title. While it follows the title, a taken link gets a number on save
  (`...-2`); one typed by hand is kept as typed, and a taken one is an error.
- **"Сайтыг шинэчлэх"** on the articles list rebuilds every public page (home, categories,
  articles, events) on its next visit, for when something changed outside the editors.
- **Publishing:** "Нийтлэх" publishes now, or at the chosen Ulaanbaatar time when "Огноо товлох" is
  selected. Drafts autosave every 30 seconds; published articles are only saved on "Шинэчлэх".
- **Preview** opens the public page in Next.js Draft Mode, so staff see drafts exactly as readers
  will. The yellow bar at the top has a link to leave preview.
- **Unpublishing** ("Ноорог болгох" on a live article) asks for confirmation first.
- **Deleting** an article also deletes its images; **duplicating** copies them.
- **Unused images:** images uploaded to an article that was never saved, and the old files of a
  replaced cover or of an image taken out of the text, stay in storage. Admins can remove them with
  "Ашиглагдаагүй зураг цэвэрлэх" on the dashboard: it deletes `articles/{id}/` folders that have no
  article, and files that their article (or event, ad, team member) no longer points at, leaving
  anything uploaded in the last 24 hours.

### Public article page

`/{category}/{slug}` is rendered on the server and cached (ISR, 60 s). The newest 50 articles are
built at deploy time; the rest are built on their first visit. Saving in the admin refreshes the
page immediately. A link with the wrong category answers 308 with the right address.

- **Key facts** ("Гол мэдээлэл") appear when any olympiad field is filled. Deadlines under 7 days
  away are lime; past ones say "Хугацаа дууссан". On phones the box sits above the text.
- **Most read** ("Их уншсан"): the 4 most viewed articles published in the last 30 days.
- **Related** ("Холбоотой мэдээ"): 3 articles, the ones sharing the most tags first, then the newest
  in the same category.
- **Views:** once the page has loaded and the browser is idle, it asks the server once per browser
  session (a `sessionStorage` flag, no cookie) to add one to `view_count`. Only the server can do that, through the `record_article_view`
  database function, and a view does not change `updated_at`. No reader data is stored.
- **Sharing:** Facebook, Messenger (`fb-messenger://` on phones, Facebook's send dialog on
  computers, which needs `NEXT_PUBLIC_FACEBOOK_APP_ID`), copy link, and the phone's own share sheet
  where the browser has one. CSS (`pointer: coarse`) picks the phone or computer buttons, so the
  row never moves after loading.
- **Comments** load their code only when the section nears the screen (see Reader accounts).

### Categories

`/admin/categories` (admins only; editors pick categories in the article editor):

- **List:** drag a row, or use its arrows, to set the menu order; each move is saved at once.
  "Нуух" hides a category: its page answers 404 and it leaves the menu, search filter and sitemap,
  but its articles still open. "Цэсэнд харуулах" (in the form) only takes it out of the menu.
- **Form:** name, address (made from the name in Latin letters; it can change only while no
  article is in the category, so article addresses never break), the description under the
  category title, menu, visibility, "Олимпиадын талбартай" (the olympiad panel in the editor,
  the subject filter and the deadline sort, and the home page's olympiad section) and
  "Нүүрэнд харуулах" (a tile in the home page's "Салбар бүрээс"; at most 4 categories, the box is
  disabled once four are ticked and the server refuses a fifth).
- **Reserved addresses:** a category cannot take the first part of another page's address
  (`admin`, `events`, `search`, `about`, …; `RESERVED_SLUGS` in `src/config/routes.ts`, which a
  unit test checks against `src/app`).
- **Deleting** an empty category is immediate. One with articles asks for another category, moves
  every article there (as main or secondary category) and then deletes, in one transaction
  (`delete_category` in the database). Moved articles get a new address; the old one redirects.
- **Эвентүүд** is the events section: its name, description, menu place and visibility can change,
  but not its address, and it cannot be deleted or hold articles.
- **Secondary categories** ("Хамаарах категориуд" in the article editor) put an article on those
  category pages, home sections and search filters too; its address keeps the main category.
  `articles.category_slugs` (main first, kept by database triggers) is what lists filter on.
- **Caching:** the site reads categories through `src/lib/categories/queries.ts`, cached under the
  `categories` tag; saving in `/admin/categories` expires it and every page, so menus update at
  once. Changes made directly in the database show within an hour. A category page that a
  visitor's browser prefetches (from a menu link) at the very moment of a change can keep its old
  version for up to the 60 s ISR period.
- **Home page:** "Салбар бүрээс" shows the newest article of each category ticked "Нүүрэнд
  харуулах", in menu order, then the next event. With none ticked, the last three visible
  categories in menu order, leaving out those with olympiad fields (by default Спорт, Технологи,
  Шинжлэх ухаан). The olympiad band is titled with the first category that has olympiad fields
  (`src/lib/categories/home.ts`).

### Category pages

`/{category}` uses one template for every category; `/events` has its own page.

- **Banner:** the newest "Онцлох" article of the category. It is left out of the list below.
- **Бүх мэдээ:** 9 per page, `?page=N` with real links. Categories with olympiad fields also have
  `?subject=` (Математик, Физик, …) and `?sort=deadline` ("Бүртгэл дуусах": open registrations closing soonest first, then
  the rest, newest first). Values the page does not offer answer 404, so each view has one address.
- **Cards** come from `src/components/site/article-card.tsx` (`grid`, `row`, `banner`); use it for
  every article list.
- **Caching:** the plain address (`/olympiad`) is a static page (ISR, 60 s). Addresses with
  `?subject=`, `?sort=` or `?page=` are rewritten in `next.config.ts` (for any slug that is not reserved, so new
  categories work without a deploy) to
  `app/(site)/list-views/[category]`, which renders them on request; both share
  `[category]/category-list.tsx`. `/events` works the same way (`?when=`, `?featured=`,
  `?page=`). The database reads are cached for 60 s under the `articles` tag
  (`src/lib/articles/category.ts`). Saving or deleting an article in the admin expires the tag and
  the pages, so changes show at once. Changes made directly in the database show within 60 seconds.

### Home page

`/` is ISR (60 s). All sections load in parallel and are filled top to bottom without repeating an
article (`arrangeHomeSections` in `src/lib/articles/home.ts`). A section with nothing to show is left
out and the section numbers close up.

| Section                | Content                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| Ticker (every page)    | 3 newest "Шинэ мэдээ" (`is_breaking`) articles                         |
| Hero                   | Search (`/search?q=`) and the newest "Онцлох" article                  |
| Онцлох                 | The next 4 "Онцлох" articles                                           |
| Олимпиад               | Olympiads still taking registrations, closing soonest first (scroller) |
| Мэдүүштэй              | 5 "Мэдүүштэй" articles + the "Тусгай нийтлэл" banner (see below)       |
| Салбар бүрээс          | Newest article of each "Нүүрэнд харуулах" category + the next event    |
| Удахгүй болох эвентүүд | The 3 events after that one (`events` table)                           |

**Тусгай нийтлэл:** the newest article marked "Нүүрний том баннер" in the editor whose last day
(optional, Ulaanbaatar time, inclusive) has not passed. It is a paid placement, so it is reserved
before the other sections are filled and never also shows in the hero or Онцлох. With no marked
article, the newest "Мэдүүштэй" article with a cover is used. Duplicating an article clears the mark.

Ad slots `home_1`–`home_4` follow Онцлох, Мэдүүштэй, Салбар бүрээс and the events, and hide with
them. Event lists are cached under the `events` tag (60 s).

### Ads

`/admin/ads` (all staff) lists ads with their image, placement, dates, impressions, clicks and CTR,
and switches them on and off. The dashboard lists ads that end within 3 days.

- **Images:** a desktop image and, for full-width placements, an optional phone image (shown under
  640 px). They are resized in the browser like article covers, into `media/ads/{id}/`. The slot
  keeps the recommended proportions and crops anything else.
- **Dates:** start and end are days in Ulaanbaatar; the end day is included.
- **Slots:** `<AdSlot placement="…" />` shows one running ad (active and inside its dates), at random
  when several share a placement, and renders nothing when there is none. The running ads are cached
  for 60 s under the `ads` tag; saving in the admin refreshes every page at once. On pages cached
  as a whole (home, category pages, articles) the random choice changes when the page is
  rebuilt (at most once a minute), not per reader.
- **Counting:** links go through `/r/ad/[id]`, which counts the click and answers 302 to the
  advertiser (`rel="sponsored"`). An impression is counted once per page view, when half of the ad
  is on screen. Only the server can count (`record_ad_click`, `record_ad_impression`); no reader
  data is stored.

| Placement      | Where                                                | Size                        |
| -------------- | ---------------------------------------------------- | --------------------------- |
| `home_1`–`4`   | Home, under Онцлох, Мэдүүштэй, Салбар бүрээс, events | 1248 × 140, phone 358 × 100 |
| `category_1`   | Category page, under the featured banner             | 1248 × 140, phone 358 × 100 |
| `category_2`   | Category page, after the 6th card                    | 1248 × 140, phone 358 × 100 |
| `category_3`   | Category page, after the list                        | 1248 × 140, phone 358 × 100 |
| `article_side` | Article page, side column                            | 300 × 250                   |

### Events

`/admin/events` works like the article editor and shares its parts (`components/admin/editor/`):
the rich-text editor, the cover upload with its share image (`media/events/{id}/`), the slug
check, publish now or schedule, preview in Draft Mode, and the unpublish confirmation. Start and end
are entered in Ulaanbaatar time; the type is one of Хурал, Хакатон, Үзэсгэлэн, Сургалт, Тэмцээн,
Бусад (stored as keys, see `config/events.ts`).

- **`/events`:** upcoming (soonest first) or past (newest first), all or featured only:
  `?when=past`, `?featured=1`, `?page=N`. An event counts as upcoming until its end (or its start,
  without an end) has passed, so running events stay listed. Rows on desktop, cards on phones.
- **`/events/{slug}`:** facts box (organizer, time, place with a Google Maps link, price, phone as a
  `tel:` link, registration), "Календарт нэмэх" (an `.ics` file from `/events/{slug}/calendar`),
  share row, related events, Open Graph like articles and schema.org `Event` and
  `BreadcrumbList` JSON-LD.
- **Home page:** section 05 and the "Эвентүүд" tile of section 04 read the same events.
- **Refreshing:** saving or deleting an event expires the `events` cache and the home page,
  `/events` and the event's page at once.
- **Articles** can no longer use the "Эвентүүд" category: `/events/{slug}` always shows an event.

### Search

`/search` finds published articles and events in one ranked list: `?q=`, `?category=` (an
article category, or `events`), `?tag=` (articles only; the tag chips under articles link here) and
`?page=N`, 10 per page. The form is a plain GET form, so it works without JavaScript.

- **Matching** is the Postgres function `search_content()` (migration `…_search.sql`): full-text on
  title and excerpt (`'simple'` config, the last word as a prefix, so "олимп" finds "Олимпиадын"),
  then a trigram fallback on the title for typos and word endings ("олимпад", "тэтгэлгийн
  хөтөлбөр"). Full-text matches rank first. It reads the `published_*` views, so drafts are never
  found. Tune the typo tolerance with `pg_trgm.word_similarity_threshold` on the function (0.55).
- **Before anything is typed:** the 5 most read articles (last 30 days) and the popular tags.
  **No results:** tips, a link without the category or tag filter, and the popular tags.
- **Pages:** the matched words are marked in lime. Result pages are `noindex`; the bare `/search`
  is not. The header's search icon lands on `/search` with the input focused.
- **Caching:** results are cached for 60 s under the `articles` and `events` tags, so saving
  either in the admin shows in search at once.

### Info pages

`/about`, `/faq`, `/editorial-policy`, `/privacy` and `/partner` are edited in `/admin/pages` (all
staff): title, lead (also the meta description), body in the article editor, plus each page's own
parts: Үндэслэл blocks, vision and mission, and the team (photo, name, role) on `/about`; the
questions on `/faq`; the benefits on `/partner`. Lists can be added to, reordered (↑ ↓) and deleted
from; the order shown is the order saved. Saving publishes at once (no drafts) and refreshes the
page. `/advertise`, `/submit` and `/contact` are fixed layouts whose forms come in step 13.

- **Layout:** `InfoPageLayout` (`src/components/site/`): eyebrow, title, lead, an 8-column body and
  the info pages beside it on desktop.
- **Names in text:** `{сайтын нэр}` in any page text becomes `siteConfig.name`, and
  `{компанийн нэр}` becomes `siteConfig.legalName` (the privacy policy's data controller).
- **Placeholders:** team members named `[...]` and contact details in `siteConfig` that are still
  `[...]` are not shown. While `legalName` is `[...]`, paragraphs with `{компанийн нэр}` are left
  out.
- **FAQ:** native `<details>` accordion and FAQPage JSON-LD. Answers are plain text; a blank line
  starts a new paragraph.
- **Redirects:** `/redakts` and `/hamtrah` answer 301 (in `next.config.ts`).
- **Starting text** comes from migration `…_info_page_content.sql`, so `db push` brings it to the
  hosted site. It only fills pages, blocks and questions that are still empty, never edited ones.
  The team placeholders are in `seed.sql` (local only). The privacy policy is a draft and says so
  at the top; the company fills in `[ХУГАЦАА]` and `siteConfig.legalName` before approving it.

### Forms and inbox

`SubmissionForm` (`src/components/site/submission-form.tsx`) is the form on `/contact`, `/advertise`,
`/partner` and `/submit` (kind `contact`, `ad`, `partner`, `news`; news adds a headline and a
files link). One zod schema (`src/lib/submissions/schema.ts`) checks it in the browser and again
in the server action. Phones are stored as `+976XXXXXXXX`; a phone or an email is required.

- **Spam:** Cloudflare Turnstile (verified on the server), a hidden honeypot field (bots get a
  fake "sent"), at least 3 seconds to fill in, and 5 forms per IP per hour. The IP is never
  stored: `ip_hash` is a salted SHA-256 (`IP_HASH_SALT`).
- **Email:** each saved form is emailed to `NOTIFY_EMAIL` through Resend, after the visitor has
  their answer. If sending fails the submission is still saved and the error is logged. Until a
  domain is verified in Resend, mail comes from `onboarding@resend.dev`, which only delivers to
  the Resend account's own address.
- **`/admin/inbox`** (admins only): tabs by form, status filter (spam has its own), a drawer with
  every field, `tel:`/`mailto:` links, status and an internal note. "Шинэ" ones are counted in
  the sidebar and on the dashboard. The email links straight to the drawer (`?id=`).
- **Staff sign-in and password reset** use Turnstile too, plus 10 attempts per IP hash in 15
  minutes (table `auth_attempts`): sign-in runs on the server, so Supabase's own limit sees the
  server's address, not the visitor's.
- **Local testing:** Cloudflare's test keys (in `.env.example`) always pass.

### Reader accounts and comments

Readers sign in only to comment, at `/login` ("Google-ээр нэвтрэх" or a one-time link by email,
which also creates the account) and come back through `/auth/callback?next=<page>` to the article
they came from. The page travels in the link itself, so an emailed link opened in another browser
or a mail app still lands on the article; Google keeps the PKCE flow. Staff keep signing in at
`/admin/login`. New readers get the role `reader` and a display name from Google or the email
address; `/account` changes it once, signs out, and deletes the account.

- **Comments** load in the browser when the section nears the screen, so article pages stay
  cached. Newest first, 20 at a time ("Цааш унших"), one level of replies. Authors edit or
  delete their own for 15 minutes; others can "Мэдэгдэх" (report) once.
- **Deleting keeps replies:** a comment others answered becomes "Устгагдсан сэтгэгдэл" (no text,
  no author, no actions) instead of disappearing, whether its author deletes it or deletes their
  account; comments without replies are deleted, and a tombstone goes once its last reply does
  (migration `…_comment_tombstones.sql`). Staff deleting in `/admin/comments` remove the thread.
- **The rules live in the database** (migration `…_comments.sql`), because readers can call the
  API with their own token: 1 comment per 30 seconds, banned readers and closed articles refused,
  status and counts set by the database, and a word list (`comment_needs_review`) that holds a
  comment hidden for review. To change the list, replace that function in a new migration.
- **`/admin/comments`** (all staff): newest, most reported, hidden; hide or show, delete, and ban
  or unban the author (readers only). "Сэтгэгдэл хаах" in the article editor closes an article.
- **Tests:** `npm test` (Vitest) checks the server actions' permission rules; `npm run db:test`
  checks the database rules.
- **Hosted setup:** paste `supabase/templates/magic-link.html` ("Magic link") and
  `confirmation.html` ("Confirm signup") into Authentication → Emails; their links are
  `{{ .RedirectTo }}&token_hash=…`, so they only work with the site's sign-in form, which always
  sends `/auth/callback?next=…`. Under URL Configuration, set the Site URL to the site and add
  `https://<your-domain>/**` to Redirect URLs; enable Google under Authentication → Providers (Google Cloud OAuth client, redirect URI
  `https://<project-ref>.supabase.co/auth/v1/callback`). Locally Google is off: set
  `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `…_SECRET` and `enabled = true` in
  `supabase/config.toml` to try it.

### SEO and performance

- **Indexing switch:** until `NEXT_PUBLIC_ALLOW_INDEXING=1` is set, robots.txt disallows
  everything and every response says `noindex, nofollow` (an `X-Robots-Tag` header and the page's
  robots meta), so a deployment with test content, such as `olymo-new.vercel.app`, never shows up
  in Google. Set it for Production only, at launch, and redeploy; Preview deployments stay hidden.
- **Sitemap:** `/sitemap-index.xml` lists `/sitemap/0.xml`, `/sitemap/1.xml`, …: the home page,
  categories, info pages, then every published article and event with its last change, 5000 URLs
  to a file (`src/lib/sitemap.ts`). New files appear by themselves as the site grows. Give
  `https://<domain>/sitemap-index.xml` to Google Search Console. (`/sitemap.xml` is reserved by
  Next.js and answers 404.)
- **robots.txt**, once indexing is on, allows everything except `/admin`, `/account`, `/search`, `/auth`, the ad click
  redirects (`/r/`) and the internal `/list-views/`, and points to the sitemap index.
- **RSS:** `/rss.xml`, the 50 newest articles; the home page links it.
- **Share images:** `app/opengraph-image.tsx` draws the default 1200 × 630 card (paper, the name
  in Unbounded, the accent square, the tagline). Articles and events use their cover crop, or
  without a cover a card with their title from `/og/articles/{slug}` and `/og/events/{slug}`
  (cached for a year; the URL changes with every save). The fonts for these images are the TTF
  files in `assets/fonts/` (SIL Open Font License, see the OFL files there), since the site's
  woff2 files cannot be used. `app/icon.tsx` and `app/apple-icon.tsx` draw the brand mark.
- **Structured data:** `Organization` and `WebSite` with a search box on the home page,
  `NewsArticle` and `BreadcrumbList` on articles, `Event` and `BreadcrumbList` on events,
  `FAQPage` on `/faq` (`src/lib/json-ld.ts`, `<JsonLd>`).
- **Meta:** every page has a canonical URL built from `NEXT_PUBLIC_SITE_URL`, `og:locale`
  `mn_MN`, and `fb:app_id` when `NEXT_PUBLIC_FACEBOOK_APP_ID` is set.
- **JavaScript:** public pages load little of it. The account menu and Supabase's browser client
  load only when a session cookie exists, the comments only near the comment section, and client
  components get their labels as props instead of the whole `messages/mn.json`. Tiptap loads in
  `/admin` only. `npm run analyze` opens a map of every bundle.
- **Fonts:** `src/lib/fonts.ts` loads only the weights in use, with `display: swap`.
- **Lighthouse** (mobile, local production build, median of 3, step 15): `/`, `/olympiad` and an
  article all score 93 Performance, 100 Accessibility, 100 SEO, 100 Best Practices.
- **Vercel Analytics and Speed Insights** load only when `VERCEL_ANALYTICS=1` and
  `VERCEL_SPEED_INSIGHTS=1` are set (see Deploy).

### Errors, 404 and loading

- **404:** `(site)/not-found.tsx` shows "404", "Хуудас олдсонгүй", a search box and the 4 newest
  articles inside the site's header and footer, with a real 404 status. Missing articles,
  categories and events check before the page streams (`[category]/(list)/layout.tsx`,
  `[category]/[slug]/layout.tsx`), because a status cannot change once streaming starts. Admin
  addresses get their own 404 inside the admin menu (`admin/(panel)/not-found.tsx`).
- **Errors:** `error.tsx` (site, admin, root) and `global-error.tsx` show "Алдаа гарлаа" with
  "Дахин оролдох" and an error code. The server logs every error with that code
  (`src/instrumentation.ts` → `src/lib/error-reporting.ts`) and, when `SENTRY_DSN` is set, sends
  it to Sentry (server errors only, a minimal reporter without the Sentry SDK).
- **Loading:** home, category, article and search pages show the page's outline with striped
  placeholders while they load (`loading.tsx`, `components/site/skeleton.tsx`).
- **Accessibility:** skip link, 2 px focus ring (lime on dark sections), alerts for form errors,
  reduced motion respected. `e2e/a11y.spec.ts` runs axe on every public page.

### Browser tests

`e2e/` holds Playwright tests that run against a production build and the local Supabase with
its sample content:

- `smoke.spec.ts`: home, an article, search, the contact form (Turnstile test keys), staff sign-in
  and a draft article. Test rows are deleted afterwards.
- `a11y.spec.ts`: axe (WCAG 2.1 AA and best practices) on every public page.
- `layout.spec.ts`: no page scrolls sideways at 360, 390, 768, 1024 or 1440 px.
- `article-editor.spec.ts`: inserts every block type through "/" and the toolbar, publishes, and
  checks the article page at 390 and 1440 px (YouTube, X and Google Maps requests are answered
  locally). The test article and its images are deleted afterwards.

```bash
npx playwright install chromium        # once
npm run build                          # with the Turnstile test keys in .env.local
E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… npm run test:e2e
```

`E2E_ADMIN_*` is a local staff account (`npm run admin:create`). GitHub Actions
(`.github/workflows/ci.yml`) runs lint, typecheck, unit and database tests, the build and these
browser tests on every pull request, against a fresh local Supabase.

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

| Command                 | What it does                                            |
| ----------------------- | ------------------------------------------------------- |
| `npm run dev`           | Start the dev server with hot reload                    |
| `npm run build`         | Production build                                        |
| `npm run start`         | Serve the production build (run `build` first)          |
| `npm run analyze`       | Webpack build that opens a map of every JS bundle       |
| `npm run test`          | Unit tests (Vitest)                                     |
| `npm run test:e2e`      | Browser tests (Playwright; see Browser tests)           |
| `npm run lint`          | ESLint, then `check:samples`                            |
| `npm run typecheck`     | Generate Next.js route types, then `tsc --noEmit`       |
| `npm run format`        | Format all files with Prettier (sorts Tailwind classes) |
| `npm run db:types`      | Regenerate Supabase types from the local database       |
| `npm run db:test`       | Run the database tests (local Supabase must be running) |
| `npm run check:samples` | Check that no migration carries sample content          |
| `npm run admin:create`  | Create or promote an admin (see Admin area)             |

Before merging, `lint`, `typecheck` and `build` must all pass.

## Environment variables

All configuration comes from env vars. `.env.example` lists every variable with a comment. Copy it to
`.env.local` for local work. `.env*.local` files are git-ignored.

| Variable                               | Required  | Description                                                  |
| -------------------------------------- | --------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`                 | yes       | Public base URL, no trailing slash. The build fails if unset |
| `NEXT_PUBLIC_ALLOW_INDEXING`           | at launch | `1` lets search engines index the site (Production only)     |
| `NEXT_PUBLIC_SUPABASE_URL`             | yes       | Supabase API URL                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes       | Publishable key; safe in the browser, RLS applies            |
| `SUPABASE_SECRET_KEY`                  | yes       | Secret (service role) key; server only, bypasses RLS         |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`       | yes       | Cloudflare Turnstile site key (forms, staff sign-in)         |
| `TURNSTILE_SECRET_KEY`                 | yes       | Cloudflare Turnstile secret key; server only                 |
| `IP_HASH_SALT`                         | yes       | Secret salt for hashing visitor IPs (rate limits)            |
| `RESEND_API_KEY`                       | no        | Resend key for new-submission emails                         |
| `NOTIFY_EMAIL`                         | no        | Who gets those emails                                        |
| `EMAIL_FROM`                           | no        | Sender once a domain is verified in Resend                   |
| `NEXT_PUBLIC_FACEBOOK_APP_ID`          | no        | Facebook app ID: Messenger button on desktop, `fb:app_id`    |
| `VERCEL_ANALYTICS`                     | no        | `1` turns on Vercel Web Analytics                            |
| `VERCEL_SPEED_INSIGHTS`                | no        | `1` turns on Vercel Speed Insights                           |
| `SENTRY_DSN`                           | no        | Sends server errors to Sentry                                |

## Project layout

```
design/              visual spec (reference only, not shipped)
messages/mn.json     all UI text, read through t() from src/lib/i18n.ts
src/app/             routes, root layout, global styles and design tokens (globals.css)
src/components/ui/   shared UI primitives (Button, …)
src/config/          siteConfig, routes and reserved slugs, category types and helpers
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
6. Optional: in the project's **Analytics** and **Speed Insights** tabs click **Enable** (both have
   a free tier), then set `VERCEL_ANALYTICS=1` and `VERCEL_SPEED_INSIGHTS=1` for Production and
   redeploy.
7. In Google Search Console, add the domain and submit `https://<domain>/sitemap-index.xml`.

### Launch checklist

1. Fill in `siteConfig` in `src/config/site.ts`: the name (now "НЭР"), the legal name, email,
   phone and address (placeholders in brackets are hidden on the site until replaced).
2. In `/admin/pages`, finish the privacy policy (the `[ХУГАЦАА]` marks and the draft note) and add
   the team.
3. If test content was ever added to the hosted database, review and run
   `supabase/launch/remove-sample-content.sql` in its SQL editor (it removes only rows still marked
   `[ЖИШЭЭ]` and `[Нэр]` placeholders), and delete other test articles in `/admin`.
4. Set `NEXT_PUBLIC_ALLOW_INDEXING=1` for Production and redeploy, then submit the sitemap
   (step 7 above).
