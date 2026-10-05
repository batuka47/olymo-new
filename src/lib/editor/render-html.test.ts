import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://db.example.mn";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
});

const { renderArticleHtml } = await import("./render-html");

const MEDIA = "https://db.example.mn/storage/v1/object/public/media/articles/x";

function image(attrs: Record<string, unknown>) {
  return { type: "doc", content: [{ type: "image", attrs }] };
}

describe("renderArticleHtml: images in the text", () => {
  it("keeps width and height, so the page holds the image's space while it loads", () => {
    const html = renderArticleHtml(
      image({
        src: `${MEDIA}/body-ab12cd34-800.webp`,
        srcset: `${MEDIA}/body-ab12cd34-400.webp 400w, ${MEDIA}/body-ab12cd34-800.webp 800w`,
        sizes: "100vw",
        alt: "Зураг",
        width: 1600,
        height: 900,
      }),
    );
    expect(html).toContain('width="1600"');
    expect(html).toContain('height="900"');
    expect(html).toContain('loading="lazy"');
  });

  it("drops images from anywhere but the media bucket", () => {
    expect(
      renderArticleHtml(image({ src: "https://example.com/pixel.gif", alt: "" })),
    ).not.toContain("<img");
  });
});
