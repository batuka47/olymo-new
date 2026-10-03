import { routes } from "@/config/navigation";

/**
 * The parts a page has besides its title, lead and body, shown as extra fields in /admin/pages:
 * rationale (numbered blocks), vision (vision and mission), benefits (numbered blocks), the FAQ
 * list and the team cards.
 */
export type SitePagePart = "rationale" | "vision" | "benefits" | "faq" | "team";

/** Pages whose text lives in site_pages (slugs fixed by its check constraint). */
export const sitePages = [
  { slug: "about", href: routes.about, parts: ["rationale", "vision", "team"] },
  { slug: "faq", href: routes.faq, parts: ["faq"] },
  { slug: "editorial-policy", href: routes.editorialPolicy, parts: [] },
  { slug: "privacy", href: routes.privacy, parts: [] },
  { slug: "partner", href: routes.partner, parts: ["benefits"] },
] as const satisfies readonly { slug: string; href: string; parts: readonly SitePagePart[] }[];

export type SitePageSlug = (typeof sitePages)[number]["slug"];

export const sitePageSlugs = sitePages.map((page) => page.slug) as [
  SitePageSlug,
  ...SitePageSlug[],
];

export function isSitePageSlug(value: string): value is SitePageSlug {
  return sitePages.some((page) => page.slug === value);
}

function sitePage(slug: SitePageSlug) {
  const page = sitePages.find((candidate) => candidate.slug === slug);
  if (!page) {
    throw new Error(`Unknown site page "${slug}"`);
  }
  return page;
}

export function sitePageHref(slug: SitePageSlug): string {
  return sitePage(slug).href;
}

export function hasPart(slug: SitePageSlug, part: SitePagePart): boolean {
  return (sitePage(slug).parts as readonly SitePagePart[]).includes(part);
}
