import type { Extensions } from "@tiptap/core";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import {
  Embed,
  FigureImage,
  Gallery,
  Quote,
  SmallText,
  SocialEmbed,
  YouTube,
} from "@/lib/editor/nodes";

export const LINK_PROTOCOLS = ["http", "https", "mailto"];

export const TEXT_ALIGNMENTS = ["left", "center", "right", "justify"] as const;
export type TextAlignment = (typeof TEXT_ALIGNMENTS)[number];

/** Text, marks, lists, alignment, sizes and tables: everything without a block of its own. */
export const textExtensions: Extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    blockquote: false,
    code: false,
    codeBlock: false,
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      protocols: LINK_PROTOCOLS,
      HTMLAttributes: { rel: "noopener noreferrer", target: null },
    },
  }),
  TextAlign.configure({ types: ["heading", "paragraph"], alignments: [...TEXT_ALIGNMENTS] }),
  SmallText,
  // A wrapper div lets wide tables scroll sideways on phones (.tableWrapper in globals.css).
  TableKit.configure({ table: { resizable: false, renderWrapper: true } }),
];

/**
 * The article schema, shared by the admin editor (browser, which adds node views to the blocks)
 * and the HTML renderer (server), so both accept exactly the same content. The page title is the
 * only <h1>: "Гарчиг 1–3" are h2–h4. Articles saved before the block editor still fit it.
 */
export const articleExtensions: Extensions = [
  ...textExtensions,
  Quote,
  FigureImage,
  Gallery,
  YouTube,
  SocialEmbed,
  Embed,
];
