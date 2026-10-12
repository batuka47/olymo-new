import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireAdmin } from "@/lib/auth/staff";
import { homeCategoriesTaken } from "@/lib/categories/home";
import { t } from "@/lib/i18n";
import { CategoryForm } from "../category-form";
import { getCategoriesForAdmin } from "../data";

export const metadata: Metadata = { title: t("admin.categories.form.newTitle") };

export default async function NewCategoryPage() {
  await requireAdmin();
  const categories = await getCategoriesForAdmin();
  return (
    <>
      <AdminPageHeader title={t("admin.categories.form.newTitle")} />
      <CategoryForm
        originalSlug={null}
        articleCount={0}
        homeCategoriesTaken={homeCategoriesTaken(categories, null)}
        initialValues={{
          label: "",
          slug: "",
          description: "",
          showInNav: true,
          isActive: true,
          hasOlympiadFields: false,
          showOnHome: false,
        }}
      />
    </>
  );
}
