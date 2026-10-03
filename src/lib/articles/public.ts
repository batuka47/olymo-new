import "server-only";
import { cache } from "react";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

/** What article cards and lists show. */
export type ArticleSummary = Pick<
  ArticleRow,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "category_slug"
  | "subject"
  | "cover_path"
  | "cover_alt"
  | "publish_at"
  | "updated_at"
  | "registration_deadline"
  | "level_text"
  | "author_name"
>;

export const SUMMARY_COLUMNS =
  "id, slug, title, excerpt, category_slug, subject, cover_path, cover_alt, publish_at, updated_at, registration_deadline, level_text, author_name";

/** unstable_cache tag of cached article lists; article saves expire it (see the admin actions). */
export const ARTICLES_CACHE_TAG = "articles";

/**
 * Lists read through unstable_cache use this: the same data for 60 s (like ISR), so readers never
 * wait for the database, and article saves expire it at once.
 */
export const LIST_CACHE = { revalidate: 60, tags: [ARTICLES_CACHE_TAG] };

const DAY_MS = 24 * 60 * 60 * 1000;
const MOST_READ_DAYS = 30;
/** Tag matches fetched before ranking by the number of shared tags. */
const RELATED_CANDIDATES = 12;

/**
 * Readers get the cookie-free public client (RLS: published and due only). In Draft Mode the
 * staff session is used instead, so drafts and scheduled articles render for preview.
 */
export const getArticle = cache(async (slug: string, preview: boolean) => {
  const supabase = preview ? await createClient() : createPublicClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, article_tags(tags(slug, label))")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
});

export type Article = NonNullable<Awaited<ReturnType<typeof getArticle>>>;

export function articleTags(article: Article) {
  return article.article_tags.flatMap((link) => (link.tags ? [link.tags] : []));
}

/** Newest published articles, prerendered at build time. Others render on their first visit. */
export async function getLatestArticlePaths(limit: number) {
  const { data, error } = await createPublicClient()
    .from("articles")
    .select("slug, category_slug")
    .order("publish_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Loading the latest articles failed", error);
    return [];
  }
  return data;
}

/**
 * Most viewed articles published in the last 30 days. view_count is a lifetime total, so a
 * rolling window keeps the list current without an empty list at the start of each month.
 */
export async function getMostReadArticles(
  excludeId: string | null,
  limit = 4,
): Promise<ArticleSummary[]> {
  const since = new Date(Date.now() - MOST_READ_DAYS * DAY_MS).toISOString();
  let query = createPublicClient()
    .from("articles")
    .select(SUMMARY_COLUMNS)
    .gte("publish_at", since);
  if (excludeId) {
    query = query.neq("id", excludeId);
  }
  const { data, error } = await query
    .order("view_count", { ascending: false })
    .order("publish_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Loading most read articles failed", error);
    return [];
  }
  return data;
}

async function getArticlesSharingTags(
  articleId: string,
  tagSlugs: string[],
  limit: number,
): Promise<ArticleSummary[]> {
  if (tagSlugs.length === 0) {
    return [];
  }
  // The tag filter also trims article_tags to the shared tags, so its length ranks the matches.
  const { data, error } = await createPublicClient()
    .from("articles")
    .select(`${SUMMARY_COLUMNS}, article_tags!inner(tag_slug)`)
    .in("article_tags.tag_slug", tagSlugs)
    .neq("id", articleId)
    .order("publish_at", { ascending: false })
    .limit(RELATED_CANDIDATES);
  if (error) {
    console.error("Loading articles with shared tags failed", error);
    return [];
  }
  return data
    .sort((a, b) => b.article_tags.length - a.article_tags.length)
    .slice(0, limit)
    .map(({ article_tags: _sharedTags, ...card }) => card);
}

async function getLatestInCategory(
  categorySlug: string,
  excludeIds: string[],
  limit: number,
): Promise<ArticleSummary[]> {
  const { data, error } = await createPublicClient()
    .from("articles")
    .select(SUMMARY_COLUMNS)
    .eq("category_slug", categorySlug)
    .not("id", "in", `(${excludeIds.join(",")})`)
    .order("publish_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Loading articles of the same category failed", error);
    return [];
  }
  return data;
}

/** Articles sharing the most tags first (newest among equals), then the newest of the category. */
export async function getRelatedArticles(article: Article, limit = 3): Promise<ArticleSummary[]> {
  const tagSlugs = articleTags(article).map((tag) => tag.slug);
  const byTags = await getArticlesSharingTags(article.id, tagSlugs, limit);
  if (byTags.length === limit) {
    return byTags;
  }
  const excludeIds = [article.id, ...byTags.map((related) => related.id)];
  const byCategory = await getLatestInCategory(
    article.category_slug,
    excludeIds,
    limit - byTags.length,
  );
  return [...byTags, ...byCategory];
}
