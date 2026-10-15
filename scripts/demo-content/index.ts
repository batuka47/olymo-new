// Fills the LOCAL database with demo content, so the design can be judged with every space in use:
//
//   npm run demo:fill    67 articles, 15 events, 8 ads, 2 quizzes, comments and a team, with photos
//   npm run demo:clear   removes all of it again
//
// Local only: it refuses a Supabase URL that is not on this computer, so demo news never reaches
// the hosted site. Photos come from picsum.photos, so filling needs the internet. While the demo is
// in, the [ЖИШЭЭ] samples of seed.sql are unpublished; demo:clear publishes them again.
//
// Reads NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY from
// .env.local. Runs with --conditions=react-server (package.json) because the article renderer is
// server-only.
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { adFormat } from "../../src/config/ads";
import { ulaanbaatarDate } from "../../src/lib/dates";
import { renderArticleHtml } from "../../src/lib/editor/render-html";
import {
  adFolder,
  adImagePath,
  articleCoverPath,
  articleFolder,
  eventCoverPath,
  eventFolder,
  MEDIA_BUCKET,
  quizFolder,
  teamFolder,
} from "../../src/lib/media";
import { quizInputSchema, toSaveQuizPayload } from "../../src/lib/quizzes/schema";
import { slugFromTitle } from "../../src/lib/slug";
import type { Database } from "../../src/lib/supabase/types";
import { articleText, SHOWCASE_PHOTO_COUNTS } from "./article-bodies";
import { demoArticles, type DemoArticle } from "./articles";
import { bannerHtml, demoAds } from "./ads";
import { bulletList, doc, heading, paragraph } from "./body";
import { demoEvents, type DemoEvent } from "./events";
import { DEMO_ID_RANGE, demoId, isDemoId } from "./ids";
import { uploadBodyPhoto, uploadCover, uploadDrawing } from "./images";
import { DEMO_AUTHORS, DEMO_TAGS, demoComments, demoReaders, demoTeam, SEED_TAGS } from "./people";
import { demoQuizzes, mathQuiz, scienceQuiz } from "./quizzes";

type Client = SupabaseClient<Database>;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const LOCAL_HOSTS = ["127.0.0.1", "localhost"];
const SAMPLE_MARKER = "[ЖИШЭЭ]";
/** Rows uploaded at the same time; each article downloads up to a dozen photos. */
const BATCH_SIZE = 6;
const DEMO_LINK = "https://example.com/";

// --- Setup -------------------------------------------------------------------------------------

function readEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set. See .env.example.`);
  }
  return value;
}

function connectToLocalDatabase(): Client {
  if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!LOCAL_HOSTS.includes(new URL(url).hostname)) {
    throw new Error(
      `Demo content is for the local database only, and ${url} is not local. Nothing was changed.`,
    );
  }
  return createClient<Database>(url, readEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function check(error: { message: string } | null, doing: string): void {
  if (error) {
    throw new Error(`Could not ${doing}: ${error.message}`);
  }
}

async function inBatches<T>(items: T[], work: (item: T, index: number) => Promise<void>) {
  for (let start = 0; start < items.length; start += BATCH_SIZE) {
    const batch = items.slice(start, start + BATCH_SIZE);
    await Promise.all(batch.map((item, offset) => work(item, start + offset)));
  }
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR_MS).toISOString();
}

function dayFromToday(days: number): string {
  return ulaanbaatarDate(new Date(Date.now() + days * DAY_MS));
}

/** The title's slug, with -2, -3, … when a row (a hidden sample, say) already has it. */
function uniqueSlug(title: string, taken: Set<string>): string {
  const base = slugFromTitle(title);
  let slug = base;
  for (let suffix = 2; taken.has(slug); suffix += 1) {
    slug = `${base}-${suffix}`;
  }
  taken.add(slug);
  return slug;
}

async function takenSlugs(supabase: Client, table: "articles" | "events"): Promise<Set<string>> {
  const { data, error } = await supabase.from(table).select("slug");
  check(error, `read ${table}`);
  return new Set((data ?? []).map((row) => row.slug));
}

/** A steady spread of view counts, so "Хамгийн их уншсан" has an order. */
function viewCount(index: number): number {
  return 120 + (((index + 1) * 7919) % 4800);
}

// --- Fill --------------------------------------------------------------------------------------

async function addTags(supabase: Client) {
  const { error } = await supabase
    .from("tags")
    .upsert([...SEED_TAGS, ...DEMO_TAGS], { onConflict: "slug", ignoreDuplicates: true });
  check(error, "add tags");
}

async function addQuizzes(supabase: Client) {
  for (const quiz of demoQuizzes) {
    const input = quizInputSchema.parse({ ...quiz, isActive: true });
    const { error } = await supabase.rpc("save_quiz", { quiz: toSaveQuizPayload(input) });
    check(error, `save the quiz "${quiz.title}"`);
  }
}

function articleDemoId(index: number): string {
  return demoId("article", index + 1);
}

async function articlePhotos(supabase: Client, article: DemoArticle, id: string, seed: string) {
  const count = article.showcase ? SHOWCASE_PHOTO_COUNTS[article.showcase] : 0;
  return Promise.all(
    Array.from({ length: count }, (_, number) =>
      uploadBodyPhoto(supabase, articleFolder(id), `${seed}-body-${number + 1}`),
    ),
  );
}

function olympiadColumns(article: DemoArticle) {
  const facts = article.olympiad;
  if (!facts) {
    return {};
  }
  return {
    subject: facts.subject,
    level_text: facts.level,
    registration_deadline: dayFromToday(facts.deadlineInDays),
    exam_date: dayFromToday(facts.examInDays),
    audience: facts.audience,
    location: facts.location,
    fee_text: facts.fee,
    organizer: facts.organizer,
    registration_url: DEMO_LINK,
  };
}

async function addArticle(
  supabase: Client,
  article: DemoArticle,
  index: number,
  slugs: Set<string>,
) {
  const id = articleDemoId(index);
  const seed = `olymo-demo-article-${index + 1}`;
  const coverPath = article.noCover
    ? null
    : await uploadCover(supabase, seed, (token, width) =>
        articleCoverPath(id, token, width, "jpg"),
      );
  const photos = await articlePhotos(supabase, article, id, seed);
  const body = doc(
    articleText(article, index, { photos, quizzes: { math: mathQuiz, science: scienceQuiz } }),
  );

  const { error } = await supabase.from("articles").insert({
    id,
    slug: uniqueSlug(article.title, slugs),
    title: article.title,
    excerpt: article.excerpt,
    body_json: body,
    body_html: renderArticleHtml(body),
    category_slug: article.category,
    cover_path: coverPath,
    cover_alt: coverPath ? "Жишээ зураг" : null,
    cover_caption: coverPath ? (article.coverCaption ?? null) : null,
    cover_position: article.coverPosition ?? "below",
    author_name: DEMO_AUTHORS[index % DEMO_AUTHORS.length],
    status: "published",
    publish_at: hoursAgo(article.hoursAgo),
    is_featured: article.featured ?? false,
    is_good_to_know: article.goodToKnow ?? false,
    is_breaking: article.breaking ?? false,
    is_special: article.special ?? false,
    special_until: article.special ? dayFromToday(14) : null,
    view_count: viewCount(index),
    ...olympiadColumns(article),
  });
  check(error, `add the article "${article.title}"`);

  for (const category of article.alsoIn ?? []) {
    const { error: categoryError } = await supabase
      .from("article_categories")
      .insert({ article_id: id, category_slug: category });
    check(categoryError, `add ${category} to "${article.title}"`);
  }
  for (const tag of article.tags ?? []) {
    const { error: tagError } = await supabase
      .from("article_tags")
      .insert({ article_id: id, tag_slug: tag });
    check(tagError, `tag "${article.title}" with ${tag}`);
  }
}

async function addArticles(supabase: Client) {
  const slugs = await takenSlugs(supabase, "articles");
  await inBatches(demoArticles, (article, index) => addArticle(supabase, article, index, slugs));
}

function eventText(event: DemoEvent) {
  return doc([
    paragraph(event.excerpt),
    heading("Хөтөлбөр"),
    bulletList(event.programme),
    paragraph(
      "Бүртгэл болон дэлгэрэнгүй мэдээллийг зохион байгуулагчийн цахим хуудаснаас авна уу.",
    ),
  ]);
}

/** Events still to come were announced over the last days; past ones two weeks before. */
function eventAnnouncedHoursAgo(event: DemoEvent, index: number): number {
  return event.startsInDays > 0 ? (index + 1) * 18 : (14 - event.startsInDays) * 24;
}

async function addEvent(supabase: Client, event: DemoEvent, index: number, slugs: Set<string>) {
  const id = demoId("event", index + 1);
  const hour = String(event.startHour).padStart(2, "0");
  const startsAt = new Date(`${dayFromToday(event.startsInDays)}T${hour}:00:00+08:00`);
  const coverPath = await uploadCover(supabase, `olymo-demo-event-${index + 1}`, (token, width) =>
    eventCoverPath(id, token, width, "jpg"),
  );
  const body = eventText(event);

  const { error } = await supabase.from("events").insert({
    id,
    slug: uniqueSlug(event.title, slugs),
    title: event.title,
    excerpt: event.excerpt,
    body_json: body,
    body_html: renderArticleHtml(body),
    event_type: event.type,
    organizer: event.organizer,
    starts_at: startsAt.toISOString(),
    ends_at: new Date(startsAt.getTime() + event.hours * HOUR_MS).toISOString(),
    location: event.location,
    price_text: event.price,
    registration_url: DEMO_LINK,
    cover_path: coverPath,
    cover_alt: "Жишээ зураг",
    is_featured: event.featured ?? false,
    status: "published",
    publish_at: hoursAgo(eventAnnouncedHoursAgo(event, index)),
  });
  check(error, `add the event "${event.title}"`);
}

async function addEvents(supabase: Client) {
  const slugs = await takenSlugs(supabase, "events");
  await inBatches(demoEvents, (event, index) => addEvent(supabase, event, index, slugs));
}

async function addAds(supabase: Client) {
  const browser = await chromium.launch();
  try {
    for (const [index, ad] of demoAds.entries()) {
      const id = demoId("ad", index + 1);
      const format = adFormat(ad.placement);
      const shape = ad.placement === "article_side" ? "box" : "wide";
      const imagePath = await uploadDrawing(
        supabase,
        browser,
        bannerHtml(ad, shape),
        format.desktop,
        (token, width) => adImagePath(id, "desktop", token, width, "jpg"),
      );
      const mobilePath = format.mobile
        ? await uploadDrawing(
            supabase,
            browser,
            bannerHtml(ad, "phone"),
            format.mobile,
            (token, width) => adImagePath(id, "mobile", token, width, "jpg"),
          )
        : null;

      const { error } = await supabase.from("ads").insert({
        id,
        title: `${ad.advertiser}: ${ad.headline}`,
        image_path: imagePath,
        image_path_mobile: mobilePath,
        link_url: DEMO_LINK,
        placement: ad.placement,
        starts_at: hoursAgo(10 * 24),
        ends_at: new Date(Date.now() + 60 * DAY_MS).toISOString(),
        is_active: true,
        impression_count: viewCount(index) * 12,
        click_count: Math.round(viewCount(index) / 10),
      });
      check(error, `add the ad of ${ad.advertiser}`);
    }
  } finally {
    await browser.close();
  }
}

async function addReaders(supabase: Client) {
  for (const [index, name] of demoReaders.entries()) {
    const { error } = await supabase.auth.admin.createUser({
      id: demoId("reader", index + 1),
      email: `demo-reader-${index + 1}@example.com`,
      password: randomUUID(),
      email_confirm: true,
      user_metadata: { display_name: name },
    });
    check(error, `add the reader ${name}`);
  }
}

async function addComments(supabase: Client) {
  const rows = demoComments.map((comment, index) => ({
    id: demoId("comment", index + 1),
    article_id: articleDemoId(demoArticles.findIndex((a) => a.title === comment.article)),
    user_id: demoId("reader", comment.reader + 1),
    parent_id: comment.replyTo === undefined ? null : demoId("comment", comment.replyTo + 1),
    body: comment.body,
    author_name: demoReaders[comment.reader],
    created_at: hoursAgo(comment.hoursAgo),
  }));
  check((await supabase.from("comments").insert(rows)).error, "add comments");
}

async function addTeam(supabase: Client) {
  const rows = demoTeam.map((member, index) => ({
    id: demoId("team", index + 1),
    name: member.name,
    role: member.role,
    sort_order: index,
  }));
  check((await supabase.from("team_members").insert(rows)).error, "add the team");
}

/** Hides (or shows again) the [ЖИШЭЭ] rows of seed.sql, which would sit among the demo. */
async function setSamplesPublished(supabase: Client, published: boolean) {
  const [from, to] = published ? ["draft", "published"] : ["published", "draft"];
  for (const table of ["articles", "events"] as const) {
    const { error } = await supabase
      .from(table)
      .update({ status: to })
      .like("title", `${SAMPLE_MARKER}%`)
      .eq("status", from);
    check(error, `update the samples in ${table}`);
  }
}

async function fill(supabase: Client) {
  await clear(supabase);
  const steps: [string, (supabase: Client) => Promise<void>][] = [
    ["tags", addTags],
    ["quizzes", addQuizzes],
    [`${demoArticles.length} articles with photos (takes a minute or two)`, addArticles],
    [`${demoEvents.length} events`, addEvents],
    [`${demoAds.length} ads`, addAds],
    ["readers", addReaders],
    ["comments", addComments],
    ["team", addTeam],
  ];
  for (const [label, step] of steps) {
    console.log(`Adding ${label}…`);
    await step(supabase);
  }
  await setSamplesPublished(supabase, false);
  console.log("Demo content added. Pages are cached for a minute: refresh after that to see it.");
}

// --- Clear -------------------------------------------------------------------------------------

/** Demo image folders: articles/{demo id}/, events/…, ads/…, quizzes/…, team/…. */
const DEMO_FOLDER_PARENTS = [
  articleFolder(""),
  eventFolder(""),
  adFolder(""),
  quizFolder(""),
  teamFolder(""),
].map((folder) => folder.replace(/\/$/, ""));

async function removeDemoImages(supabase: Client) {
  const bucket = supabase.storage.from(MEDIA_BUCKET);
  for (const parent of DEMO_FOLDER_PARENTS) {
    const { data: folders, error } = await bucket.list(parent, { limit: 1000 });
    check(error, `list ${parent}/`);
    for (const folder of (folders ?? []).filter((entry) => isDemoId(entry.name))) {
      const { data: files, error: listError } = await bucket.list(`${parent}/${folder.name}`, {
        limit: 1000,
      });
      check(listError, `list ${parent}/${folder.name}/`);
      const paths = (files ?? []).map((file) => `${parent}/${folder.name}/${file.name}`);
      if (paths.length > 0) {
        check((await bucket.remove(paths)).error, `remove ${parent}/${folder.name}/`);
      }
    }
  }
}

async function removeDemoRows(supabase: Client) {
  // Comments, tags, categories and quiz questions go with their rows (on delete cascade).
  for (const table of ["articles", "events", "ads", "quizzes", "team_members"] as const) {
    const { error } = await supabase
      .from(table)
      .delete()
      .gte("id", DEMO_ID_RANGE.first)
      .lte("id", DEMO_ID_RANGE.last);
    check(error, `remove demo ${table}`);
  }
}

async function removeDemoReaders(supabase: Client) {
  for (const index of demoReaders.keys()) {
    const { error } = await supabase.auth.admin.deleteUser(demoId("reader", index + 1));
    if (error && error.status !== 404) {
      check(error, "remove a demo reader");
    }
  }
}

async function removeUnusedDemoTags(supabase: Client) {
  for (const tag of DEMO_TAGS) {
    const { count, error } = await supabase
      .from("article_tags")
      .select("tag_slug", { count: "exact", head: true })
      .eq("tag_slug", tag.slug);
    check(error, `count the articles tagged ${tag.slug}`);
    if (count === 0) {
      check((await supabase.from("tags").delete().eq("slug", tag.slug)).error, "remove a tag");
    }
  }
}

async function clear(supabase: Client) {
  console.log("Removing earlier demo content…");
  await removeDemoRows(supabase);
  await removeDemoReaders(supabase);
  await removeDemoImages(supabase);
  await removeUnusedDemoTags(supabase);
  await setSamplesPublished(supabase, true);
}

// --- Command -----------------------------------------------------------------------------------

async function main() {
  const command = process.argv[2];
  if (command !== "fill" && command !== "clear") {
    throw new Error("Usage: npm run demo:fill, or npm run demo:clear");
  }
  const supabase = connectToLocalDatabase();
  if (command === "fill") {
    await fill(supabase);
  } else {
    await clear(supabase);
    console.log("Demo content removed. Pages are cached for a minute: refresh after that.");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
