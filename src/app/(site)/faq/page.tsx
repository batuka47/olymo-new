import type { Metadata } from "next";
import { StubPage } from "@/components/site/stub-page";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("pages.faq") };

export default function FaqPage() {
  return <StubPage title={t("pages.faq")} />;
}
