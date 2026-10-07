import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { buttonClasses } from "@/components/ui/button";
import { adminRoutes } from "@/config/admin";
import { requireAdmin } from "@/lib/auth/staff";
import { t } from "@/lib/i18n";
import { CategoryManager } from "./category-manager";
import { getCategoriesForAdmin } from "./data";

export const metadata: Metadata = { title: t("admin.categories.title") };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getCategoriesForAdmin();

  return (
    <>
      <AdminPageHeader
        title={t("admin.categories.title")}
        intro={t("admin.categories.intro")}
        actions={
          <Link href={`${adminRoutes.categories}/new`} className={buttonClasses({ size: "lg" })}>
            + {t("admin.categories.new")}
          </Link>
        }
      />
      <CategoryManager categories={categories} />
    </>
  );
}
