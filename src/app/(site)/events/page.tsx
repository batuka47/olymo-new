import type { Metadata } from "next";
import { EventList, eventListMetadata } from "./event-list";
import { DEFAULT_EVENT_LIST_VIEW } from "./list-view";

// The plain /events is static and revalidated like every public page. Addresses with ?when=,
// ?featured= or ?page= are rewritten to ../list-views/events (see next.config.ts).
export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return eventListMetadata(DEFAULT_EVENT_LIST_VIEW);
}

export default function EventsPage() {
  return <EventList view={DEFAULT_EVENT_LIST_VIEW} />;
}
