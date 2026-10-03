import type { Metadata } from "next";
import { InfoPageBody, InfoPageLayout } from "@/components/site/info-page-layout";
import { routes } from "@/config/navigation";
import { sitePageMetadata } from "@/lib/site-pages/metadata";
import { requireSitePage } from "@/lib/site-pages/queries";
import { fillTokens } from "@/lib/site-pages/text";

// Edited in /admin/pages, which revalidates this page on save. /redakts redirects here.
export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return sitePageMetadata("editorial-policy");
}

export default async function EditorialPolicyPage() {
  const page = await requireSitePage("editorial-policy");
  return (
    <InfoPageLayout
      href={routes.editorialPolicy}
      title={fillTokens(page.title)}
      lead={fillTokens(page.description)}
    >
      <InfoPageBody html={page.body_html} />
    </InfoPageLayout>
  );
}
