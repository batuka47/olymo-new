import type { Metadata } from "next";
import { StubPage } from "@/components/site/stub-page";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("pages.partner") };

export default function PartnerPage() {
  return <StubPage title={t("pages.partner")} />;
}
