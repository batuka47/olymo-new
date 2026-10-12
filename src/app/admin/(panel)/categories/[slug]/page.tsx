import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { findCategoryIn } from "@/config/categories";
import { requireAdmin } from "@/lib/auth/staff";
import { homeCategoriesTaken } from "@/lib/categories/home";
import { t } from "@/lib/i18n";
import { CategoryForm } from "../category-form";
import { getCategoriesForAdmin } from "../data";

export const metadata: Metadata = { title: t("admin.categories.form.editTitle") };

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[slug]">) {
  await requireAdmin();
  const { slug } = await params;
  const categories = await getCategoriesForAdmin();
  const category = findCategoryIn(categories, slug);
  if (!category) {
    notFound();
  }

  return (
    <>
      <AdminPageHeader title={t("admin.categories.form.editTitle")} />
      <CategoryForm
        key={category.slug}
        originalSlug={category.slug}
        articleCount={category.articleCount}
        homeCategoriesTaken={homeCategoriesTaken(categories, category.slug)}
        initialValues={{
          label: category.label,
          slug: category.slug,
          description: category.description,
          showInNav: category.show_in_nav,
          isActive: category.is_active,
          hasOlympiadFields: category.has_olympiad_fields,
          showOnHome: category.show_on_home,
        }}
      />
    </>
  );
}
