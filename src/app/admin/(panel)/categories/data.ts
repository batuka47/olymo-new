import "server-only";
import { CATEGORY_COLUMNS, type Category } from "@/config/categories";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface AdminCategory extends Category {
  /** Articles listed in it, main or secondary, drafts included. */
  articleCount: number;
}

export async function countCategoryArticles(supabase: Supabase, slug: string): Promise<number> {
  const { count, error } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .contains("category_slugs", [slug]);
  if (error) {
    throw error;
  }
  return count ?? 0;
}

/** Every category in menu order, read fresh (not from the public cache), with article counts. */
export async function getCategoriesForAdmin(): Promise<AdminCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .order("sort_order")
    .order("slug");
  if (error) {
    throw error;
  }
  const counts = await Promise.all(
    data.map((category) => countCategoryArticles(supabase, category.slug)),
  );
  return data.map((category, index) => ({ ...category, articleCount: counts[index] }));
}
