import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StubPage } from "@/components/site/stub-page";
import { categories, getCategory } from "@/config/categories";

// No dynamicParams = false: with it, a page cleared by revalidatePath() (every article save) is
// answered with 404 instead of being rendered again. Unknown slugs still get notFound() below.
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
