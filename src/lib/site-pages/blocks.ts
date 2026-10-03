import { z } from "zod";
import { hasPart, type SitePageSlug } from "@/config/site-pages";
import { t } from "@/lib/i18n";

export const BLOCK_TITLE_MAX = 80;
export const BLOCK_TEXT_MAX = 600;
export const STATEMENT_MAX = 400;
export const MAX_BLOCKS = 6;

const tooLong = () => t("admin.pages.errors.tooLong");

const titledText = z.object({
  title: z.string().trim().max(BLOCK_TITLE_MAX, { error: tooLong }),
  text: z.string().trim().max(BLOCK_TEXT_MAX, { error: tooLong }),
});

export type TitledText = z.infer<typeof titledText>;

/**
 * site_pages.blocks: the structured fields of /about (rationale, vision, mission) and /partner
 * (benefits). Missing fields read as empty, so a page shows what has been filled in.
 */
export const sitePageBlocksSchema = z.object({
  rationale: z.array(titledText).max(MAX_BLOCKS).default([]),
  vision: z.string().trim().max(STATEMENT_MAX, { error: tooLong }).default(""),
  mission: z.string().trim().max(STATEMENT_MAX, { error: tooLong }).default(""),
  benefits: z.array(titledText).max(MAX_BLOCKS).default([]),
});

export type SitePageBlocks = z.infer<typeof sitePageBlocksSchema>;

const emptyBlocks: SitePageBlocks = { rationale: [], vision: "", mission: "", benefits: [] };

/** Never throws: a hand-edited row with a wrong shape reads as empty instead of breaking the page. */
export function readSitePageBlocks(json: unknown): SitePageBlocks {
  const parsed = sitePageBlocksSchema.safeParse(json);
  return parsed.success ? parsed.data : emptyBlocks;
}

/** Only the fields this page has are stored. */
export function blocksForPage(slug: SitePageSlug, blocks: SitePageBlocks): Partial<SitePageBlocks> {
  return {
    ...(hasPart(slug, "rationale") && { rationale: blocks.rationale }),
    ...(hasPart(slug, "vision") && { vision: blocks.vision, mission: blocks.mission }),
    ...(hasPart(slug, "benefits") && { benefits: blocks.benefits }),
  };
}

/** Blocks without a title or text are left out on the site (an editor's half-filled row). */
export function filledBlocks(blocks: TitledText[]): TitledText[] {
  return blocks.filter((block) => block.title !== "" || block.text !== "");
}
