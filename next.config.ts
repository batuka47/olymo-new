import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import { articleCategories } from "./src/config/categories";

// `npm run analyze` builds with webpack and opens a map of every JS bundle (.next/analyze/).
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.npm_lifecycle_event === "analyze",
});

type Rewrite = { source: string; destination: string; has: { type: "query"; key: string }[] };

/**
 * List pages are static at their plain address. With any of `keys` in the query string (see
 * parseListView and parseEventListView) they render on request from app/(site)/list-views/.
 */
function listViewRewrites(source: string, destination: string, keys: string[]): Rewrite[] {
  return keys.map((key) => ({ source, destination, has: [{ type: "query", key }] }));
}

const categorySlugs = articleCategories.map((category) => category.slug).join("|");

const nextConfig: NextConfig = {
  images: {
    // Images are resized in the browser on upload, so next/image only picks the stored file.
    loader: "custom",
    loaderFile: "./src/lib/images/loader.ts",
    // The stored widths (IMAGE_WIDTHS in src/lib/media.ts): srcset lists exactly these files.
    deviceSizes: [400, 800, 1600],
    imageSizes: [],
  },
  // The share images of articles and events are drawn on request with these fonts
  // (src/lib/og/share-card.tsx); file tracing cannot see paths built at run time.
  outputFileTracingIncludes: {
    "/og/**": ["./assets/fonts/*.ttf"],
  },
  // Old addresses that may be printed or shared; 301 so search engines move them over.
  // Destinations are routes.editorialPolicy and routes.partner (src/config/navigation.ts), written
  // out because this file cannot import app modules.
  async redirects() {
    return [
      { source: "/redakts", destination: "/editorial-policy", statusCode: 301 },
      { source: "/hamtrah", destination: "/partner", statusCode: 301 },
    ];
  },
  // Until launch every response, images and feeds included, tells search engines not to index it
  // (siteConfig.allowIndexing does the same for robots.txt and the page metadata).
  async headers() {
    if (process.env.NEXT_PUBLIC_ALLOW_INDEXING === "1") {
      return [];
    }
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
  async rewrites() {
    return {
      beforeFiles: [
        ...listViewRewrites(`/:category(${categorySlugs})`, "/list-views/:category", [
          "subject",
          "sort",
          "page",
        ]),
        ...listViewRewrites("/events", "/list-views/events", ["when", "featured", "page"]),
      ],
    };
  },
};

export default withBundleAnalyzer(nextConfig);
