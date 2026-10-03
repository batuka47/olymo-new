import type { JSONContent } from "@tiptap/react";
import { isEventType, type EventType } from "@/config/events";
import { emptyDocument } from "@/lib/articles/form";
import { toUlaanbaatarInputValue } from "@/lib/dates";
import type { EventInput } from "@/lib/events/schema";
import { publishFieldsFromRow, type PublishFormFields, type PublishIntent } from "@/lib/publishing";
import type { Database } from "@/lib/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

/** Everything the event editor edits. Empty text is "" here and null in the database. */
export interface EventFormValues extends PublishFormFields {
  title: string;
  slug: string;
  excerpt: string;
  bodyJson: JSONContent;
  coverPath: string | null;
  coverAlt: string;
  eventType: EventType;
  organizer: string;
  /** datetime-local values in Ulaanbaatar time ("2026-10-05T09:00"). */
  startsAt: string;
  endsAt: string;
  location: string;
  priceText: string;
  contactPhone: string;
  registrationUrl: string;
  isFeatured: boolean;
}

export function emptyEventValues(): EventFormValues {
  return {
    title: "",
    slug: "",
    excerpt: "",
    bodyJson: emptyDocument,
    coverPath: null,
    coverAlt: "",
    eventType: "conference",
    organizer: "",
    startsAt: "",
    endsAt: "",
    location: "",
    priceText: "",
    contactPhone: "",
    registrationUrl: "",
    isFeatured: false,
    publishMode: "now",
    scheduleAt: "",
  };
}

export function eventRowToValues(row: EventRow, now = new Date()): EventFormValues {
  return {
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    bodyJson: (row.body_json as JSONContent | null) ?? emptyDocument,
    coverPath: row.cover_path,
    coverAlt: row.cover_alt ?? "",
    eventType: isEventType(row.event_type) ? row.event_type : "other",
    organizer: row.organizer ?? "",
    startsAt: toUlaanbaatarInputValue(row.starts_at),
    endsAt: row.ends_at ? toUlaanbaatarInputValue(row.ends_at) : "",
    location: row.location ?? "",
    priceText: row.price_text ?? "",
    contactPhone: row.contact_phone ?? "",
    registrationUrl: row.registration_url ?? "",
    isFeatured: row.is_featured,
    ...publishFieldsFromRow(row, now),
  };
}

export function toEventInput(
  values: EventFormValues,
  id: string,
  intent: PublishIntent,
): EventInput {
  return {
    ...values,
    id,
    intent,
    // ProseMirror builds attrs with Object.create(null); React only sends plain objects to server
    // actions (others arrive as opaque references), so round-trip through JSON first.
    bodyJson: { ...JSON.parse(JSON.stringify(values.bodyJson)), type: "doc" },
  };
}
