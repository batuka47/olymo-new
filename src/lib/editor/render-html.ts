import "server-only";
import type { JSONContent } from "@tiptap/react";
import { renderToHTMLString } from "@tiptap/static-renderer/pm/html-string";
import sanitizeHtml from "sanitize-html";
import { articleExtensions } from "@/lib/editor/extensions";
import { mediaUrlPrefix } from "@/lib/media";

/**
 * Builds body_html from body_json on the server. The browser never sends HTML: the JSON is rendered
 * with the article schema (unknown node types throw), then passed through an allow-list sanitizer.
 */
export function renderArticleHtml(doc: JSONContent): string {
  return sanitizeArticleHtml(renderToHTMLString({ extensions: articleExtensions, content: doc }));
}

function isMediaUrl(url: string | undefined, prefix: string): boolean {
  return Boolean(url?.startsWith(prefix));
}

function srcsetUsesOnlyMedia(srcset: string | undefined, prefix: string): boolean {
  if (!srcset) {
    return true;
  }
  return srcset
    .split(",")
    .every((candidate) => isMediaUrl(candidate.trim().split(/\s+/)[0], prefix));
}

export function sanitizeArticleHtml(html: string): string {
  const prefix = mediaUrlPrefix();

  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "h2",
      "h3",
      "strong",
      "em",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "hr",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "rel"],
      ol: ["start"],
      img: ["src", "srcset", "sizes", "alt", "loading", "decoding"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    allowedSchemesByTag: { img: ["https", "http"] },
    allowProtocolRelative: false,
    // Images must come from our own media bucket: no hotlinking or tracking pixels.
    exclusiveFilter: (frame) =>
      frame.tag === "img" &&
      (!isMediaUrl(frame.attribs.src, prefix) ||
        !srcsetUsesOnlyMedia(frame.attribs.srcset, prefix)),
  });
}
