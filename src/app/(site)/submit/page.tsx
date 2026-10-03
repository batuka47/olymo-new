import type { Metadata } from "next";
import { InfoPageLayout } from "@/components/site/info-page-layout";
import { SubmissionForm } from "@/components/site/submission-form";
import { routes } from "@/config/navigation";
import { t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  url: routes.submit,
  title: t("pages.submit"),
  description: t("submitPage.description"),
});

export default function SubmitPage() {
  return (
    <InfoPageLayout
      href={routes.submit}
      title={t("pages.submit")}
      lead={t("submitPage.description")}
    >
      <SubmissionForm kind="news" title={t("submitPage.formTitle")} />
    </InfoPageLayout>
  );
}
