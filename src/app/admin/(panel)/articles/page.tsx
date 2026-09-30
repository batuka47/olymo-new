import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("admin.nav.articles") };

export default function AdminArticlesPage() {
  return <AdminPageHeader title={t("admin.nav.articles")} intro={t("admin.comingSoon")} />;
}
