import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StubPage } from "@/components/site/stub-page";
import { categories, getCategory } from "@/config/categories";

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[category]">): Promise<Metadata> {
  const category = getCategory((await params).category);
  if (!category) {
    return {};
  }
  return { title: category.label, description: category.description };
}

export default async function CategoryPage({ params }: PageProps<"/[category]">) {
  const category = getCategory((await params).category);
  if (!category) {
    notFound();
  }
  return <StubPage title={category.label} />;
}
