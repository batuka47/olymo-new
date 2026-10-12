import type { MetadataRoute } from "next";
import { adminRoutes } from "@/config/admin";
import { routes } from "@/config/navigation";
import { siteConfig } from "@/config/site";

/**
 * Everything public, except staff pages, reader accounts, search results and sign-in steps. Until
 * launch (NEXT_PUBLIC_ALLOW_INDEXING=1) nothing at all, so a test deployment is never indexed.
 */
export default function robots(): MetadataRoute.Robots {
  if (!siteConfig.allowIndexing) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        adminRoutes.dashboard,
        routes.account,
        routes.search,
        "/auth",
        // Ad clicks (/r/ad/[id]) are counted on the way through; crawlers would inflate them.
        "/r/",
        // Only reached through rewrites from the list pages' own addresses (next.config.ts).
        "/list-views/",
      ],
    },
    sitemap: `${siteConfig.url}${routes.sitemapIndex}`,
  };
}
