import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import {
  CATEGORY_COLUMNS,
  categoryPath,
  EVENTS_CATEGORY_SLUG,
  findCategoryIn,
  isArticleCategory,
  type Category,
} from "@/config/categories";
import type { NavLink } from "@/config/navigation";
import { createPublicClient } from "@/lib/supabase/server";

/** unstable_cache tag of the categories; saving one in /admin/categories expires it. */
export const CATEGORIES_CACHE_TAG = "categories";

const loadCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const { data, error } = await createPublicClient()
      .from("categories")
      .select(CATEGORY_COLUMNS)
      .order("sort_order")
      .order("slug");
    if (error) {
      throw error;
    }
    return data;
  },
  ["categories"],
  // Admin saves expire it at once; the hour covers changes made straight in the database.
  { revalidate: 3600, tags: [CATEGORIES_CACHE_TAG] },
);

/** Every category, hidden ones too, in menu order; read once per request. */
export const getCategories = cache(() => loadCategories());

export async function getActiveCategories(): Promise<Category[]> {
  return (await getCategories()).filter((category) => category.is_active);
}

/** Any category, hidden or not (articles in a hidden one still show its name). */
export async function findCategory(slug: string): Promise<Category | undefined> {
  return findCategoryIn(await getCategories(), slug);
}

export async function getCategoryLabel(slug: string): Promise<string> {
  return (await findCategory(slug))?.label ?? "";
}

/** The category behind a /{category} page: active and not the events section (it has its own). */
export async function findListCategory(slug: string): Promise<Category | undefined> {
  const category = await findCategory(slug);
  return category?.is_active && isArticleCategory(category) ? category : undefined;
}

/** The header menu, phone chips, drawer and footer. */
export async function getNavLinks(): Promise<NavLink[]> {
  return (await getActiveCategories())
    .filter((category) => category.show_in_nav)
    .map((category) => ({ href: categoryPath(category.slug), label: category.label }));
}

/** The events row: its name and description head /events and its breadcrumbs. */
export async function getEventsSection(): Promise<Category> {
  const section = await findCategory(EVENTS_CATEGORY_SLUG);
  if (!section) {
    throw new Error(`The "${EVENTS_CATEGORY_SLUG}" category is missing`);
  }
  return section;
}
