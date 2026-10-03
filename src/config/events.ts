import { t, type MessageKey } from "@/lib/i18n";

export function eventPath(slug: string): string {
  return `/events/${slug}`;
}

/** Same values as the events.event_type check constraint. */
export const eventTypes = [
  "conference",
  "hackathon",
  "exhibition",
  "training",
  "competition",
  "other",
] as const;

export type EventType = (typeof eventTypes)[number];

export function isEventType(value: string): value is EventType {
  return eventTypes.some((type) => type === value);
}

export const eventTypeLabelKeys: Record<EventType, MessageKey> = {
  conference: "events.types.conference",
  hackathon: "events.types.hackathon",
  exhibition: "events.types.exhibition",
  training: "events.types.training",
  competition: "events.types.competition",
  other: "events.types.other",
};

/** The type shown to readers; anything unknown counts as "Бусад". */
export function eventTypeLabel(type: string): string {
  return t(eventTypeLabelKeys[isEventType(type) ? type : "other"]);
}
