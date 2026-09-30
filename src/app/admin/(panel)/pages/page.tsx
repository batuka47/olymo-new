import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("admin.nav.pages") };

export default function AdminSitePagesPage() {
  return <AdminPageHeader title={t("admin.nav.pages")} intro={t("admin.comingSoon")} />;
}
