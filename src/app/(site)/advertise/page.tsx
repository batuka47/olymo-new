import type { Metadata } from "next";
import { StubPage } from "@/components/site/stub-page";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("pages.advertise") };

export default function AdvertisePage() {
  return <StubPage title={t("pages.advertise")} />;
}
