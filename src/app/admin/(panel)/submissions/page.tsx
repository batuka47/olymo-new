import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireAdmin } from "@/lib/auth/staff";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("admin.nav.submissions") };

export default async function AdminSubmissionsPage() {
  await requireAdmin();
  return <AdminPageHeader title={t("admin.nav.submissions")} intro={t("admin.comingSoon")} />;
}
