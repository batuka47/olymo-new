import Image from "@tiptap/extension-image";
import type { Extensions } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

/** Inline images carry a srcset so readers download the right width. */
const ResponsiveImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      srcset: { default: null },
      sizes: { default: null },
    };
  },
});

export const LINK_PROTOCOLS = ["http", "https", "mailto"];

/**
 * The article schema, shared by the admin editor (browser) and the HTML renderer (server), so both
 * accept exactly the same content: paragraphs, H2/H3, bold, italic, links, lists, quotes, images
 * and horizontal rules.
 */
export const articleExtensions: Extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    code: false,
    codeBlock: false,
    strike: false,
    underline: false,
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      protocols: LINK_PROTOCOLS,
      HTMLAttributes: { rel: "noopener noreferrer", target: null },
    },
  }),
  ResponsiveImage.configure({
    HTMLAttributes: { loading: "lazy", decoding: "async" },
  }),
];
