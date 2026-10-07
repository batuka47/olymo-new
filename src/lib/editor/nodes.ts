import { Extension, mergeAttributes, Node } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";
import Blockquote from "@tiptap/extension-blockquote";
import Image from "@tiptap/extension-image";
import { t } from "@/lib/i18n";
import {
  EMBED_HEIGHT,
  EMBED_SANDBOX,
  parseSocialUrl,
  planEmbed,
  sandboxDocument,
  youTubeThumbnail,
  youTubeWatchUrl,
  type SocialPost,
  type YouTubeVideo,
} from "./embeds";

// The article's own blocks. Shared by the editor (which adds React node views on top, see
// components/admin/body-editor) and the server, which renders body_html from them: what renderHTML
// returns here is what readers get, after the sanitizer in render-html.ts.

/** Body images and slider images are this wide in the text column. */
export const BODY_IMAGE_SIZES = "(min-width: 1024px) 760px, 100vw";

// --- Text --------------------------------------------------------------------------------------

export const TEXT_SIZES = ["heading1", "heading2", "heading3", "normal", "small"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

/** "Жижиг текст": a paragraph with class="text-small". */
export const SmallText = Extension.create({
  name: "smallText",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph"],
        attributes: {
          textSize: {
            default: null,
            parseHTML: (element) => (element.classList.contains("text-small") ? "small" : null),
            renderHTML: (attributes) =>
              attributes.textSize === "small" ? { class: "text-small" } : {},
          },
        },
      },
    ];
  },
});

/** "Эшлэл" with an optional author line under it: "— Нэр". */
export const Quote = Blockquote.extend({
  addAttributes() {
    return {
      author: {
        default: null,
        parseHTML: (element) =>
          element.querySelector(":scope > .quote-author")?.textContent?.replace(/^—\s*/, "") ||
          null,
        renderHTML: () => ({}),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "blockquote",
        contentElement: (element: HTMLElement) =>
          element.querySelector<HTMLElement>(":scope > .quote-text") ?? element,
      },
    ];
  },
  renderHTML({ node, HTMLAttributes }) {
    const author = String(node.attrs.author ?? "").trim();
    if (!author) {
      return ["blockquote", mergeAttributes(HTMLAttributes), 0];
    }
    return [
      "blockquote",
      mergeAttributes(HTMLAttributes),
      ["div", { class: "quote-text" }, 0],
      ["footer", { class: "quote-author" }, `— ${author}`],
    ];
  },
});

// --- Images ------------------------------------------------------------------------------------

export const IMAGE_LAYOUTS = ["text", "full", "left", "right"] as const;
export type ImageLayout = (typeof IMAGE_LAYOUTS)[number];

function imageLayout(value: unknown): ImageLayout {
  return IMAGE_LAYOUTS.includes(value as ImageLayout) ? (value as ImageLayout) : "text";
}

/** How wide each layout draws the image (see .figure-* in globals.css), for picking a file. */
const LAYOUT_SIZES: Record<ImageLayout, string> = {
  text: BODY_IMAGE_SIZES,
  full: "(min-width: 1024px) 880px, 100vw",
  left: "(min-width: 1024px) 390px, (min-width: 640px) 50vw, 100vw",
  right: "(min-width: 1024px) 390px, (min-width: 640px) 50vw, 100vw",
};

function captionSpec(caption: unknown, credit: unknown): DOMOutputSpec[] {
  const parts: DOMOutputSpec[] = [];
  if (caption) parts.push(["span", { class: "figure-caption" }, String(caption)]);
  if (credit) parts.push(["span", { class: "figure-credit" }, String(credit)]);
  return parts.length > 0 ? [["figcaption", {}, ...parts]] : [];
}

/**
 * "Зураг": an image in a figure with an optional caption and credit, as wide as the text, the
 * whole column, or floated left or right. Images saved before captions keep their attributes.
 */
export const FigureImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      srcset: { default: null },
      sizes: { default: null },
      caption: { default: null, renderHTML: () => ({}) },
      credit: { default: null, renderHTML: () => ({}) },
      layout: { default: "text", renderHTML: () => ({}) },
    };
  },
  parseHTML() {
    return [
      {
        tag: "figure.figure",
        getAttrs: (element: HTMLElement) => {
          const image = element.querySelector("img");
          if (!image) return false;
          return {
            src: image.getAttribute("src"),
            srcset: image.getAttribute("srcset"),
            sizes: image.getAttribute("sizes"),
            alt: image.getAttribute("alt"),
            width: image.getAttribute("width"),
            height: image.getAttribute("height"),
            caption: element.querySelector(".figure-caption")?.textContent || null,
            credit: element.querySelector(".figure-credit")?.textContent || null,
            layout: element.getAttribute("data-layout") ?? "text",
          };
        },
      },
      { tag: "img[src]" },
    ];
  },
  renderHTML({ node, HTMLAttributes }) {
    const layout = imageLayout(node.attrs.layout);
    const sizes = node.attrs.srcset ? { sizes: LAYOUT_SIZES[layout] } : {};
    return [
      "figure",
      { class: `figure figure-${layout}`, "data-layout": layout },
      ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, sizes)],
      ...captionSpec(node.attrs.caption, node.attrs.credit),
    ];
  },
}).configure({ HTMLAttributes: { loading: "lazy", decoding: "async" } });

export interface GalleryImage {
  src: string;
  srcset: string | null;
  width: number;
  height: number;
  alt: string;
  caption: string | null;
}

