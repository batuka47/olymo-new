// Public addresses. No imports, so next.config.ts can read this file too.

export const routes = {
  home: "/",
  events: "/events",
  search: "/search",
  submit: "/submit",
  about: "/about",
  faq: "/faq",
  editorialPolicy: "/editorial-policy",
  privacy: "/privacy",
  advertise: "/advertise",
  partner: "/partner",
  contact: "/contact",
  /** Readers (commenting only); staff sign in at /admin/login. */
  login: "/login",
  account: "/account",
  authCallback: "/auth/callback",
  /** The 50 newest articles for feed readers. */
  rss: "/rss.xml",
  /** Lists the numbered sitemaps; the one to give Search Console. */
  sitemapIndex: "/sitemap-index.xml",
} as const;

/**
 * First path segments the site already uses. A category slug must not be one of them, or its page
 * would never be reached. routes.test.ts checks this against the folders in src/app.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  ...Object.values(routes)
    .map((path) => path.split("/")[1])
    .filter(Boolean),
  "admin",
  "list-views",
  "og",
  "r",
  "api",
  // Generated files: /sitemap/0.xml, /robots.txt, /icon, /apple-icon, /opengraph-image.
  "sitemap",
  "robots",
  "icon",
  "apple-icon",
  "opengraph-image",
  "favicon",
]);
