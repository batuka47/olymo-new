import type { MetadataRoute } from "next";
import { adminRoutes } from "@/config/admin";
import { routes } from "@/config/navigation";
import { siteConfig } from "@/config/site";

/** Everything public, except staff pages, reader accounts, search results and sign-in steps. */
export default function robots(): MetadataRoute.Robots {
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
