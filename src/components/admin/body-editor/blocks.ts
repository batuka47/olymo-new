import type { Editor } from "@tiptap/core";
import { t, type MessageKey } from "@/lib/i18n";
import type { TextSize } from "@/lib/editor/nodes";

// What the "/" menu, the "+" button and the toolbar can insert. Blocks that need a file or a link
// open a dialog; the rest change the current line.

export type BlockDialog = "image" | "gallery" | "youtube" | "social" | "embed";

export type BlockId =
  TextSize | "bulletList" | "orderedList" | "quote" | "rule" | "table" | BlockDialog;

export interface Block {
  id: BlockId;
  /** Extra search words, Latin as well, so "/zurag" and "/image" both find the image. */
  keywords: string;
  /** Changes the editor, or names the dialog that asks for the rest. */
  action: ((editor: Editor) => void) | { dialog: BlockDialog };
}

const focus = (editor: Editor) => editor.chain().focus();

/** "Гарчиг 1–3" are h2–h4: the article title is the page's only h1. */
export function setTextSize(editor: Editor, size: TextSize) {
  switch (size) {
    case "heading1":
      return focus(editor).setNode("heading", { level: 2 }).run();
    case "heading2":
      return focus(editor).setNode("heading", { level: 3 }).run();
    case "heading3":
      return focus(editor).setNode("heading", { level: 4 }).run();
    case "normal":
      return focus(editor).setNode("paragraph", { textSize: null }).run();
    case "small":
      return focus(editor).setNode("paragraph", { textSize: "small" }).run();
  }
}

export function currentTextSize(editor: Editor): TextSize | null {
  if (editor.isActive("heading", { level: 2 })) return "heading1";
  if (editor.isActive("heading", { level: 3 })) return "heading2";
  if (editor.isActive("heading", { level: 4 })) return "heading3";
  if (editor.isActive("paragraph", { textSize: "small" })) return "small";
  if (editor.isActive("paragraph")) return "normal";
  return null;
}

const textSize = (size: TextSize) => (editor: Editor) => void setTextSize(editor, size);

export const BLOCKS: Block[] = [
  { id: "heading1", keywords: "heading h2 garchig title", action: textSize("heading1") },
  { id: "heading2", keywords: "heading h3 garchig", action: textSize("heading2") },
  { id: "heading3", keywords: "heading h4 garchig", action: textSize("heading3") },
  { id: "normal", keywords: "text paragraph tekst", action: textSize("normal") },
  { id: "small", keywords: "small text jijig", action: textSize("small") },
  {
    id: "bulletList",
    keywords: "list bullet jagsaalt",
    action: (editor) => focus(editor).toggleBulletList().run(),
  },
  {
    id: "orderedList",
    keywords: "numbered list ordered dugaar",
    action: (editor) => focus(editor).toggleOrderedList().run(),
  },
  {
    id: "quote",
    keywords: "quote blockquote eshlel ishlel",
    action: (editor) => focus(editor).toggleBlockquote().run(),
  },
  {
    id: "rule",
    keywords: "divider rule line khuvaakh zuraas hr",
    action: (editor) => focus(editor).setHorizontalRule().run(),
  },
  { id: "image", keywords: "image photo picture zurag", action: { dialog: "image" } },
  { id: "gallery", keywords: "gallery slider carousel slaider", action: { dialog: "gallery" } },
  {
    id: "table",
    keywords: "table khusnegt",
    action: (editor) => focus(editor).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  { id: "youtube", keywords: "youtube video", action: { dialog: "youtube" } },
  {
    id: "social",
    keywords: "social facebook instagram x twitter tiktok post",
    action: { dialog: "social" },
  },
  { id: "embed", keywords: "embed iframe code maps forms canva", action: { dialog: "embed" } },
];

export function blockLabel(id: BlockId): string {
  return t(`editor.blocks.${id}.label` as MessageKey);
}

export function blockHint(id: BlockId): string {
  return t(`editor.blocks.${id}.hint` as MessageKey);
}

/**
 * Blocks whose label or keywords contain every word typed after "/", those matching by their
 * label first: "/гарчиг 2" puts "Гарчиг 2" above "Гарчиг 1" (whose keywords include "h2").
 */
export function findBlocks(query: string): Block[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (text: string) => words.every((word) => text.toLowerCase().includes(word));
  const byLabel = BLOCKS.filter((block) => matches(blockLabel(block.id)));
  const byKeyword = BLOCKS.filter(
    (block) => !byLabel.includes(block) && matches(`${blockLabel(block.id)} ${block.keywords}`),
  );
  return [...byLabel, ...byKeyword];
}
