import "server-only";
import type { TagValue } from "@/lib/articles/schema";
import { createClient } from "@/lib/supabase/server";

export async function getAvailableTags(): Promise<TagValue[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("slug, label").order("label");
  return data ?? [];
}

export async function getArticleForEditing(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*, article_tags(tags(slug, label)), article_categories(category_slug)")
    .eq("id", id)
    .maybeSingle();
  if (!data) {
    return null;
  }

  const { article_tags: links, article_categories: secondary, ...row } = data;
  const tags = links.flatMap((link) => (link.tags ? [link.tags] : []));
  return { row, tags, secondaryCategories: secondary.map((link) => link.category_slug) };
}
