// Builders for article and event text in the editor's JSON format (src/lib/editor/extensions.ts).
import type { JSONContent } from "@tiptap/core";
import type { GalleryImage, ImageLayout } from "../../src/lib/editor/nodes";

export type Block = JSONContent;

/** An uploaded body image, as the editor stores it (see src/lib/images/body-image.ts). */
export interface BodyImage {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

function text(value: string): JSONContent {
  return { type: "text", text: value };
}

export function doc(blocks: Block[]): JSONContent {
  return { type: "doc", content: blocks };
}

export function paragraph(value: string): Block {
  return { type: "paragraph", content: [text(value)] };
}

export function heading(value: string, level: 2 | 3 = 2): Block {
  return { type: "heading", attrs: { level }, content: [text(value)] };
}

function listItems(items: string[]): Block[] {
  return items.map((item) => ({ type: "listItem", content: [paragraph(item)] }));
}

export function bulletList(items: string[]): Block {
  return { type: "bulletList", content: listItems(items) };
}

export function orderedList(items: string[]): Block {
  return { type: "orderedList", attrs: { start: 1 }, content: listItems(items) };
}

export function quote(value: string, author: string): Block {
  return { type: "blockquote", attrs: { author }, content: [paragraph(value)] };
}

export function table(header: string[], rows: string[][]): Block {
  const cells = (values: string[], type: "tableHeader" | "tableCell") =>
    values.map((value) => ({ type, content: [paragraph(value)] }));
  return {
    type: "table",
    content: [
      { type: "tableRow", content: cells(header, "tableHeader") },
      ...rows.map((row) => ({ type: "tableRow", content: cells(row, "tableCell") })),
    ],
  };
}

export function image(
  file: BodyImage,
  options: { alt: string; layout?: ImageLayout; caption?: string; credit?: string },
): Block {
  return {
    type: "image",
    attrs: {
      ...file,
      alt: options.alt,
      layout: options.layout ?? "text",
      caption: options.caption ?? null,
      credit: options.credit ?? null,
    },
  };
}

export function gallery(images: GalleryImage[]): Block {
  return { type: "gallery", attrs: { images } };
}

export function quizBlock(quizId: string, title: string): Block {
  return { type: "quiz", attrs: { quizId, title } };
}
