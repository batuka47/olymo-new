import type { JSONContent } from "@tiptap/react";
import type { SitePageSlug } from "@/config/site-pages";
import type { TitledText } from "@/lib/site-pages/blocks";
import type { SitePageInput } from "@/lib/site-pages/schema";

/** List rows carry an id, so React keeps each row's inputs with it when rows move. */
export interface BlockValues extends TitledText {
  id: string;
}

export interface FaqItemValues {
  id: string;
  question: string;
  answer: string;
}

export interface TeamMemberValues {
  id: string;
  name: string;
  role: string;
  photoPath: string | null;
}

/** What the /admin/pages editor holds; the parts a page does not have stay empty. */
export interface SitePageFormValues {
  title: string;
  description: string;
  /** null until the body is edited: seeded pages have HTML only, which the editor opens as is. */
  bodyJson: JSONContent | null;
  rationale: BlockValues[];
  vision: string;
  mission: string;
  benefits: BlockValues[];
  faq: FaqItemValues[];
  team: TeamMemberValues[];
}

export function newBlock(): BlockValues {
  return { id: crypto.randomUUID(), title: "", text: "" };
}

export function blocksWithIds(blocks: TitledText[]): BlockValues[] {
  return blocks.map((block) => ({ ...newBlock(), ...block }));
}

function withoutIds(blocks: BlockValues[]): TitledText[] {
  return blocks.map(({ title, text }) => ({ title, text }));
}

export function toSitePageInput(slug: SitePageSlug, values: SitePageFormValues): SitePageInput {
  return {
    slug,
    title: values.title,
    description: values.description,
    // ProseMirror builds attrs with Object.create(null); React only sends plain objects to server
    // actions (others arrive as opaque references), so round-trip through JSON first.
    bodyJson: values.bodyJson && { ...JSON.parse(JSON.stringify(values.bodyJson)), type: "doc" },
    blocks: {
      rationale: withoutIds(values.rationale),
      vision: values.vision,
      mission: values.mission,
      benefits: withoutIds(values.benefits),
    },
    faq: values.faq,
    team: values.team,
  };
}
