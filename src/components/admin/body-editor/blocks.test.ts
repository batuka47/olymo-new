import { describe, expect, it } from "vitest";
import { BLOCKS, findBlocks } from "./blocks";

const ids = (query: string) => findBlocks(query).map((block) => block.id);

describe("findBlocks: the search after /", () => {
  it("lists every block before anything is typed", () => {
    expect(ids("")).toHaveLength(BLOCKS.length);
  });

  it("puts blocks whose name matches above those matched by a keyword", () => {
    expect(ids("гарчиг 2")[0]).toBe("heading2");
    expect(ids("Гарчиг 3")[0]).toBe("heading3");
    expect(ids("жагсаалт")).toEqual(["bulletList", "orderedList"]);
  });

  it("finds blocks by Latin words too", () => {
    expect(ids("zurag")).toEqual(["image"]);
    expect(ids("h2")).toEqual(["heading1"]);
    expect(ids("youtube")).toEqual(["youtube"]);
  });

  it("finds nothing for words no block has", () => {
    expect(ids("xyz")).toEqual([]);
  });
});
