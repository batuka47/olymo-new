import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { ArticleSummary } from "@/lib/articles/public";
import { ulaanbaatarDate } from "@/lib/dates";
import { createClient, createPublicClient } from "@/lib/supabase/server";
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
  | "ends_at"
  | "location"
  | "price_text"
  | "is_featured"
  | "updated_at"
>;

const SUMMARY_COLUMNS =
  "id, slug, title, excerpt, cover_path, cover_alt, event_type, starts_at, ends_at, location, price_text, is_featured, updated_at";

/** unstable_cache tag of cached event lists; saving or deleting an event expires it. */
export const EVENTS_CACHE_TAG = "events";

const EVENT_CACHE = { revalidate: 60, tags: [EVENTS_CACHE_TAG] };

export const EVENTS_PAGE_SIZE = 10;

/**
 * Lets an event fill an ArticleCard (the "Эвентүүд" tile on the home page, related events): its
 * page lives under /events like an article of that category, and the date shown is when it starts.
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

/** Midnight that starts today in Ulaanbaatar: events ending earlier are over. */
function startOfToday(): string {
  return `${ulaanbaatarDate()}T00:00:00+08:00`;
}

/** Not over yet: ends today or later, or (without an end) starts today or later. */
function notOverFilter(since: string): string {
  return `ends_at.gte.${since},and(ends_at.is.null,starts_at.gte.${since})`;
}

function overFilter(since: string): string {
  return `ends_at.lt.${since},and(ends_at.is.null,starts_at.lt.${since})`;
}

function publishedEvents() {
  return createPublicClient().from("events").select(SUMMARY_COLUMNS, { count: "exact" });
}

/** Upcoming and running events, soonest first (home page, related events). */
export const getUpcomingEvents = unstable_cache(
  async (limit: number): Promise<EventSummary[]> => {
    const { data, error } = await publishedEvents()
      .or(notOverFilter(startOfToday()))
      .order("starts_at", { ascending: true })
      .limit(limit);
    if (error) {
      throw error;
    }
    return data;
  },
  ["upcoming-events"],
  EVENT_CACHE,
);

export type EventWhen = "upcoming" | "past";

export interface EventListQuery {
  when: EventWhen;
  featuredOnly: boolean;
  page: number;
}

/** PostgREST answers an offset past the last row with this error instead of an empty list. */
const RANGE_NOT_SATISFIABLE = "PGRST103";

async function countOf(
  request: PromiseLike<{ count: number | null; error: PostgrestError | null }>,
) {
  const { count, error } = await request;
  if (error) {
    throw error;
  }
  return count ?? 0;
}

/** One page of /events: upcoming soonest first, or past newest first. */
export const getEventList = unstable_cache(
  async (query: EventListQuery): Promise<{ events: EventSummary[]; total: number }> => {
    const since = startOfToday();
    const filtered = () => {
      const builder = publishedEvents().or(
        query.when === "upcoming" ? notOverFilter(since) : overFilter(since),
      );
      return query.featuredOnly ? builder.eq("is_featured", true) : builder;
    };
    const from = (query.page - 1) * EVENTS_PAGE_SIZE;
    const { data, count, error } = await filtered()
      .order("starts_at", { ascending: query.when === "upcoming" })
      .range(from, from + EVENTS_PAGE_SIZE - 1);
    if (error?.code === RANGE_NOT_SATISFIABLE) {
      // Past the last page: no rows, but the page links still need the total.
      return { events: [], total: await countOf(filtered().limit(0)) };
    }
    if (error) {
      throw error;
    }
    return { events: data, total: count ?? 0 };
  },
  ["event-list"],
  EVENT_CACHE,
);

/**
 * Readers get the cookie-free public client (RLS: published and due only). In Draft Mode the
 * staff session is used instead, so drafts and scheduled events render for preview.
 */
export const getEvent = cache(async (slug: string, preview: boolean) => {
  const supabase = preview ? await createClient() : createPublicClient();
  const { data, error } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (error) {
    throw error;
  }
  return data;
});

export type EventDetail = NonNullable<Awaited<ReturnType<typeof getEvent>>>;

/** Other upcoming events, the same type first, then the soonest. */
export async function getRelatedEvents(event: EventDetail, limit = 3): Promise<EventSummary[]> {
  const upcoming = await getUpcomingEvents(limit * 4 + 1);
  return upcoming
    .filter((candidate) => candidate.id !== event.id)
    .sort(
      (a, b) =>
        Number(b.event_type === event.event_type) - Number(a.event_type === event.event_type),
    )
    .slice(0, limit);
}

/** Newest published events, prerendered at build time. Others render on their first visit. */
export async function getLatestEventSlugs(limit: number): Promise<string[]> {
  const { data, error } = await createPublicClient()
    .from("events")
    .select("slug")
    .order("starts_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Loading the latest events failed", error);
    return [];
  }
  return data.map((event) => event.slug);
}
