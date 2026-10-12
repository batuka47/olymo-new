import { describe, expect, it } from "vitest";
import type { Category } from "@/config/categories";
import { homeCategoriesTaken, olympiadSectionTitle, sectorCategories } from "./home";

function category(slug: string, settings: Partial<Category> = {}): Category {
  return {
    slug,
    label: slug.toUpperCase(),
    description: "",
    sort_order: 0,
    show_in_nav: true,
    is_active: true,
    has_olympiad_fields: false,
    show_on_home: false,
    ...settings,
  };
}

/** The seven categories the site started with, in menu order. */
const initial = [
  category("education"),
  category("olympiad", { has_olympiad_fields: true }),
  category("world"),
  category("sports"),
  category("technology"),
  category("science"),
  category("events"),
];

const slugs = (categories: Category[]) => categories.map((item) => item.slug);
const tick = (ticked: string[], categories = initial) =>
  categories.map((item) => (ticked.includes(item.slug) ? { ...item, show_on_home: true } : item));

describe("sectorCategories", () => {
  it("picks the last three without olympiad fields when none is ticked", () => {
    expect(slugs(sectorCategories(initial))).toEqual(["sports", "technology", "science"]);
  });

  it("shows the ticked categories instead, in menu order", () => {
    expect(slugs(sectorCategories(tick(["world", "education"])))).toEqual(["education", "world"]);
    expect(slugs(sectorCategories(tick(["olympiad"])))).toEqual(["olympiad"]);
  });

  it("never shows more than four", () => {
    const ticked = tick(["education", "world", "sports", "technology", "science"]);
    expect(sectorCategories(ticked)).toHaveLength(4);
  });

  it("leaves out hidden categories and the events section", () => {
    const categories = tick(["world", "events"]).map((item) =>
      item.slug === "world" ? { ...item, is_active: false } : item,
    );
    // Neither ticked one can show, so the automatic rule takes over.
    expect(slugs(sectorCategories(categories))).toEqual(["sports", "technology", "science"]);
  });
});

describe("olympiadSectionTitle", () => {
  it("is the first visible category with olympiad fields", () => {
    expect(olympiadSectionTitle(initial)).toBe("OLYMPIAD");
    const renamed = initial.map((item) =>
      item.slug === "olympiad" ? { ...item, label: "Олимпиад, тэмцээн" } : item,
    );
    expect(olympiadSectionTitle(renamed)).toBe("Олимпиад, тэмцээн");
  });

  it("is undefined when no visible category has them", () => {
    expect(
      olympiadSectionTitle(initial.filter((item) => !item.has_olympiad_fields)),
    ).toBeUndefined();
  });
});

describe("homeCategoriesTaken", () => {
  it("counts the other ticked categories", () => {
    const ticked = tick(["education", "world", "sports", "technology"]);
    expect(homeCategoriesTaken(ticked, null)).toBe(4);
    expect(homeCategoriesTaken(ticked, "world")).toBe(3);
  });
});
