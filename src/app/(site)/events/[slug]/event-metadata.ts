import type { Metadata } from "next";
import { eventPath, eventTypeLabel } from "@/config/events";
import { siteConfig } from "@/config/site";
import type { EventDetail } from "@/lib/events/queries";
import { eventSocialImagePath, mediaUrl, SOCIAL_IMAGE_SIZE } from "@/lib/media";
import { siteOpenGraph } from "@/lib/metadata";

/** Same shape as articles: "{title} | site", canonical URL, 1200 × 630 share image. */
export function eventMetadata(event: EventDetail, preview: boolean): Metadata {
  const description = event.excerpt || undefined;
  const url = eventPath(event.slug);
  const images = event.cover_path
    ? [
        {
          url: mediaUrl(eventSocialImagePath(event.id), event.updated_at),
          ...SOCIAL_IMAGE_SIZE,
          alt: event.cover_alt ?? "",
        },
      ]
    : undefined;

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
      card: images ? "summary_large_image" : "summary",
      title: event.title,
      description,
      images,
    },
    robots: preview ? { index: false, follow: false } : undefined,
  };
}
