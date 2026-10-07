import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://db.example.mn";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
});

const { renderArticleHtml, sanitizeArticleHtml } = await import("./render-html");

const MEDIA = "https://db.example.mn/storage/v1/object/public/media/articles/x";

type Node = Record<string, unknown>;

function doc(...content: Node[]) {
  return { type: "doc", content };
}

function image(attrs: Node) {
  return doc({ type: "image", attrs });
}

function paragraph(text: string, attrs: Node = {}, marks: Node[] = []): Node {
  return { type: "paragraph", attrs, content: [{ type: "text", text, marks }] };
}

describe("renderArticleHtml: images in the text", () => {
  const src = `${MEDIA}/body-ab12cd34-800.webp`;

  it("keeps width and height, so the page holds the image's space while it loads", () => {
    const html = renderArticleHtml(
      image({
        src,
        srcset: `${MEDIA}/body-ab12cd34-400.webp 400w, ${src} 800w`,
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

  it("wraps an image in a figure with its width, caption and credit", () => {
    const html = renderArticleHtml(
      image({ src, alt: "Сурагчид", layout: "right", caption: "Нээлт", credit: "Фото: Б. Бат" }),
    );
    expect(html).toMatch(/^<figure class="figure figure-right" data-layout="right"><img /);
    expect(html).toContain(
      '<figcaption><span class="figure-caption">Нээлт</span><span class="figure-credit">Фото: Б. Бат</span></figcaption>',
    );
  });

  it("tells the browser how wide each layout draws the image", () => {
    const sizes = (layout: string) =>
      renderArticleHtml(image({ src, srcset: `${src} 800w`, alt: "", layout })).match(
        /sizes="([^"]+)"/,
      )?.[1];
    expect(sizes("text")).toBe("(min-width: 1024px) 760px, 100vw");
    expect(sizes("left")).toBe("(min-width: 1024px) 390px, (min-width: 640px) 50vw, 100vw");
    expect(sizes("full")).toBe("(min-width: 1024px) 880px, 100vw");
  });

  it("falls back to the text width for an unknown layout", () => {
    expect(renderArticleHtml(image({ src, alt: "", layout: "huge" }))).toContain(
      'class="figure figure-text"',
    );
  });

  it("renders the slider as a list of lazy images with captions", () => {
    const html = renderArticleHtml(
      doc({
        type: "gallery",
        attrs: {
          images: [
            { src, srcset: `${src} 800w`, width: 800, height: 600, alt: "Нэг", caption: "1" },
            { src, srcset: null, width: 800, height: 600, alt: "Хоёр", caption: null },
          ],
        },
      }),
    );
    expect(html).toMatch(/^<figure class="gallery" data-gallery /);
    expect(html).toContain("aria-roledescription=");
    expect(html.match(/<li class="gallery-slide">/g)).toHaveLength(2);
    expect(html.match(/loading="lazy"/g)).toHaveLength(2);
    expect(html).toContain('<figcaption><span class="figure-caption">1</span></figcaption>');
  });

  it("drops slider images from outside the media bucket", () => {
    const html = renderArticleHtml(
      doc({
        type: "gallery",
        attrs: {
          images: [
            { src: "https://example.com/x.jpg", srcset: null, width: 1, height: 1, alt: "" },
          ],
        },
      }),
    );
    expect(html).not.toContain("<img");
  });
});

describe("renderArticleHtml: text", () => {
  it("renders the three heading sizes as h2-h4: the article title is the page's only h1", () => {
    const html = renderArticleHtml(
      doc(
        ...[1, 2, 3, 4].map((level) => ({
          type: "heading",
          attrs: { level },
          content: [{ type: "text", text: `Гарчиг ${level}` }],
        })),
      ),
    );
    expect(html).not.toContain("<h1");
    expect(html).toContain("<h2>Гарчиг 1</h2>");
    expect(html).toContain("<h3>Гарчиг 3</h3>");
    expect(html).toContain("<h4>Гарчиг 4</h4>");
  });

  it("keeps alignment and the small text size", () => {
    const html = renderArticleHtml(
      doc(
        paragraph("Тэгшилсэн", { textAlign: "justify" }),
        paragraph("Жижиг", { textSize: "small" }),
        {
          type: "heading",
          attrs: { level: 2, textAlign: "center" },
          content: [{ type: "text", text: "Голд" }],
        },
      ),
    );
    expect(html).toContain('<p style="text-align:justify">Тэгшилсэн</p>');
    expect(html).toContain('<p class="text-small">Жижиг</p>');
    expect(html).toContain('<h2 style="text-align:center">Голд</h2>');
  });

  it("leaves out the empty lines the editor keeps after the last block", () => {
    const html = renderArticleHtml(
      doc(
        paragraph("Текст"),
        { type: "horizontalRule" },
        { type: "paragraph" },
        { type: "paragraph" },
      ),
    );
    expect(html).toBe("<p>Текст</p><hr />");
    expect(renderArticleHtml(doc({ type: "paragraph" }))).toBe("<p></p>");
  });

  it("keeps underline and strikethrough", () => {
    const html = renderArticleHtml(
      doc(
        paragraph("доогуур", {}, [{ type: "underline" }]),
        paragraph("дундуур", {}, [{ type: "strike" }]),
      ),
    );
    expect(html).toContain("<u>доогуур</u>");
    expect(html).toContain("<s>дундуур</s>");
  });

  it("adds the author line under a quote", () => {
    const quote = (author: string | null) =>
      renderArticleHtml(
        doc({ type: "blockquote", attrs: { author }, content: [paragraph("Эшлэл")] }),
      );
    expect(quote("Б. Бат")).toBe(
      '<blockquote><div class="quote-text"><p>Эшлэл</p></div><footer class="quote-author">— Б. Бат</footer></blockquote>',
    );
    expect(quote(null)).toBe("<blockquote><p>Эшлэл</p></blockquote>");
  });

  it("puts tables in a box that scrolls sideways, with a header row", () => {
    const cell = (type: string, text: string) => ({
      type,
      attrs: { colspan: 1, rowspan: 1 },
      content: [paragraph(text)],
    });
    const html = renderArticleHtml(
      doc({
        type: "table",
        content: [
          { type: "tableRow", content: [cell("tableHeader", "Нэр"), cell("tableHeader", "Оноо")] },
          { type: "tableRow", content: [cell("tableCell", "Бат"), cell("tableCell", "98")] },
        ],
      }),
    );
    expect(html).toMatch(/^<div class="tableWrapper"><table><tbody><tr><th[^>]*><p>Нэр<\/p><\/th>/);
    expect(html).toContain("<td><p>98</p></td></tr></tbody></table></div>");
    expect(html).not.toContain("colgroup");
    expect(html).not.toContain("style=");
  });
});

describe("renderArticleHtml: video, posts and embeds", () => {
  it("renders YouTube as a thumbnail link; the player loads only on click", () => {
    const html = renderArticleHtml(
      doc({ type: "youtube", attrs: { videoId: "dQw4w9WgXcQ", start: 42 } }),
    );
    expect(html).toContain('data-youtube="dQw4w9WgXcQ"');
    expect(html).toContain('data-start="42"');
    expect(html).toContain('src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"');
    expect(html).toContain('href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&amp;t=42s"');
    expect(html).not.toContain("<iframe");
  });

  it("renders nothing for a stored video id that is not one", () => {
    const html = renderArticleHtml(
      doc({ type: "youtube", attrs: { videoId: '"><script>alert(1)</script>' } }),
    );
    expect(html).toBe('<figure class="embed-empty"></figure>');
  });

  it("renders a social post with its platform's markup, from the canonical link", () => {
    const html = renderArticleHtml(
      doc({ type: "socialEmbed", attrs: { url: "https://x.com/nasa/status/1234567890?s=20" } }),
    );
    const post = "https://twitter.com/nasa/status/1234567890";
    expect(html).toBe(
      `<figure class="embed-social" data-social="x" data-url="${post}"><blockquote class="twitter-tweet" data-dnt="true"><a href="${post}">${post}</a></blockquote></figure>`,
    );
  });

  it("renders nothing for a stored post link from elsewhere", () => {
    const html = renderArticleHtml(
      doc({ type: "socialEmbed", attrs: { url: "https://evil.example/status/1" } }),
    );
    expect(html).toBe('<figure class="embed-empty"></figure>');
  });

  it("shows an allow-listed iframe directly", () => {
    const html = renderArticleHtml(
      doc({
        type: "embed",
        attrs: {
          code: '<iframe src="https://www.google.com/maps/embed?pb=!1m18" width="600" height="450" style="border:0;" allowfullscreen loading="lazy"></iframe>',
        },
      }),
    );
    expect(html).toContain('data-embed="iframe"');
    expect(html).toContain('src="https://www.google.com/maps/embed?pb=!1m18"');
    expect(html).toContain('height="450"');
    expect(html).not.toContain("sandbox");
    expect(html).not.toContain("style=");
  });

  it("puts any other code in a sandboxed frame without same-origin access", () => {
    const html = renderArticleHtml(
      doc({
        type: "embed",
        attrs: { code: '<div id="w"></div><script src="https://widget.example/x.js"></script>' },
      }),
    );
    expect(html).toContain('data-embed="sandbox"');
    expect(html).toContain('sandbox="allow-scripts allow-popups allow-forms"');
    expect(html).not.toContain("allow-same-origin");
    expect(html).toMatch(
      /srcdoc="[^"]*&lt;script src=&quot;https:\/\/widget\.example\/x\.js&quot;/,
    );
    // The pasted code is only ever an attribute value, never markup in our page.
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toContain('<div id="w">');
  });
});

describe("sanitizeArticleHtml: iframes and the rest", () => {
  it("removes iframes from addresses outside the allow-list", () => {
    expect(sanitizeArticleHtml('<iframe src="https://evil.example/x"></iframe>')).toBe("");
    expect(
      sanitizeArticleHtml('<iframe src="http://www.google.com/maps/embed?pb=1"></iframe>'),
    ).toBe("");
  });

  it("removes srcdoc frames whose sandbox differs from ours", () => {
    for (const sandbox of [
      "allow-scripts allow-same-origin",
      "allow-scripts allow-popups allow-forms allow-same-origin",
      "allow-scripts allow-top-navigation",
    ]) {
      expect(sanitizeArticleHtml(`<iframe srcdoc="x" sandbox="${sandbox}"></iframe>`)).toBe("");
    }
    expect(sanitizeArticleHtml('<iframe srcdoc="x"></iframe>')).toBe("");
  });

  it("removes a frame that has both srcdoc and src", () => {
    expect(
      sanitizeArticleHtml(
        '<iframe srcdoc="x" src="https://www.google.com/maps/embed?pb=1" sandbox="allow-scripts allow-popups allow-forms"></iframe>',
      ),
    ).toBe("");
  });

  it("removes event handlers, scripts, styles and classes it does not know", () => {
    const html = sanitizeArticleHtml(
      '<p class="evil" style="color:red" onclick="x()">a</p><script>alert(1)</script><img src="x" onerror="alert(1)">',
    );
    expect(html).toBe("<p>a</p>");
  });
});

describe("renderArticleHtml: articles written before the block editor", () => {
  it("still renders an old document", () => {
    const html = renderArticleHtml(
      doc(
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Хэсэг" }] },
        paragraph("Тод", {}, [{ type: "bold" }]),
        { type: "blockquote", content: [paragraph("Хуучин эшлэл")] },
        { type: "bulletList", content: [{ type: "listItem", content: [paragraph("Нэг")] }] },
        { type: "horizontalRule" },
        {
          type: "image",
          attrs: {
            src: `${MEDIA}/body-ab12cd34-800.webp`,
            srcset: null,
            sizes: null,
            alt: "Хуучин зураг",
            width: 800,
            height: 600,
          },
        },
      ),
    );
    expect(html).toContain("<h2>Хэсэг</h2>");
    expect(html).toContain("<p><strong>Тод</strong></p>");
    expect(html).toContain("<blockquote><p>Хуучин эшлэл</p></blockquote>");
    expect(html).toContain("<ul><li><p>Нэг</p></li></ul>");
    expect(html).toContain("<hr />");
    expect(html).toContain('<figure class="figure figure-text" data-layout="text"><img ');
    expect(html).toContain('alt="Хуучин зураг"');
  });
});
