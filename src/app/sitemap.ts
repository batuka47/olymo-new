import type { MetadataRoute } from "next";
import { countSitemaps, sitemapEntries } from "@/lib/sitemap";

export const revalidate = 60;

/** /sitemap/0.xml, /sitemap/1.xml, …, 5000 URLs each; /sitemap-index.xml lists them all. */
export async function generateSitemaps() {
  const count = await countSitemaps();
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const index = Number(await id);
  return Number.isInteger(index) && index >= 0 ? sitemapEntries(index) : [];
}
