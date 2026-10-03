import "server-only";
import type { Metadata } from "next";
import { sitePageHref, type SitePageSlug } from "@/config/site-pages";
import { pageMetadata } from "@/lib/metadata";
import { getSitePage } from "@/lib/site-pages/queries";
import { fillTokens } from "@/lib/site-pages/text";

/** Metadata from the page's title and lead as edited in /admin/pages. */
export async function sitePageMetadata(slug: SitePageSlug): Promise<Metadata> {
  const page = await getSitePage(slug);
  if (!page) {
    return {};
  }
  return pageMetadata({
    url: sitePageHref(slug),
    title: fillTokens(page.title),
    description: fillTokens(page.description) || undefined,
  });
}
