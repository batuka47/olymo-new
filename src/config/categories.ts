// Categories live in the database and are managed by admins in /admin/categories; the server reads
// them through lib/categories/queries.ts. This file holds only their type and helpers that need no
// database, so client components can use them too.

export interface Category {
  slug: string;
  label: string;
  /** Shown under the category title on its page. */
  description: string;
  sort_order: number;
  /** In the header menu, the phone chips, the drawer and the footer. */
  show_in_nav: boolean;
  /** Hidden categories have no page and are left out of every list and menu. */
  is_active: boolean;
  /** Olympiad details in the editor, the subject filter and deadline sort on the category page. */
  has_olympiad_fields: boolean;
  /** "Нүүрэнд харуулах": a tile in the home page's "Салбар бүрээс" (at most HOME_CATEGORY_LIMIT). */
  show_on_home: boolean;
}

export const CATEGORY_COLUMNS =
  "slug, label, description, sort_order, show_in_nav, is_active, has_olympiad_fields, show_on_home";

/** Categories that may be ticked "Нүүрэнд харуулах" at once. */
export const HOME_CATEGORY_LIMIT = 4;

/**
 * The events section: /events lists the events table and is built in code around this row, so
 * articles cannot be filed there and the row cannot be renamed or deleted (see the migration).
 */
export const EVENTS_CATEGORY_SLUG = "events";

export function categoryPath(slug: string): string {
  return `/${slug}`;
}

/** Categories an article can be filed under: every one but the events section. */
export function isArticleCategory(category: Pick<Category, "slug">): boolean {
  return category.slug !== EVENTS_CATEGORY_SLUG;
}

export function findCategoryIn<C extends Pick<Category, "slug">>(
  categories: readonly C[],
  slug: string,
): C | undefined {
  return categories.find((category) => category.slug === slug);
}

/** What the article editor offers: active article categories, plus `current` if it was hidden. */
export function articleCategoryChoices(categories: readonly Category[], current: string[] = []) {
  return categories.filter(
    (category) =>
      isArticleCategory(category) && (category.is_active || current.includes(category.slug)),
  );
}
