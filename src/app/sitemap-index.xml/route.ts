import { siteConfig } from "@/config/site";
import { countSitemaps } from "@/lib/sitemap";

export const revalidate = 60;

/**
 * The address for robots.txt and Search Console: lists /sitemap/0.xml, /sitemap/1.xml, …
 * (app/sitemap.ts), so new files are found as the site grows. /sitemap.xml itself is reserved by
 * Next.js for app/sitemap.ts, which serves only the numbered files.
 */
export async function GET() {
  const count = await countSitemaps();
  const entries = Array.from(
    { length: count },
    (_, id) => `<sitemap><loc>${siteConfig.url}/sitemap/${id}.xml</loc></sitemap>`,
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}</sitemapindex>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