/** "Зургийн слайдер": images side by side that readers swipe through or step with arrows. */
export const Gallery = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { images: { default: [], renderHTML: () => ({}), parseHTML: () => [] } };
  },
  parseHTML() {
    return [{ tag: "figure[data-gallery]" }];
  },
  renderHTML({ node }) {
    const images = (node.attrs.images ?? []) as GalleryImage[];
    return [
      "figure",
      {
        class: "gallery",
        "data-gallery": "",
        role: "group",
        "aria-roledescription": t("editor.gallery.roleDescription"),
        "aria-label": t("editor.gallery.label", { count: images.length }),
      },
      [
        "ul",
        { class: "gallery-track" },
        ...images.map((image): DOMOutputSpec => [
          "li",
          { class: "gallery-slide" },
          [
            "img",
            {
              src: image.src,
              srcset: image.srcset,
              sizes: BODY_IMAGE_SIZES,
              alt: image.alt,
              width: String(image.width),
              height: String(image.height),
              loading: "lazy",
              decoding: "async",
            },
          ],
          ...captionSpec(image.caption, null),
        ]),
      ],
    ];
  },
});

// --- Video and posts ---------------------------------------------------------------------------

/** The YouTube preview: thumbnail and play button; the player loads only on click. */
export function youTubeSpec(video: YouTubeVideo): DOMOutputSpec {
  return [
    "figure",
    {
      class: "embed-youtube",
      "data-youtube": video.videoId,
      "data-start": video.start ? String(video.start) : null,
    },
    [
      "a",
      {
        href: youTubeWatchUrl(video),
        class: "youtube-preview",
        "aria-label": t("editor.youtube.play"),
      },
      [
        "img",
        {
          src: youTubeThumbnail(video.videoId),
          alt: "",
          width: "480",
          height: "360",
          loading: "lazy",
          decoding: "async",
        },
      ],
      ["span", { class: "youtube-play", "aria-hidden": "true" }],
    ],
  ];
}

/** "YouTube": a video from a youtube.com, youtu.be or Shorts link. */
export const YouTube = Node.create({
  name: "youtube",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      videoId: { default: null, renderHTML: () => ({}) },
      start: { default: null, renderHTML: () => ({}) },
    };
  },
  parseHTML() {
    return [
      {
        tag: "figure[data-youtube]",
        getAttrs: (element: HTMLElement) => ({
          videoId: element.getAttribute("data-youtube"),
          start: Number(element.getAttribute("data-start")) || null,
        }),
      },
    ];
  },
  renderHTML({ node }) {
    const videoId = String(node.attrs.videoId ?? "");
    // Stored attributes come from the browser: anything but an 11-character id renders nothing.
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return ["figure", { class: "embed-empty" }];
    return youTubeSpec({ videoId, start: Number(node.attrs.start) || null });
  },
});

/** Each platform's own markup; its script (loaded near the post) turns it into the post. */
export function socialPostSpec(post: SocialPost): DOMOutputSpec {
  const link: DOMOutputSpec = ["a", { href: post.url }, post.url];
  switch (post.platform) {
    case "x":
      return ["blockquote", { class: "twitter-tweet", "data-dnt": "true" }, link];
    case "instagram":
      return [
        "blockquote",
        {
          class: "instagram-media",
          "data-instgrm-permalink": post.url,
          "data-instgrm-version": "14",
        },
        link,
      ];
    case "tiktok":
      return [
        "blockquote",
        { class: "tiktok-embed", cite: post.url, "data-video-id": post.id },
        ["section", {}, link],
      ];
    case "facebook":
      return [
        "div",
        {
          class: post.kind === "video" ? "fb-video" : "fb-post",
          "data-href": post.url,
          "data-show-text": "true",
        },
        ["blockquote", { cite: post.url, class: "fb-xfbml-parse-ignore" }, link],
      ];
  }
}

/** "Сошиал пост": a Facebook, Instagram, X or TikTok post from its link. */
export const SocialEmbed = Node.create({
  name: "socialEmbed",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { url: { default: null, renderHTML: () => ({}) } };
  },
  parseHTML() {
    return [
      {
        tag: "figure[data-social]",
        getAttrs: (element: HTMLElement) => ({ url: element.getAttribute("data-url") }),
      },
    ];
  },
  renderHTML({ node }) {
    // Re-read from the stored link, so only a real post address ever reaches the page.
    const post = parseSocialUrl(String(node.attrs.url ?? ""));
    if (!post) return ["figure", { class: "embed-empty" }];
    return [
      "figure",
      { class: "embed-social", "data-social": post.platform, "data-url": post.url },
      socialPostSpec(post),
    ];
  },
});

/** "Embed": pasted code, as an allow-listed iframe or inside the sandbox (see planEmbed). */
export function embedSpec(code: string, title: string | null): DOMOutputSpec {
  const plan = planEmbed(code);
  const label = title || t("editor.embed.frameTitle");
  if (plan.kind === "youtube") return youTubeSpec(plan.video);
  if (plan.kind === "iframe") {
    return [
      "figure",
      { class: "embed-frame", "data-embed": "iframe" },
      [
        "iframe",
        {
          src: plan.src,
          title: plan.title ?? label,
          height: String(plan.height ?? 450),
          loading: "lazy",
          referrerpolicy: "strict-origin-when-cross-origin",
          allowfullscreen: plan.fullscreen ? "" : null,
        },
      ],
    ];
  }
  return [
    "figure",
    { class: "embed-frame", "data-embed": "sandbox" },
    [
      "iframe",
      {
        srcdoc: sandboxDocument(plan.code),
        sandbox: EMBED_SANDBOX,
        title: label,
        height: String(EMBED_HEIGHT.initial),
        loading: "lazy",
      },
    ],
  ];
}

export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      code: { default: "", renderHTML: () => ({}) },
      title: { default: null, renderHTML: () => ({}) },
    };
  },
  renderHTML({ node }) {
    return embedSpec(
      String(node.attrs.code ?? ""),
      node.attrs.title ? String(node.attrs.title) : null,
    );
  },
});
