import type { Metadata } from "next";
import { eventPath, eventTypeLabel } from "@/config/events";
import { siteConfig } from "@/config/site";
import type { EventDetail } from "@/lib/events/queries";
import { SOCIAL_IMAGE_SIZE } from "@/lib/media";
import { siteOpenGraph } from "@/lib/metadata";
import { shareImageUrl } from "@/lib/og/share-image-url";

/** Same shape as articles: "{title} | site", canonical URL, 1200 × 630 share image. */
export function eventMetadata(event: EventDetail, preview: boolean): Metadata {
  const description = event.excerpt || undefined;
  const url = eventPath(event.slug);
  const images = [
    {
      url: shareImageUrl("events", event),
      ...SOCIAL_IMAGE_SIZE,
      alt: (event.cover_path && event.cover_alt) || event.title,
    },
  ];

  return {
    title: { absolute: `${event.title} | ${siteConfig.name}` },
    description,
    alternates: { canonical: url },
    openGraph: {
      ...siteOpenGraph,
      type: "article",
      url,
      title: event.title,
      description,
      images,
      publishedTime: event.publish_at ?? undefined,
      modifiedTime: event.updated_at,
      section: eventTypeLabel(event.event_type),
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images,
    },
    robots: preview ? { index: false, follow: false } : undefined,
  };
}
