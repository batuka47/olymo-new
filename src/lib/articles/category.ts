import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { OlympiadSubject } from "@/lib/articles/olympiad";
import { LIST_CACHE, SUMMARY_COLUMNS, type ArticleSummary } from "@/lib/articles/public";
import { ulaanbaatarDate } from "@/lib/dates";
import { createPublicClient } from "@/lib/supabase/server";

export const CATEGORY_PAGE_SIZE = 9;

/** "deadline": registration still open, closing soonest first; then everything else, newest first. */
export type CategorySort = "newest" | "deadline";

export interface CategoryListQuery {
  category: string;
  subject: OlympiadSubject | null;
  sort: CategorySort;
  page: number;
  /** The featured article is already in the banner. */
  excludeId: string | null;
}

export interface CategoryList {
  articles: ArticleSummary[];
  total: number;
}

function categoryArticles(query: CategoryListQuery) {
  let builder = createPublicClient()
    .from("articles")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .eq("category_slug", query.category);
  if (query.subject) {
    builder = builder.eq("subject", query.subject);
  }
  if (query.excludeId) {
    builder = builder.neq("id", query.excludeId);
  }
  return builder;
}

function pageRange(page: number) {
  const from = (page - 1) * CATEGORY_PAGE_SIZE;
  return { from, to: from + CATEGORY_PAGE_SIZE - 1 };
}

/** PostgREST answers an offset past the last row with this error instead of an empty list. */
const RANGE_NOT_SATISFIABLE = "PGRST103";

interface Rows<T> {
  data: T[] | null;
  error: PostgrestError | null;
}

interface Count {
  count: number | null;
  error: PostgrestError | null;
}

async function rows<T>(request: PromiseLike<Rows<T>>): Promise<T[]> {
  const { data, error } = await request;
  if (error) {
    throw error;
  }
  return data ?? [];
}

async function count(request: PromiseLike<Count>): Promise<number> {
  const result = await request;
  if (result.error) {
    throw result.error;
  }
  return result.count ?? 0;
}

async function newestFirst(query: CategoryListQuery): Promise<CategoryList> {
  const { from, to } = pageRange(query.page);
  const {
    data,
    count: total,
    error,
  } = await categoryArticles(query).order("publish_at", { ascending: false }).range(from, to);
  if (error?.code === RANGE_NOT_SATISFIABLE) {
    // Past the last page: no rows, but the page links still need the total.
    return { articles: [], total: await count(categoryArticles(query).limit(0)) };
  }
  if (error) {
    throw error;
  }
  return { articles: data, total: total ?? 0 };
}

/**
 * Two groups paged as one list: open registrations (deadline today or later), then the rest. The
 * second group continues where the first ends, so its offset is shifted by the first group's size.
 */
async function deadlinesFirst(query: CategoryListQuery): Promise<CategoryList> {
  const { from, to } = pageRange(query.page);
  const today = ulaanbaatarDate();
  const open = () => categoryArticles(query).gte("registration_deadline", today);
  const [openTotal, total] = await Promise.all([
    count(open().limit(0)),
    count(categoryArticles(query).limit(0)),
  ]);

  const articles: ArticleSummary[] = [];
  if (from < openTotal) {
    articles.push(
      ...(await rows(
        open()
          .order("registration_deadline", { ascending: true })
          .order("publish_at", { ascending: false })
          .range(from, to),
      )),
    );
  }
  const missing = CATEGORY_PAGE_SIZE - articles.length;
  const restFrom = Math.max(0, from - openTotal);
  if (missing > 0 && restFrom < total - openTotal) {
    articles.push(
      ...(await rows(
        categoryArticles(query)
          .or(`registration_deadline.lt.${today},registration_deadline.is.null`)
          .order("publish_at", { ascending: false })
          .range(restFrom, restFrom + missing - 1),
      )),
    );
  }
  return { articles, total };
}

export const getCategoryArticles = unstable_cache(
  (query: CategoryListQuery) => (query.sort === "deadline" ? deadlinesFirst : newestFirst)(query),
  ["category-articles"],
  LIST_CACHE,
);

/** Newest article marked "Онцлох" in the category, for the banner. */
export const getFeaturedArticle = unstable_cache(
  async (category: string): Promise<ArticleSummary | null> => {
    const { data, error } = await createPublicClient()
      .from("articles")
      .select(SUMMARY_COLUMNS)
      .eq("category_slug", category)
      .eq("is_featured", true)
      .order("publish_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data;
  },
  ["category-featured"],
  LIST_CACHE,
);
