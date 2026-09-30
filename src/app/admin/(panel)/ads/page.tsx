import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("admin.nav.ads") };

export default function AdminAdsPage() {
  return <AdminPageHeader title={t("admin.nav.ads")} intro={t("admin.comingSoon")} />;
}
