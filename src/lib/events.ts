import "server-only";
import { unstable_cache } from "next/cache";
import type { ArticleSummary } from "@/lib/articles/public";
import { ulaanbaatarDate } from "@/lib/dates";
import { createPublicClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export type EventSummary = Pick<
  EventRow,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "cover_path"
  | "cover_alt"
  | "event_type"
  | "starts_at"
  | "location"
  | "price_text"
  | "is_featured"
  | "updated_at"
>;

/** unstable_cache tag of cached event lists; the events admin (step 10) expires it on save. */
export const EVENTS_CACHE_TAG = "events";

export function eventPath(slug: string): string {
  return `/events/${slug}`;
}

/**
 * Lets an event fill an ArticleCard (the "Эвентүүд" tile on the home page): its page lives under
 * /events like an article of that category, and the date shown is when it starts.
 */
export function eventAsArticleSummary(event: EventSummary): ArticleSummary {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    excerpt: event.excerpt,
    category_slug: "events",
    subject: null,
    cover_path: event.cover_path,
    cover_alt: event.cover_alt,
    publish_at: event.starts_at,
    updated_at: event.updated_at,
    registration_deadline: null,
    level_text: null,
    author_name: null,
  };
}

/** Published events starting today (Ulaanbaatar) or later, soonest first. */
export const getUpcomingEvents = unstable_cache(
  async (limit: number): Promise<EventSummary[]> => {
    const startOfToday = `${ulaanbaatarDate()}T00:00:00+08:00`;
    const { data, error } = await createPublicClient()
      .from("events")
      .select(
        "id, slug, title, excerpt, cover_path, cover_alt, event_type, starts_at, location, price_text, is_featured, updated_at",
      )
      .gte("starts_at", startOfToday)
      .order("starts_at", { ascending: true })
      .limit(limit);
    if (error) {
      throw error;
    }
    return data;
  },
  ["upcoming-events"],
  { revalidate: 60, tags: [EVENTS_CACHE_TAG] },
);
