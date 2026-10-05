import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { t } from "@/lib/i18n";
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

/**
 * The title of a 404 page; layouts that answer 404 return this from generateMetadata. Absolute:
 * when two nested layouts both set it, the site name would otherwise be lost.
 */
export const notFoundMetadata: Metadata = {
  title: { absolute: `${t("notFound.title")} — ${siteConfig.name}` },
};

/** For pages that should never be in search results (previews, accounts). */
export const noindex = { index: false, follow: false } satisfies Metadata["robots"];

/**
 * A page's robots setting. Until launch (NEXT_PUBLIC_ALLOW_INDEXING=1) every page is noindex;
 * after that, only pages that ask for it. A page's robots replaces the layout's entirely (even
 * when undefined), so pages pass theirs through here instead of setting it directly.
 */
export function pageRobots(own?: Metadata["robots"]): Metadata["robots"] {
  return siteConfig.allowIndexing ? own : noindex;
}

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
