import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { SOCIAL_IMAGE_SIZE } from "@/lib/media";

/**
 * A page's own openGraph replaces the root one entirely, including the image from
 * app/opengraph-image.tsx, so pages that set it spread this in. Articles and events replace
 * `images` with their own.
 */
export const siteOpenGraph = {
  siteName: siteConfig.name,
  locale: "mn_MN",
  images: [
    {
      url: "/opengraph-image",
      ...SOCIAL_IMAGE_SIZE,
      alt: `${siteConfig.name} — ${siteConfig.tagline}`,
    },
  ],
} satisfies Metadata["openGraph"];

interface PageMetadataInput {
  url: string;
  title: string;
  description?: string;
}

/** Title, description, canonical address and Open Graph for a page with the site's share image. */
export function pageMetadata({ url, title, description }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { ...siteOpenGraph, type: "website", url, title, description },
  };
}
