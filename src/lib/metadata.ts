import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/** A page's own openGraph replaces the root one entirely, so pages that set it spread this in. */
export const siteOpenGraph = {
  siteName: siteConfig.name,
  locale: "mn_MN",
} satisfies Metadata["openGraph"];

interface PageMetadataInput {
  url: string;
  title: string;
  description?: string;
}

/** Title, description, canonical address and Open Graph for a page without its own image. */
export function pageMetadata({ url, title, description }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { ...siteOpenGraph, type: "website", url, title, description },
  };
}
