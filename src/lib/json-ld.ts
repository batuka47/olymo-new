import { routes } from "@/config/navigation";
import { siteConfig } from "@/config/site";

// schema.org data for search engines; pages render it with <JsonLd>.

/** Square brand mark from src/app/icon.tsx. */
const LOGO_URL = `${siteConfig.url}/icon`;

/** The site as publisher of articles, and on the home page. */
export function organizationJsonLd() {
  const sameAs = Object.values(siteConfig.socials).filter(Boolean);
  return {
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 },
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}

/** Home page: the organisation, and the site with its search box (/search?q=…). */
export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(),
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.tagline,
        inLanguage: "mn",
        publisher: { "@id": `${siteConfig.url}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteConfig.url}${routes.search}?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export interface BreadcrumbStep {
  name: string;
  /** Site path; the last step (the page itself) may leave it out. */
  path?: string;
}

export function breadcrumbJsonLd(steps: BreadcrumbStep[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: steps.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: step.path === undefined ? undefined : `${siteConfig.url}${step.path}`,
    })),
  };
}
