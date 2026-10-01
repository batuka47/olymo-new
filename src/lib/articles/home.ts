import "server-only";
import { unstable_cache } from "next/cache";
import type { CategorySlug } from "@/config/categories";
import { LIST_CACHE, SUMMARY_COLUMNS, type ArticleSummary } from "@/lib/articles/public";
import { readingMinutes } from "@/lib/articles/reading-time";
import { ulaanbaatarDate } from "@/lib/dates";
import { eventAsArticleSummary, type EventSummary } from "@/lib/events";
import { createPublicClient } from "@/lib/supabase/server";

export interface LeadArticle extends ArticleSummary {
  readingMinutes: number;
}

const FEATURED_COUNT = 4;
const OLYMPIAD_COUNT = 10;
const GOOD_TO_KNOW_COUNT = 5;
const EVENT_COUNT = 3;

/** The "Салбар бүрээс" tiles, in order; the fourth tile is the next event. */
export const SECTOR_CATEGORIES = [
  "sports",
  "technology",
  "science",
] as const satisfies readonly CategorySlug[];

/**
 * Rows each query asks for. Sections are filled without repeating an article (the special article
 * first, then top-down), so a list fetches extra rows for every article already taken before it.
 */
const shownBeforeFeatured = 1;
const shownBeforeOlympiads = shownBeforeFeatured + 1 + FEATURED_COUNT;
const shownBeforeGoodToKnow = shownBeforeOlympiads + OLYMPIAD_COUNT;
const shownBeforeSectors = shownBeforeGoodToKnow + 1 + GOOD_TO_KNOW_COUNT;
export const HOME_FETCH = {
  special: 1,
  featured: shownBeforeFeatured + 1 + FEATURED_COUNT,
  olympiads: OLYMPIAD_COUNT + shownBeforeOlympiads,
  goodToKnow: 1 + GOOD_TO_KNOW_COUNT + shownBeforeGoodToKnow,
  sector: 1 + shownBeforeSectors,
  events: 1 + EVENT_COUNT,
} as const;

function publishedSummaries() {
  return createPublicClient().from("articles").select(SUMMARY_COLUMNS);
}

async function rows<T>(
  request: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const { data, error } = await request;
  if (error) {
    throw error;
  }
  return data ?? [];
}

/** Newest "Онцлох" articles. Reading time is worked out here so bodies are not kept in the cache. */
export const getFeaturedArticles = unstable_cache(
  async (limit: number): Promise<LeadArticle[]> => {
    const featured = await rows(
      createPublicClient()
        .from("articles")
        .select(`${SUMMARY_COLUMNS}, body_html`)
        .eq("is_featured", true)
        .order("publish_at", { ascending: false })
        .limit(limit),
    );
    return featured.map(({ body_html, ...article }) => ({
      ...article,
      readingMinutes: readingMinutes(body_html),
    }));
  },
  ["home-featured"],
  LIST_CACHE,
);

/** Olympiads still taking registrations (deadline today or later), closing soonest first. */
export const getOpenOlympiads = unstable_cache(
  (limit: number): Promise<ArticleSummary[]> =>
    rows(
      publishedSummaries()
        .eq("category_slug", "olympiad")
        .gte("registration_deadline", ulaanbaatarDate())
        .order("registration_deadline", { ascending: true })
        .order("publish_at", { ascending: false })
        .limit(limit),
    ),
  ["home-open-olympiads"],
  LIST_CACHE,
);

export const getGoodToKnowArticles = unstable_cache(
  (limit: number): Promise<ArticleSummary[]> =>
    rows(
      publishedSummaries()
        .eq("is_good_to_know", true)
        .order("publish_at", { ascending: false })
        .limit(limit),
    ),
  ["home-good-to-know"],
  LIST_CACHE,
);

export const getLatestInCategory = unstable_cache(
  (category: CategorySlug, limit: number): Promise<ArticleSummary[]> =>
    rows(
      publishedSummaries()
        .eq("category_slug", category)
        .order("publish_at", { ascending: false })
        .limit(limit),
    ),
  ["home-latest-in-category"],
  LIST_CACHE,
);

/**
 * Articles marked "Нүүрний том баннер" whose special_until has not passed (the date is the last
 * day, Ulaanbaatar time), newest first.
 */
export const getSpecialArticles = unstable_cache(
  (limit: number): Promise<ArticleSummary[]> =>
    rows(
      publishedSummaries()
        .eq("is_special", true)
        .or(`special_until.is.null,special_until.gte.${ulaanbaatarDate()}`)
        .order("publish_at", { ascending: false })
        .limit(limit),
    ),
  ["home-special"],
  LIST_CACHE,
);

/** Newest "Шинэ мэдээ" (is_breaking) headlines for the ticker on every page. */
export const getBreakingArticles = unstable_cache(
  (limit: number) =>
    rows(
      createPublicClient()
        .from("articles")
        .select("id, slug, title, category_slug")
        .eq("is_breaking", true)
        .order("publish_at", { ascending: false })
        .limit(limit),
    ),
  ["breaking-articles"],
  LIST_CACHE,
);

export interface HomeLists {
  special: ArticleSummary[];
  featured: LeadArticle[];
  olympiads: ArticleSummary[];
  goodToKnow: ArticleSummary[];
  sectors: ArticleSummary[][];
  events: EventSummary[];
}

export interface HomeSections {
  lead: LeadArticle | null;
  featured: ArticleSummary[];
  olympiads: ArticleSummary[];
  /**
   * "Тусгай нийтлэл" next to the numbered list: the newest article marked "Нүүрний том баннер",
   * otherwise the newest good-to-know article with a cover.
   */
  special: ArticleSummary | null;
  goodToKnow: ArticleSummary[];
  sectorTiles: ArticleSummary[];
  events: EventSummary[];
}

/**
 * Fills the sections without repeating an article. A marked special article is a paid placement,
 * so it is reserved for its banner first; the rest is filled top to bottom.
 */
export function arrangeHomeSections(lists: HomeLists): HomeSections {
  const shown = new Set<string>();
  function take<T extends { id: string }>(candidates: T[], count: number): T[] {
    const picked = candidates.filter((item) => !shown.has(item.id)).slice(0, count);
    for (const item of picked) {
      shown.add(item.id);
    }
    return picked;
  }
  // Without a marked article: the newest good-to-know one with a cover, if the list keeps one more.
  function goodToKnowWithCover(): ArticleSummary | null {
    const left = lists.goodToKnow.filter((article) => !shown.has(article.id));
    const withCover = left.length > 1 ? left.find((article) => article.cover_path) : undefined;
    return withCover ? take([withCover], 1)[0] : null;
  }

  const [markedSpecial = null] = take(lists.special, 1);
  const [lead = null] = take(lists.featured, 1);
  const featured = take(lists.featured, FEATURED_COUNT);
  const olympiads = take(lists.olympiads, OLYMPIAD_COUNT);

  const special = markedSpecial ?? goodToKnowWithCover();
  const goodToKnow = take(lists.goodToKnow, GOOD_TO_KNOW_COUNT);

  const sectorArticles = lists.sectors.flatMap((candidates) => take(candidates, 1));
  const [nextEvent, ...laterEvents] = lists.events;

  return {
    lead,
    featured,
    olympiads,
    special,
    goodToKnow,
    sectorTiles: nextEvent ? [...sectorArticles, eventAsArticleSummary(nextEvent)] : sectorArticles,
    events: laterEvents.slice(0, EVENT_COUNT),
  };
}
