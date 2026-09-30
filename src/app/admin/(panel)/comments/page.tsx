import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("admin.nav.comments") };

export default function AdminCommentsPage() {
  return <AdminPageHeader title={t("admin.nav.comments")} intro={t("admin.comingSoon")} />;
}
