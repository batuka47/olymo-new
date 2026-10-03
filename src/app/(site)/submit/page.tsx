import type { Metadata } from "next";
import { FormPlaceholder } from "@/components/site/form-placeholder";
import { InfoPageLayout } from "@/components/site/info-page-layout";
import { routes } from "@/config/navigation";
import { t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

// The news tip form comes in step 13.
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
      <FormPlaceholder title={t("submitPage.formTitle")} />
    </InfoPageLayout>
  );
}
