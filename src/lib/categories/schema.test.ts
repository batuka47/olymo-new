import { describe, expect, it } from "vitest";
import { categoryInputSchema, type CategoryInput } from "./schema";

const valid: CategoryInput = {
  originalSlug: null,
  label: "Урлаг",
  slug: "urlag",
  description: "Урлаг, соёлын мэдээ.",
  showInNav: true,
  isActive: true,
  hasOlympiadFields: false,
  showOnHome: false,
};

const error = (input: Partial<CategoryInput>) =>
  categoryInputSchema.safeParse({ ...valid, ...input }).error?.issues[0]?.message;

describe("categoryInputSchema", () => {
  it("accepts a new category", () => {
    expect(categoryInputSchema.safeParse(valid).success).toBe(true);
  });

  it("refuses the address of a page the site already has", () => {
    for (const slug of ["admin", "events", "search", "about", "faq", "list-views", "sitemap"]) {
      expect(error({ slug })).toContain(`«${slug}»`);
    }
  });

  it("lets the events section keep its own address", () => {
    expect(
      categoryInputSchema.safeParse({ ...valid, originalSlug: "events", slug: "events" }).success,
    ).toBe(true);
  });

  it("wants a Latin slug and a name", () => {
    expect(error({ slug: "урлаг" })).toBeDefined();
    expect(error({ slug: "Urlag Soyol" })).toBeDefined();
    expect(error({ label: "   " })).toBeDefined();
  });

  it("caps the lengths", () => {
    expect(error({ label: "а".repeat(61) })).toBeDefined();
    expect(error({ description: "а".repeat(301) })).toBeDefined();
  });
});
