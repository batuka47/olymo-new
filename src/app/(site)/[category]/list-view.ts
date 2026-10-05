import { categoryPath, type CategorySlug } from "@/config/categories";
import type { CategorySort } from "@/lib/articles/category";
import { isOlympiadSubject, type OlympiadSubject } from "@/lib/articles/olympiad";

/** What the category page shows, read from ?subject=, ?sort= and ?page=. */
export interface ListView {
  subject: OlympiadSubject | null;
  sort: CategorySort;
  page: number;
}

/** The plain address: every subject, newest first, page 1. */
export const DEFAULT_LIST_VIEW: ListView = { subject: null, sort: "newest", page: 1 };

type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_PATTERN = /^[1-9]\d{0,4}$/;

/** Subject and sort exist on the olympiad page only. */
export function hasOlympiadFilters(category: CategorySlug): boolean {
  return category === "olympiad";
}

/**
 * Null when a known parameter has a value the page does not offer (a 404, so every view has one
 * address). Unknown parameters such as fbclid are ignored.
 */
export function parseListView(category: CategorySlug, params: SearchParams): ListView | null {
  const { subject, sort, page } = params;
  if (Array.isArray(subject) || Array.isArray(sort) || Array.isArray(page)) {
    return null;
  }
  const filters = hasOlympiadFilters(category);
  if (subject !== undefined && !(filters && isOlympiadSubject(subject))) {
    return null;
  }
  if (sort !== undefined && !(sort === "newest" || (filters && sort === "deadline"))) {
    return null;
  }
  if (page !== undefined && !PAGE_PATTERN.test(page)) {
    return null;
  }
  return {
    subject: subject ?? null,
    sort: sort === "deadline" ? "deadline" : "newest",
    page: page ? Number(page) : 1,
  };
}

/** Defaults are left out: /olympiad rather than /olympiad?sort=newest&page=1. */
export function listViewHref(category: CategorySlug, view: ListView): string {
  const params = new URLSearchParams();
  if (view.subject) {
    params.set("subject", view.subject);
  }
  if (view.sort !== "newest") {
    params.set("sort", view.sort);
  }
  if (view.page > 1) {
    params.set("page", String(view.page));
  }
  const query = params.toString();
  return query ? `${categoryPath(category)}?${query}` : categoryPath(category);
}
