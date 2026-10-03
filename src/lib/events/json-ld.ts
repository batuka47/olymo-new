import type { EventDetail } from "@/lib/events/queries";
import { eventSocialImagePath, mediaUrl } from "@/lib/media";

const FREE = /үнэгүй/i;

/** schema.org offers: price 0 for "Үнэгүй", the number in "10 000₮", or nothing when unclear. */
function offer(event: EventDetail, pageUrl: string) {
  const text = event.price_text?.trim();
  if (!text) {
    return undefined;
  }
  const digits = text.replace(/[^\d]/g, "");
  const price = FREE.test(text) ? 0 : digits ? Number(digits) : null;
  if (price === null) {
    return undefined;
  }
  return {
    "@type": "Offer",
    price,
    priceCurrency: "MNT",
    url: event.registration_url ?? pageUrl,
  };
}

/**
 * schema.org Event data for search engines, as a string safe to put inside a <script> element
 * ("<" is escaped, so text from the database cannot close the tag).
 */
export function eventJsonLd(event: EventDetail, pageUrl: string): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.excerpt ?? undefined,
    url: pageUrl,
    startDate: event.starts_at,
    endDate: event.ends_at ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: event.location
      ? { "@type": "Place", name: event.location, address: event.location }
      : undefined,
    image: event.cover_path
      ? [mediaUrl(eventSocialImagePath(event.id), event.updated_at)]
      : undefined,
    organizer: event.organizer ? { "@type": "Organization", name: event.organizer } : undefined,
    offers: offer(event, pageUrl),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
