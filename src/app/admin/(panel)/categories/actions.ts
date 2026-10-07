"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminRoutes } from "@/config/admin";
import { EVENTS_CATEGORY_SLUG, HOME_CATEGORY_LIMIT } from "@/config/categories";
import { ARTICLES_CACHE_TAG } from "@/lib/articles/public";
import { requireAdmin } from "@/lib/auth/staff";
import { CATEGORIES_CACHE_TAG } from "@/lib/categories/queries";
import { categoryInputSchema, type CategoryInput } from "@/lib/categories/schema";
import { t } from "@/lib/i18n";
import { SLUG_PATTERN } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { countCategoryArticles } from "./data";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface CategoryActionResult {
  ok: boolean;
  error?: string;
}

/** Categories appear in every page's menu and filter the article lists: refresh it all. */
function refreshCategoryPages() {
  updateTag(CATEGORIES_CACHE_TAG);
  updateTag(ARTICLES_CACHE_TAG);
  revalidatePath("/", "layout");
}

/** Other categories ticked "Нүүрэнд харуулах". */
async function homeCategoriesTakenBy(supabase: Supabase, slug: string | null): Promise<number> {
  let query = supabase
    .from("categories")
    .select("slug", { count: "exact", head: true })
    .eq("show_on_home", true);
  if (slug) query = query.neq("slug", slug);
  const { count } = await query;
  return count ?? 0;
}

async function slugExists(supabase: Supabase, slug: string): Promise<boolean> {
  const { data } = await supabase.from("categories").select("slug").eq("slug", slug).limit(1);
  return (data?.length ?? 0) > 0;
}

/** Messages for what the database refuses (constraints and the guard trigger). */
function databaseError(error: PostgrestError, fallback: string): string {
  if (error.code === "23505") return t("admin.categories.errors.taken");
  if (error.code === "23503") return t("admin.categories.errors.inUse");
  if (error.code === "P0001") {
    return error.message.includes("events")
      ? t("admin.categories.errors.events")
      : t("admin.categories.errors.slugLocked");
  }
  return fallback;
}

/** Adds a category (at the end of the menu) or updates one, then returns to the list. */
export async function saveCategory(input: CategoryInput): Promise<CategoryActionResult> {
  await requireAdmin();
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? t("admin.categories.errors.saveFailed"),
    };
  }
  const {
    originalSlug,
    slug,
    label,
    description,
    showInNav,
    isActive,
    hasOlympiadFields,
    showOnHome,
  } = parsed.data;
  const fields = {
    slug,
    label,
    description,
    show_in_nav: showInNav,
    is_active: isActive,
    has_olympiad_fields: hasOlympiadFields,
    show_on_home: showOnHome,
  };

  const supabase = await createClient();
  if (showOnHome && (await homeCategoriesTakenBy(supabase, originalSlug)) >= HOME_CATEGORY_LIMIT) {
    return {
      ok: false,
      error: t("admin.categories.errors.homeFull", { limit: HOME_CATEGORY_LIMIT }),
    };
  }
  const slugChanged = slug !== originalSlug;
  if (slugChanged && (await slugExists(supabase, slug))) {
    return { ok: false, error: t("admin.categories.errors.taken") };
  }

  let error: PostgrestError | null;
  if (originalSlug === null) {
    const { data: last } = await supabase
      .from("categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    ({ error } = await supabase
      .from("categories")
      .insert({ ...fields, sort_order: (last?.sort_order ?? 0) + 1 }));
  } else {
    if (slugChanged && originalSlug === EVENTS_CATEGORY_SLUG) {
      return { ok: false, error: t("admin.categories.errors.events") };
    }
    if (slugChanged && (await countCategoryArticles(supabase, originalSlug)) > 0) {
      return { ok: false, error: t("admin.categories.errors.slugLocked") };
    }
    const { data, error: updateError } = await supabase
      .from("categories")
      .update(fields)
      .eq("slug", originalSlug)
      .select("slug");
    error = updateError;
    if (!error && (data?.length ?? 0) === 0) {
      return { ok: false, error: t("admin.categories.errors.notFound") };
    }
  }
  if (error) {
    console.error("Saving a category failed", error);
    return { ok: false, error: databaseError(error, t("admin.categories.errors.saveFailed")) };
  }

  refreshCategoryPages();
  redirect(adminRoutes.categories);
}

/** true = free, false = taken by another category, null = not a slug a category may have. */
export async function checkCategorySlug(
  slug: string,
  originalSlug: string | null,
): Promise<boolean | null> {
  await requireAdmin();
  if (!SLUG_PATTERN.test(slug)) {
    return null;
  }
  if (slug === originalSlug) {
    return true;
  }
  return !(await slugExists(await createClient(), slug));
}

/** "Нуух" / "Харуулах" in the list. */
export async function setCategoryActive(
  slug: string,
  active: boolean,
): Promise<CategoryActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: active })
    .eq("slug", slug);
  if (error) {
    return { ok: false, error: t("admin.categories.errors.saveFailed") };
  }
  refreshCategoryPages();
  return { ok: true };
}

/** Saves the menu order: `slugs` from first to last. */
export async function reorderCategories(slugs: string[]): Promise<CategoryActionResult> {
  await requireAdmin();
  if (!z.array(z.string().regex(SLUG_PATTERN)).max(200).safeParse(slugs).success) {
    return { ok: false, error: t("admin.categories.errors.orderFailed") };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_categories", { slugs });
  if (error) {
    return { ok: false, error: t("admin.categories.errors.orderFailed") };
  }
  refreshCategoryPages();
  return { ok: true };
}

/**
 * Deletes a category. One with articles needs `moveTo`: its articles (main and secondary) move
 * there first, in the same transaction (delete_category in the migration). Moved articles get a
 * new address; the old one redirects (see [category]/[slug]/layout.tsx).
 */
export async function deleteCategory(
  slug: string,
  moveTo: string | null,
): Promise<CategoryActionResult> {
  await requireAdmin();
  if (slug === EVENTS_CATEGORY_SLUG) {
    return { ok: false, error: t("admin.categories.errors.events") };
  }
  const supabase = await createClient();
  if (!moveTo && (await countCategoryArticles(supabase, slug)) > 0) {
    return { ok: false, error: t("admin.categories.errors.moveTarget") };
  }
  const { error } = await supabase.rpc("delete_category", {
    category: slug,
    move_to: moveTo ?? undefined,
  });
  if (error) {
    console.error(`Deleting category ${slug} failed`, error);
    return { ok: false, error: databaseError(error, t("admin.categories.errors.deleteFailed")) };
  }
  refreshCategoryPages();
  return { ok: true };
}
