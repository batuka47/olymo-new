import type { Metadata } from "next";
import { InfoPageLayout } from "@/components/site/info-page-layout";
import { SubmissionForm } from "@/components/site/submission-form";
import { routes } from "@/config/navigation";
import { t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

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
      <SubmissionForm kind="ad" title={t("advertisePage.formTitle")} />
    </InfoPageLayout>
  );
}
