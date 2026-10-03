import type { Metadata } from "next";
import { InfoPageBody, InfoPageLayout } from "@/components/site/info-page-layout";
import { routes } from "@/config/navigation";
import { sitePageMetadata } from "@/lib/site-pages/metadata";
import { requireSitePage } from "@/lib/site-pages/queries";
import { fillTokens } from "@/lib/site-pages/text";

// Edited in /admin/pages, which revalidates this page on save.
export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return sitePageMetadata("privacy");
}

export default async function PrivacyPage() {
  const page = await requireSitePage("privacy");
  return (
    <InfoPageLayout
      href={routes.privacy}
      title={fillTokens(page.title)}
      lead={fillTokens(page.description)}
    >
      <InfoPageBody html={page.body_html} />
    </InfoPageLayout>
  );
}
