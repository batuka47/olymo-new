import { HOME_CATEGORY_LIMIT, isArticleCategory, type Category } from "@/config/categories";

/** Tiles the automatic rule picks when no category is ticked "Нүүрэнд харуулах". */
const AUTOMATIC_SECTOR_COUNT = 3;

/**
 * "Салбар бүрээс": one tile for each category ticked "Нүүрэнд харуулах", in menu order. With none
 * ticked, the last three visible categories in menu order, leaving out those with olympiad fields
 * (they have their own section): Спорт, Технологи, Шинжлэх ухаан by default. The next event is
 * added after these by the home page.
 */
export function sectorCategories(categories: readonly Category[]): Category[] {
  const visible = categories.filter(
    (category) => category.is_active && isArticleCategory(category),
  );
  const chosen = visible.filter((category) => category.show_on_home);
  if (chosen.length > 0) {
    return chosen.slice(0, HOME_CATEGORY_LIMIT);
  }
  return visible.filter((category) => !category.has_olympiad_fields).slice(-AUTOMATIC_SECTOR_COUNT);
}

/** The home olympiad section is named after the first visible category with olympiad fields. */
export function olympiadSectionTitle(categories: readonly Category[]): string | undefined {
  return categories.find((category) => category.is_active && category.has_olympiad_fields)?.label;
}

/** Categories other than `slug` already ticked "Нүүрэнд харуулах" (the form allows four in all). */
export function homeCategoriesTaken(categories: readonly Category[], slug: string | null): number {
  return categories.filter((category) => category.show_on_home && category.slug !== slug).length;
}
