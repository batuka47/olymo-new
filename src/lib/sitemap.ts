import "server-only";
import type { MetadataRoute } from "next";
import { categoryPath, isArticleCategory } from "@/config/categories";
import { eventPath } from "@/config/events";
import { routes } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { sitePages } from "@/config/site-pages";
import { articlePath } from "@/lib/articles/status";
import { getActiveCategories } from "@/lib/categories/queries";
import { mediaUrl } from "@/lib/media";
import { createPublicClient } from "@/lib/supabase/server";

type SitemapEntry = MetadataRoute.Sitemap[number];

/** Google accepts 50,000 per file; smaller files are quicker to fetch and to read. */
export const URLS_PER_SITEMAP = 5000;
/** Supabase returns at most 1000 rows per request. */
const ROWS_PER_REQUEST = 1000;

/**
 * Pages that are always there, in the first sitemap: home, the active categories (events too), the
 * info pages and forms. /search, /login and /account are left out.
 */
async function fixedPaths(): Promise<string[]> {
  const categories = await getActiveCategories();
  return [
    routes.home,
    ...categories.map((category) => categoryPath(category.slug)),
    ...sitePages.map((page) => page.href),
    routes.advertise,
    routes.submit,
    routes.contact,
  ];
}

const absolute = (path: string) => `${siteConfig.url}${path}`;

async function countRows(table: "articles" | "events"): Promise<number> {
  // RLS on the public client: published and due only.
  const { count, error } = await createPublicClient()
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function countSitemapUrls(): Promise<number> {
  const [paths, articles, events] = await Promise.all([
    fixedPaths(),
    countRows("articles"),
    countRows("events"),
  ]);
  return paths.length + articles + events;
}

/** How many sitemap files the URLs fill; at least one. */
export async function countSitemaps(): Promise<number> {
  return Math.max(1, Math.ceil((await countSitemapUrls()) / URLS_PER_SITEMAP));
}

/** The newest change to the content a fixed page lists. */
async function fixedPageDates(): Promise<Map<string, string>> {
  const supabase = createPublicClient();
  const latestArticle = (categorySlug?: string) => {
    const query = supabase.from("articles").select("updated_at");
    return (categorySlug ? query.contains("category_slugs", [categorySlug]) : query)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  };
  const articleCategories = (await getActiveCategories()).filter(isArticleCategory);
  const [home, events, pages, ...byCategory] = await Promise.all([
    latestArticle(),
    supabase
      .from("events")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("site_pages").select("slug, updated_at"),
    ...articleCategories.map((category) => latestArticle(category.slug)),
  ]);

  const dates = new Map<string, string>();
  const set = (path: string, date: string | undefined) => date && dates.set(path, date);
  set(routes.home, home.data?.updated_at);
  set(routes.events, events.data?.updated_at);
  articleCategories.forEach((category, index) =>
    set(categoryPath(category.slug), byCategory[index].data?.updated_at),
  );
  for (const page of sitePages) {
    set(page.href, pages.data?.find((row) => row.slug === page.slug)?.updated_at);
  }
  return dates;
}

/** Rows `from` to `to` (exclusive), newest first, fetched 1000 at a time. */
async function fetchRange<Row>(
  load: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: unknown }>,
  from: number,
  to: number,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let start = from; start < to; start += ROWS_PER_REQUEST) {
    const end = Math.min(start + ROWS_PER_REQUEST, to);
    const { data, error } = await load(start, end - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
  }
  return rows;
}

function articleEntries(from: number, to: number) {
  return fetchRange(
    (start, end) =>
      createPublicClient()
        .from("articles")
        .select("slug, category_slug, updated_at, cover_path")
        .order("publish_at", { ascending: false })
        .order("id")
        .range(start, end),
    from,
    to,
  ).then((rows) =>
    rows.map((article): SitemapEntry => ({
      url: absolute(articlePath(article.category_slug, article.slug)),
      lastModified: article.updated_at,
      images: article.cover_path ? [mediaUrl(article.cover_path)] : undefined,
    })),
  );
}

function eventEntries(from: number, to: number) {
  return fetchRange(
    (start, end) =>
      createPublicClient()
        .from("events")
        .select("slug, updated_at, cover_path")
        .order("starts_at", { ascending: false })
        .order("id")
        .range(start, end),
    from,
    to,
  ).then((rows) =>
    rows.map((event): SitemapEntry => ({
      url: absolute(eventPath(event.slug)),
      lastModified: event.updated_at,
      images: event.cover_path ? [mediaUrl(event.cover_path)] : undefined,
    })),
  );
}

/**
 * Sitemap number `index` (from 0): the fixed pages, then every published article, then every
 * published event, 5000 to a file.
 */
export async function sitemapEntries(index: number): Promise<SitemapEntry[]> {
  const start = index * URLS_PER_SITEMAP;
  const end = start + URLS_PER_SITEMAP;
  const [paths, articleCount, eventCount] = await Promise.all([
    fixedPaths(),
    countRows("articles"),
    countRows("events"),
  ]);

  // Where each kind sits in the combined list, as positions within that kind clipped to this file.
  const slice = (kindStart: number, kindCount: number) => {
    const from = Math.max(start, kindStart) - kindStart;
    const to = Math.min(end, kindStart + kindCount) - kindStart;
    return { from, to, any: from < to };
  };
  const fixed = slice(0, paths.length);
  const articles = slice(paths.length, articleCount);
  const events = slice(paths.length + articleCount, eventCount);

  const [dates, articleRows, eventRows] = await Promise.all([
    fixed.any ? fixedPageDates() : new Map<string, string>(),
    articles.any ? articleEntries(articles.from, articles.to) : [],
    events.any ? eventEntries(events.from, events.to) : [],
  ]);
  const fixedRows = fixed.any
    ? paths
        .slice(fixed.from, fixed.to)
        .map((path): SitemapEntry => ({ url: absolute(path), lastModified: dates.get(path) }))
    : [];
  return [...fixedRows, ...articleRows, ...eventRows];
}
