import { categoryPath } from "@/config/categories";
import type { EventListQuery } from "@/lib/events/queries";

type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_PATTERN = /^[1-9]\d{0,4}$/;

/**
 * ?when=past (default: upcoming), ?featured=1 (default: all), ?page=N. Null when a known parameter
 * has a value the page does not offer (a 404, so every view has one address).
 */
export function parseEventListView(params: SearchParams): EventListQuery | null {
  const { when, featured, page } = params;
  if (Array.isArray(when) || Array.isArray(featured) || Array.isArray(page)) {
    return null;
  }
  if (when !== undefined && when !== "past" && when !== "upcoming") {
    return null;
  }
  if (featured !== undefined && featured !== "1") {
    return null;
  }
  if (page !== undefined && !PAGE_PATTERN.test(page)) {
    return null;
  }
  return {
    when: when === "past" ? "past" : "upcoming",
    featuredOnly: featured === "1",
    page: page ? Number(page) : 1,
  };
}

/** Defaults are left out: /events rather than /events?when=upcoming&page=1. */
export function eventListHref(view: EventListQuery): string {
  const params = new URLSearchParams();
  if (view.when === "past") {
    params.set("when", "past");
  }
  if (view.featuredOnly) {
    params.set("featured", "1");
  }
  if (view.page > 1) {
    params.set("page", String(view.page));
  }
  const query = params.toString();
  return query ? `${categoryPath("events")}?${query}` : categoryPath("events");
}
