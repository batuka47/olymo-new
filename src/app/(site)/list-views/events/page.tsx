import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventList, eventListMetadata } from "@/app/(site)/events/event-list";
import { parseEventListView } from "@/app/(site)/events/list-view";

// /events?when=past, /events?page=2, …: rewritten here by next.config.ts and rendered on each
// request because they read the query string. The plain /events stays static.

export async function generateMetadata({
  searchParams,
}: PageProps<"/list-views/events">): Promise<Metadata> {
  const view = parseEventListView(await searchParams);
  return view ? eventListMetadata(view) : {};
}

export default async function EventListView({ searchParams }: PageProps<"/list-views/events">) {
  const view = parseEventListView(await searchParams);
  if (!view) {
    notFound();
  }
  return <EventList view={view} />;
}
