import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SLUG_PATTERN } from "@/lib/slug";
import { RESERVED_SLUGS } from "./routes";

const APP = join(process.cwd(), "src/app");

/** Files that are no page of their own. */
const NOT_ROUTES = new Set(["layout", "error", "global-error", "not-found", "loading", "page"]);

/**
 * The first path segments src/app answers: folders (route groups like (site) are looked into,
 * [category] is the categories themselves) and generated files such as robots.ts and icon.tsx.
 */
function topLevelSegments(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      if (entry.name.startsWith("(")) return topLevelSegments(join(directory, entry.name));
      return entry.name.startsWith("[") ? [] : [entry.name];
    }
    const name = entry.name.replace(/\.(tsx?|css)$/, "");
    return entry.name.endsWith(".css") || NOT_ROUTES.has(name) ? [] : [name];
  });
}

describe("RESERVED_SLUGS", () => {
  it("has every top-level route a category slug could clash with", () => {
    const segments = topLevelSegments(APP).filter((segment) => SLUG_PATTERN.test(segment));
    expect(segments).toContain("admin");
    expect(segments).toContain("events");
    expect(segments.filter((segment) => !RESERVED_SLUGS.has(segment))).toEqual([]);
  });

  it("keeps ordinary category slugs free", () => {
    for (const slug of ["education", "olympiad", "urlag", "shinjleh-ukhaan"]) {
      expect(RESERVED_SLUGS.has(slug)).toBe(false);
    }
  });
});
