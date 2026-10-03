import { siteConfig } from "@/config/site";

/** What goes into an .ics file for "Календарт нэмэх" (RFC 5545). */
export interface CalendarEvent {
  /** Stable across downloads, so calendars update the entry instead of adding a second one. */
  uid: string;
  title: string;
  description: string | null;
  location: string | null;
  url: string;
  start: string;
  /** Without an end the entry lasts no time at all, which RFC 5545 allows. */
  end: string | null;
  /** When the event was last changed. */
  stamp: string;
}

const MAX_LINE_OCTETS = 75;

/** 20261013T020000Z */
function utc(value: string): string {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Lines longer than 75 octets continue on the next line after a space; Cyrillic is 2 octets. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  for (const character of line) {
    const limit = parts.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    if (encoder.encode(current + character).length > limit) {
      parts.push(current);
      current = "";
    }
    current += character;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildIcs(event: CalendarEvent): string {
  const description = [event.description, event.url].filter(Boolean).join("\n\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${siteConfig.name}//Events//MN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${utc(event.stamp)}`,
    `DTSTART:${utc(event.start)}`,
    ...(event.end ? [`DTEND:${utc(event.end)}`] : []),
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    `URL:${event.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
