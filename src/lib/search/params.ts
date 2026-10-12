import { routes } from "@/config/navigation";
import { SLUG_PATTERN } from "@/lib/slug";

/** Longer queries are cut; search_content() reads no more than this either. */
export const QUERY_MAX_LENGTH = 100;

/** What /search shows, read from ?q=, ?category=, ?tag= and ?page=. */
export interface SearchView {
  /** Trimmed; "" when nothing was typed. */
  q: string;
  /** An active category (events too: it searches events only). */
  category: string | null;
  tag: string | null;
  page: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_PATTERN = /^[1-9]\d{0,4}$/;

/**
 * Null when a known parameter has a value the page does not offer (a 404, so every view has one
 * address). An empty ?q= or ?category= (a form submitted as is) means "not set". `categories` are
 * the slugs of the active categories.
 */
export function parseSearchView(
  params: SearchParams,
  categories: ReadonlySet<string>,
): SearchView | null {
  const { q, category, tag, page } = params;
  if (Array.isArray(q) || Array.isArray(category) || Array.isArray(tag) || Array.isArray(page)) {
    return null;
  }
  if (category && !categories.has(category)) {
    return null;
  }
  if (tag !== undefined && !SLUG_PATTERN.test(tag)) {
    return null;
  }
  if (page !== undefined && !PAGE_PATTERN.test(page)) {
    return null;
  }
  return {
    q: (q ?? "").replace(/\s+/g, " ").trim().slice(0, QUERY_MAX_LENGTH),
    category: category || null,
    tag: tag ?? null,
    page: page ? Number(page) : 1,
  };
}

/** True when there is something to search for; a category alone only narrows a search. */
export function hasSearch(view: SearchView): boolean {
  return view.q !== "" || view.tag !== null;
}

/** Empty values are left out: /search?q=олимп rather than /search?q=олимп&category=&page=1. */
export function searchHref(view: Partial<SearchView>): string {
  const params = new URLSearchParams();
  if (view.q) {
    params.set("q", view.q);
  }
  if (view.category) {
    params.set("category", view.category);
  }
  if (view.tag) {
    params.set("tag", view.tag);
  }
  if (view.page && view.page > 1) {
    params.set("page", String(view.page));
  }
  const query = params.toString();
  return query ? `${routes.search}?${query}` : routes.search;
}

/** Articles with this tag (the tag chips under an article and on /search). */
export function tagSearchHref(slug: string): string {
  return searchHref({ tag: slug });
}

/** The words of a query as highlighting needs them: runs of letters and digits. */
export function searchTerms(q: string): string[] {
  return q.match(/[\p{L}\p{N}]+/gu) ?? [];
}
