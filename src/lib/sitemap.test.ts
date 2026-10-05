import { beforeEach, describe, expect, it, vi } from "vitest";
import { argsOf, called, fakeSupabase, type FakeQuery } from "@/test/fake-supabase";

const env = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.mn";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://db.example.mn";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  return { client: null as unknown };
});
vi.mock("@/lib/supabase/server", () => ({ createPublicClient: () => env.client }));

const { countSitemaps, sitemapEntries, URLS_PER_SITEMAP } = await import("./sitemap");

const ARTICLES = 7000;
const EVENTS = 3000;
/** Home, 7 categories, 5 info pages, /advertise, /submit, /contact. */
const FIXED_PAGES = 16;
const UPDATED = "2026-10-01T00:00:00+00:00";

/** The rows .range(from, to) asks for, like PostgREST (inclusive, capped at the table size). */
function rangeRows(query: FakeQuery, total: number, row: (index: number) => object) {
  const [from, to] = argsOf(query, "range") as [number, number];
  const rows = [];
  for (let index = from; index <= Math.min(to, total - 1); index++) rows.push(row(index));
  return rows;
}

const requests: { table: string; size: number }[] = [];

beforeEach(() => {
  requests.length = 0;
  env.client = fakeSupabase({
    respond(query) {
      const total = query.table === "articles" ? ARTICLES : EVENTS;
      if (argsOf(query, "select")?.[1]) return { count: total };
      if (called(query, "maybeSingle")) return { data: { updated_at: UPDATED } };
      if (query.table === "site_pages") return { data: [] };
      const rows =
        query.table === "articles"
          ? rangeRows(query, total, (index) => ({
              slug: `a${index}`,
              category_slug: "olympiad",
              updated_at: UPDATED,
              cover_path: index === 0 ? "articles/x/cover-ab12cd34-1600.webp" : null,
            }))
          : rangeRows(query, total, (index) => ({
              slug: `e${index}`,
              updated_at: UPDATED,
              cover_path: null,
            }));
      requests.push({ table: query.table, size: rows.length });
      return { data: rows };
    },
  }).client;
});

describe("sitemaps", () => {
  it("needs one file per 5000 URLs", async () => {
    expect(URLS_PER_SITEMAP).toBe(5000);
    expect(await countSitemaps()).toBe(Math.ceil((FIXED_PAGES + ARTICLES + EVENTS) / 5000));
  });

  it("lists the fixed pages, then articles, then events, each URL once", async () => {
    const files = await Promise.all([0, 1, 2].map((index) => sitemapEntries(index)));
    expect(files.map((file) => file.length)).toEqual([
      5000,
      5000,
      FIXED_PAGES + ARTICLES + EVENTS - 10000,
    ]);

    const urls = files.flat().map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls[0]).toBe("https://example.mn/");
    expect(urls[FIXED_PAGES]).toBe("https://example.mn/olympiad/a0");
    expect(urls[FIXED_PAGES + ARTICLES - 1]).toBe(`https://example.mn/olympiad/a${ARTICLES - 1}`);
    expect(urls[FIXED_PAGES + ARTICLES]).toBe("https://example.mn/events/e0");
    expect(urls.at(-1)).toBe(`https://example.mn/events/e${EVENTS - 1}`);
    expect(urls).not.toContain("https://example.mn/search");
  });

  it("dates lists by their newest content, articles by their last change, with covers", async () => {
    const first = await sitemapEntries(0);
    expect(first[0].lastModified).toBe(UPDATED);
    expect(first.slice(FIXED_PAGES).every((entry) => entry.lastModified === UPDATED)).toBe(true);
    expect(first[FIXED_PAGES].images).toEqual([
      "https://db.example.mn/storage/v1/object/public/media/articles/x/cover-ab12cd34-1600.webp",
    ]);
  });

  it("asks for at most 1000 rows at a time", async () => {
    await sitemapEntries(1);
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.every((request) => request.size <= 1000)).toBe(true);
  });

  it("is empty past the last file", async () => {
    expect(await sitemapEntries(3)).toEqual([]);
  });
});
