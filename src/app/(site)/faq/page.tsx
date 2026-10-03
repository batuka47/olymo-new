import type { Metadata } from "next";
import { InfoPageBody, InfoPageLayout } from "@/components/site/info-page-layout";
import { routes } from "@/config/navigation";
import { faqJsonLd } from "@/lib/site-pages/json-ld";
import { sitePageMetadata } from "@/lib/site-pages/metadata";
import { getFaqItems, requireSitePage } from "@/lib/site-pages/queries";
import { fillTokens } from "@/lib/site-pages/text";
import { FaqList } from "./faq-list";

// Questions come from /admin/pages, which revalidates this page on save.
export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return sitePageMetadata("faq");
}

export default async function FaqPage() {
  const [page, items] = await Promise.all([requireSitePage("faq"), getFaqItems()]);

  return (
    <InfoPageLayout
      href={routes.faq}
      title={fillTokens(page.title)}
      lead={fillTokens(page.description)}
    >
      <InfoPageBody html={page.body_html} />
      {items.length > 0 && (
        <>
          <FaqList items={items} />
          <script
            type="application/ld+json"
            // Escaped by faqJsonLd: text from the database cannot close the tag.
            dangerouslySetInnerHTML={{ __html: faqJsonLd(items) }}
          />
        </>
      )}
    </InfoPageLayout>
  );
}
