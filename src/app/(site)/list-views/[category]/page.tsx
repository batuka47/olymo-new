import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryList, categoryListMetadata } from "@/app/(site)/[category]/category-list";
import { parseListView } from "@/app/(site)/[category]/list-view";
import { findListCategory } from "@/lib/categories/queries";

// /olympiad?sort=deadline, /education?page=2, …: rewritten here by next.config.ts and rendered on
// each request because they read the query string. The plain /olympiad stays static.

async function resolve({ params, searchParams }: PageProps<"/list-views/[category]">) {
  const category = await findListCategory((await params).category);
  const view = category && parseListView(category, await searchParams);
  return category && view ? { category, view } : null;
}

export async function generateMetadata(
  props: PageProps<"/list-views/[category]">,
): Promise<Metadata> {
  const list = await resolve(props);
  return list ? categoryListMetadata(list.category, list.view) : {};
}

export default async function CategoryListView(props: PageProps<"/list-views/[category]">) {
  const list = await resolve(props);
  if (!list) {
    notFound();
  }
  return <CategoryList category={list.category} view={list.view} />;
}
