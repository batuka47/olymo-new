import { formatDate, formatDateTime, toUlaanbaatarInputValue, ulaanbaatarDate } from "@/lib/dates";

function timeOfDay(value: string): string {
  return toUlaanbaatarInputValue(value).slice(11);
}

/**
 * When an event happens, in Ulaanbaatar time: "2026.10.13 10:00–16:00" on one day,
 * "2026.10.13 10:00 – 2026.10.15 18:00" across days, or just the start without an end.
 */
export function formatEventTime(startsAt: string, endsAt: string | null): string {
  if (!endsAt) {
    return formatDateTime(startsAt);
  }
  if (ulaanbaatarDate(startsAt) === ulaanbaatarDate(endsAt)) {
    return `${formatDate(startsAt)} ${timeOfDay(startsAt)}–${timeOfDay(endsAt)}`;
  }
  return `${formatDateTime(startsAt)} – ${formatDateTime(endsAt)}`;
}

/** Opens the place in Google Maps; works for addresses and names alike. */
export function mapsHref(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}
