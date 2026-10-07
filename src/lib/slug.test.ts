import { describe, expect, it } from "vitest";
import { FALLBACK_SLUG, SLUG_PATTERN, slugFromTitle, slugify } from "./slug";

describe("slugify", () => {
  it("writes Mongolian titles in Latin letters", () => {
    expect(slugify("Математикийн олимпиад 2026!")).toBe("matematikiin-olimpiad-2026");
    expect(slugify("Өвөл, хүүхэд, Ерөнхий боловсрол")).toBe("ovol-khuukhed-yeronkhii-bolovsrol");
  });

  it("writes Kazakh and Ukrainian letters too", () => {
    expect(slugify("Қазақ әні")).toBe("kazak-ani");
    expect(slugify("Київ")).toBe("kiyiv");
  });

  it("never keeps a Cyrillic letter or anything outside a-z, 0-9 and -", () => {
    const titles = [
      "Ђорђе Јовановић", // Serbian letters not in the table
      "日本の奨学金 2026",
      "Ελληνικά — тест",
      "Café crème · ÉTÉ",
      "  --Олимпиад--  ",
    ];
    for (const title of titles) {
      const slug = slugify(title);
      expect(slug).not.toMatch(/\p{Script=Cyrillic}/u);
      expect(slug === "" || SLUG_PATTERN.test(slug)).toBe(true);
    }
    expect(slugify("Café crème")).toBe("cafe-creme");
  });

  it("cuts long titles at a word boundary", () => {
    const slug = slugify("олимпиад ".repeat(20));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("slugFromTitle", () => {
  it("gives a link even when the title has no letters it can write in Latin", () => {
    expect(slugFromTitle("日本")).toBe(FALLBACK_SLUG);
    expect(slugFromTitle("!!!")).toBe(FALLBACK_SLUG);
  });

  it("stays empty while there is no title", () => {
    expect(slugFromTitle("   ")).toBe("");
  });
});
