import type { Metadata } from "next";
import { FormPlaceholder } from "@/components/site/form-placeholder";
import { InfoPageLayout } from "@/components/site/info-page-layout";
import { routes } from "@/config/navigation";
import { t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

// The request form comes in step 13.
export const metadata: Metadata = pageMetadata({
  url: routes.advertise,
  title: t("pages.advertise"),
  description: t("advertisePage.description"),
});

export default function AdvertisePage() {
  return (
    <InfoPageLayout
      href={routes.advertise}
      title={t("pages.advertise")}
      lead={t("advertisePage.description")}
    >
      <FormPlaceholder title={t("advertisePage.formTitle")} />
    </InfoPageLayout>
  );
}
