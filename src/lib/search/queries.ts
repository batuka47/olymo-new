import "server-only";
import { unstable_cache } from "next/cache";
import {
  ARTICLES_CACHE_TAG,
  getMostReadArticles,
  LIST_CACHE,
  type ArticleSummary,
} from "@/lib/articles/public";
import { EVENTS_CACHE_TAG, type EventSummary } from "@/lib/events/queries";
import type { SearchView } from "@/lib/search/params";
import { createPublicClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export const SEARCH_PAGE_SIZE = 10;

/** Results hold articles and events, so saving either expires them. */
const SEARCH_CACHE = { revalidate: 60, tags: [ARTICLES_CACHE_TAG, EVENTS_CACHE_TAG] };

export type SearchResult =
  { type: "article"; article: ArticleSummary } | { type: "event"; event: EventSummary };

type SearchRow = Database["public"]["Functions"]["search_content"]["Returns"][number];

/** search_content() returns both kinds in one row shape; each card gets the fields it knows. */
function toResult(row: SearchRow): SearchResult {
  const common = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    cover_path: row.cover_path,
    cover_alt: row.cover_alt,
    updated_at: row.updated_at,
  };
  if (row.type === "event") {
    return {
      type: "event",
      event: {
        ...common,
        event_type: row.event_type,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        location: row.location,
        price_text: row.price_text,
        is_featured: row.is_featured,
      },
    };
  }
  return {
    type: "article",
    article: {
      ...common,
      category_slug: row.category_slug,
      subject: row.subject,
      publish_at: row.publish_at,
      registration_deadline: row.registration_deadline,
      level_text: row.level_text,
      author_name: row.author_name,
    },
  };
}

/** One page of ranked results; see search_content() in supabase/migrations for the matching. */
export const searchContent = unstable_cache(
  async (view: SearchView): Promise<{ results: SearchResult[]; total: number }> => {
    const { data, error } = await createPublicClient().rpc("search_content", {
      q: view.q || undefined,
      category: view.category ?? undefined,
      tag: view.tag ?? undefined,
      result_limit: SEARCH_PAGE_SIZE,
      result_offset: (view.page - 1) * SEARCH_PAGE_SIZE,
    });
    if (error) {
      throw error;
    }
    return { results: data.map(toResult), total: data[0]?.total_count ?? 0 };
  },
  ["search-content"],
  SEARCH_CACHE,
);

export interface TagLink {
  slug: string;
  label: string;
}

/** Tags with the most published articles. */
export const getPopularTags = unstable_cache(
  async (limit: number): Promise<TagLink[]> => {
    const { data, error } = await createPublicClient().rpc("popular_tags", { tag_limit: limit });
    if (error) {
      throw error;
    }
    return data.map(({ slug, label }) => ({ slug, label }));
  },
  ["popular-tags"],
  LIST_CACHE,
);

export const getTag = unstable_cache(
  async (slug: string): Promise<TagLink | null> => {
    const { data, error } = await createPublicClient()
      .from("tags")
      .select("slug, label")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data;
  },
  ["tag"],
  LIST_CACHE,
);

export const getSearchMostRead = unstable_cache(
  (limit: number) => getMostReadArticles(null, limit),
  ["search-most-read"],
  LIST_CACHE,
);
