import type { Metadata } from "next";
import { FormPlaceholder } from "@/components/site/form-placeholder";
import { InfoPageBody, InfoPageLayout } from "@/components/site/info-page-layout";
import { NumberedBlocks } from "@/components/site/numbered-blocks";
import { SectionHeader } from "@/components/ui/section-header";
import { routes } from "@/config/navigation";
import { t } from "@/lib/i18n";
import { filledBlocks } from "@/lib/site-pages/blocks";
import { sitePageMetadata } from "@/lib/site-pages/metadata";
import { requireSitePage } from "@/lib/site-pages/queries";
import { fillTokens } from "@/lib/site-pages/text";

// Edited in /admin/pages, which revalidates this page on save. /hamtrah redirects here.
export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return sitePageMetadata("partner");
}

export default async function PartnerPage() {
  const page = await requireSitePage("partner");
  const { benefits } = page.blocks;

  return (
    <InfoPageLayout
      href={routes.partner}
      title={fillTokens(page.title)}
      lead={fillTokens(page.description)}
    >
      <InfoPageBody html={page.body_html} />
      {filledBlocks(benefits).length > 0 && (
        <section className="flex flex-col gap-6">
          <SectionHeader index={1} title={t("partnerPage.benefits")} />
          <NumberedBlocks blocks={benefits} />
        </section>
      )}
      <FormPlaceholder title={t("partnerPage.formTitle")} />
    </InfoPageLayout>
  );
}
