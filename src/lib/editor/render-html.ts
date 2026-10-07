import "server-only";
import type { JSONContent } from "@tiptap/core";
import { renderToHTMLString } from "@tiptap/static-renderer/pm/html-string";
import sanitizeHtml from "sanitize-html";
import { EMBED_SANDBOX, isAllowedIframeSrc } from "@/lib/editor/embeds";
import { articleExtensions } from "@/lib/editor/extensions";
import { mediaUrlPrefix } from "@/lib/media";

/**
 * Builds body_html from body_json on the server. The browser never sends HTML: the JSON is rendered
 * with the article schema (unknown node types throw), then passed through an allow-list sanitizer.
 */
export function renderArticleHtml(doc: JSONContent): string {
  return sanitizeArticleHtml(
    renderToHTMLString({ extensions: articleExtensions, content: withoutTrailingEmptyLines(doc) }),
  );
}

/** The editor keeps an empty line after the last block, to have somewhere to type; readers don't. */
function withoutTrailingEmptyLines(doc: JSONContent): JSONContent {
  const content = [...(doc.content ?? [])];
  while (content.length > 1) {
    const last = content[content.length - 1];
    if (last.type !== "paragraph" || (last.content?.length ?? 0) > 0) break;
    content.pop();
  }
  return { ...doc, content };
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

/** The YouTube block's preview image, the one image not from our media bucket. */
const YOUTUBE_THUMBNAIL = /^https:\/\/i\.ytimg\.com\/vi\/[A-Za-z0-9_-]{11}\/hqdefault\.jpg$/;

function isAllowedImage(attributes: Record<string, string>, prefix: string): boolean {
  if (YOUTUBE_THUMBNAIL.test(attributes.src ?? "") && !attributes.srcset) {
    return true;
  }
  return isMediaUrl(attributes.src, prefix) && srcsetUsesOnlyMedia(attributes.srcset, prefix);
}

/**
 * An iframe is either one allow-listed address (config/embeds.ts) or pasted code in a srcdoc
 * frame with exactly our sandbox (never allow-same-origin), nothing in between.
 */
function isAllowedIframe(attributes: Record<string, string>): boolean {
  if (attributes.srcdoc !== undefined) {
    return attributes.sandbox === EMBED_SANDBOX && attributes.src === undefined;
  }
  return attributes.sandbox === undefined && isAllowedIframeSrc(attributes.src ?? "");
}

const TEXT_ALIGN = { "text-align": [/^(left|center|right|justify)$/] };

export function sanitizeArticleHtml(html: string): string {
  const prefix = mediaUrlPrefix();

  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "h2",
      "h3",
      "h4",
      "strong",
      "em",
      "u",
      "s",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "footer",
      "div",
      "section",
      "span",
      "hr",
      "img",
      "figure",
      "figcaption",
      "table",
      "tbody",
      "tr",
      "th",
      "td",
      "iframe",
    ],
    allowedAttributes: {
      p: ["class", "style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      a: ["href", "rel", "class", "aria-label"],
      ol: ["start"],
      ul: ["class"],
      li: ["class"],
      span: ["class", "aria-hidden"],
      div: ["class", "data-href", "data-show-text"],
      footer: ["class"],
      blockquote: [
        "class",
        "cite",
        "data-dnt",
        "data-instgrm-permalink",
        "data-instgrm-version",
        "data-video-id",
      ],
      img: ["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"],
      figure: [
        "class",
        "role",
        "aria-label",
        "aria-roledescription",
        "data-layout",
        "data-gallery",
        "data-youtube",
        "data-start",
        "data-social",
        "data-url",
        "data-embed",
      ],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      iframe: [
        "src",
        "srcdoc",
        "sandbox",
        "title",
        "height",
        "loading",
        "referrerpolicy",
        "allowfullscreen",
      ],
    },
    allowedClasses: {
      p: ["text-small"],
      a: ["youtube-preview"],
      ul: ["gallery-track"],
      li: ["gallery-slide"],
      span: ["figure-caption", "figure-credit", "youtube-play"],
      div: ["quote-text", "tableWrapper", "fb-post", "fb-video"],
      footer: ["quote-author"],
      blockquote: ["twitter-tweet", "instagram-media", "tiktok-embed", "fb-xfbml-parse-ignore"],
      figure: [
        "figure",
        "figure-text",
        "figure-full",
        "figure-left",
        "figure-right",
        "gallery",
        "embed-youtube",
        "embed-social",
        "embed-frame",
        "embed-empty",
      ],
    },
    allowedStyles: { p: TEXT_ALIGN, h2: TEXT_ALIGN, h3: TEXT_ALIGN, h4: TEXT_ALIGN },
    allowedSchemes: ["https", "http", "mailto"],
    allowedSchemesByTag: { img: ["https", "http"], iframe: ["https"] },
    allowProtocolRelative: false,
    // Images come from our own media bucket (no hotlinking or tracking pixels); iframes follow
    // isAllowedIframe.
    exclusiveFilter: (frame) =>
      (frame.tag === "img" && !isAllowedImage(frame.attribs, prefix)) ||
      (frame.tag === "iframe" && !isAllowedIframe(frame.attribs)),
  });
}
