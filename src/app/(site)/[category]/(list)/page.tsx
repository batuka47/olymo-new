import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findListCategory, getActiveCategories } from "@/lib/categories/queries";
import { isArticleCategory } from "@/config/categories";
import { CategoryList, categoryListMetadata } from "../category-list";
import { DEFAULT_LIST_VIEW } from "../list-view";

// The plain address (/olympiad) is static and revalidated like every public page. Addresses with
// ?subject=, ?sort= or ?page= are rewritten to ../list-views/[category] (see next.config.ts).
export const revalidate = 60;

// Built at deploy time; categories added later are built on their first visit.
export async function generateStaticParams() {
  return (await getActiveCategories())
    .filter(isArticleCategory)
    .map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[category]">): Promise<Metadata> {
  const category = await findListCategory((await params).category);
  return category ? categoryListMetadata(category, DEFAULT_LIST_VIEW) : {};
}

export default async function CategoryPage({ params }: PageProps<"/[category]">) {
  const category = await findListCategory((await params).category);
  if (!category) {
    notFound();
  }
  return <CategoryList category={category} view={DEFAULT_LIST_VIEW} />;
}
