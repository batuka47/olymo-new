import { describe, expect, it } from "vitest";
import {
  EMBED_HEIGHT_MESSAGE,
  EMBED_HEIGHT_REQUEST,
  isAllowedIframeSrc,
  parseSocialUrl,
  parseYouTubeUrl,
  planEmbed,
  sandboxDocument,
  youTubePlayerUrl,
} from "./embeds";

describe("parseYouTubeUrl", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ", null],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ&t=90", "dQw4w9WgXcQ", 90],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s", "dQw4w9WgXcQ", 90],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc&t=42", "dQw4w9WgXcQ", 42],
    ["youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ", null],
    ["https://www.youtube.com/shorts/aBcDeFgHiJk", "aBcDeFgHiJk", null],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ?start=30", "dQw4w9WgXcQ", 30],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ", null],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ", null],
  ])("reads %s", (url, videoId, start) => {
    expect(parseYouTubeUrl(url)).toEqual({ videoId, start });
  });

  it.each([
    ["not a link", "plain text"],
    ["https://www.youtube.com/channel/UC123", "a channel"],
    ["https://www.youtube.com/watch?v=short", "an id of the wrong length"],
    ["https://vimeo.com/123456", "another site"],
    ["javascript:alert(1)//youtu.be/dQw4w9WgXcQ", "a script link"],
    ["https://evil.example/youtu.be/dQw4w9WgXcQ", "youtu.be in the path only"],
  ])("rejects %s (%s)", (url) => {
    expect(parseYouTubeUrl(url)).toBeNull();
  });

  it("plays from youtube-nocookie.com, from the start time", () => {
    expect(youTubePlayerUrl({ videoId: "dQw4w9WgXcQ", start: 90 })).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&start=90",
    );
  });
});

describe("parseSocialUrl", () => {
  it.each([
    [
      "https://x.com/olymo_mn/status/1834567890123456789?s=20",
      { platform: "x", url: "https://twitter.com/olymo_mn/status/1834567890123456789" },
    ],
    [
      "https://twitter.com/olymo_mn/status/1834567890123456789",
      { platform: "x", url: "https://twitter.com/olymo_mn/status/1834567890123456789" },
    ],
    [
      "https://www.instagram.com/p/C9xYz_AbCdE/?utm_source=ig_web_copy_link",
      { platform: "instagram", url: "https://www.instagram.com/p/C9xYz_AbCdE/" },
    ],
    [
      "instagram.com/reel/C9xYz_AbCdE",
      { platform: "instagram", url: "https://www.instagram.com/reel/C9xYz_AbCdE/" },
    ],
    [
      "https://www.tiktok.com/@olymo.mn/video/7412345678901234567?lang=mn",
      {
        platform: "tiktok",
        url: "https://www.tiktok.com/@olymo.mn/video/7412345678901234567",
        id: "7412345678901234567",
      },
    ],
    [
      "https://www.facebook.com/olymo.mn/posts/pfbid02AbCdEf",
      {
        platform: "facebook",
        url: "https://www.facebook.com/olymo.mn/posts/pfbid02AbCdEf",
        kind: "post",
      },
    ],
    [
      "https://m.facebook.com/permalink.php?story_fbid=123456&id=987654&ref=share",
      {
        platform: "facebook",
        url: "https://www.facebook.com/permalink.php?story_fbid=123456&id=987654",
        kind: "post",
      },
    ],
    [
      "https://www.facebook.com/olymo.mn/videos/1234567890/",
      {
        platform: "facebook",
        url: "https://www.facebook.com/olymo.mn/videos/1234567890",
        kind: "video",
      },
    ],
    [
      "https://www.facebook.com/watch/?v=1234567890",
      { platform: "facebook", url: "https://www.facebook.com/watch/?v=1234567890", kind: "video" },
    ],
  ])("reads %s", (url, expected) => {
    expect(parseSocialUrl(url)).toMatchObject(expected);
  });

  it.each([
    ["https://x.com/olymo_mn", "a profile, not a post"],
    ["https://www.instagram.com/olymo.mn/", "a profile"],
    ["https://vm.tiktok.com/ZMabc123/", "a short TikTok link (no video id)"],
    ["https://www.facebook.com/olymo.mn", "a page"],
    ["https://example.com/status/123456", "another site"],
    ["https://x.com.evil.example/a/status/123456", "a look-alike host"],
  ])("rejects %s (%s)", (url) => {
    expect(parseSocialUrl(url)).toBeNull();
  });
});

describe("planEmbed", () => {
  it("shows one allow-listed iframe as it is", () => {
    const code =
      '<iframe src="https://www.google.com/maps/embed?pb=!1m18&amp;z=12" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>';
    expect(planEmbed(code)).toEqual({
      kind: "iframe",
      src: "https://www.google.com/maps/embed?pb=!1m18&z=12",
      height: 450,
      title: null,
      fullscreen: true,
    });
  });

  it("turns a YouTube iframe into the YouTube block", () => {
    expect(
      planEmbed(
        '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>',
      ),
    ).toEqual({ kind: "youtube", video: { videoId: "dQw4w9WgXcQ", start: null } });
  });

  it.each([
    ['<iframe src="https://evil.example/page"></iframe>', "an iframe from elsewhere"],
    ['<iframe src="http://www.google.com/maps/embed?pb=1"></iframe>', "plain http"],
    ['<iframe src="https://www.google.com/search?q=x"></iframe>', "an allowed host, other path"],
    [
      '<iframe src="https://docs.google.com/forms/d/x/viewform"></iframe><script>alert(1)</script>',
      "an iframe plus a script",
    ],
    [
      '<div class="canva-embed"></div><script src="https://sdk.canva.com/v1/embed.js"></script>',
      "a widget script",
    ],
    ["<p>just text</p>", "plain HTML"],
  ])("puts %s (%s) in the sandbox", (code) => {
    expect(planEmbed(code)).toEqual({ kind: "sandbox", code: code.trim() });
  });

  it("keeps heights within bounds", () => {
    const tall = planEmbed(
      '<iframe src="https://docs.google.com/forms/d/x/viewform?embedded=true" height="99999"></iframe>',
    );
    expect(tall).toMatchObject({ kind: "iframe", height: 4000 });
  });
});

describe("isAllowedIframeSrc", () => {
  it.each([
    ["https://docs.google.com/forms/d/e/1FAIp/viewform?embedded=true", true],
    ["https://www.canva.com/design/DAF/view?embed", true],
    ["https://docs.google.com.evil.example/forms/x", false],
    ["https://evil.example/?https://docs.google.com/forms/", false],
    ["javascript:alert(1)", false],
  ])("%s → %s", (src, allowed) => {
    expect(isAllowedIframeSrc(src)).toBe(allowed);
  });
});

describe("sandboxDocument", () => {
  it("wraps the code with a height reporter and opens links in a new tab", () => {
    const document = sandboxDocument('<div id="widget">Сайн уу</div>');
    expect(document).toContain('<div id="widget">Сайн уу</div>');
    expect(document).toContain('<base target="_blank">');
    expect(document).toContain(EMBED_HEIGHT_MESSAGE);
    expect(document).toContain("parent.postMessage");
  });

  it("reports again when the page asks, for pages that start listening late", () => {
    const document = sandboxDocument("");
    expect(document).toContain(`event.data.type === "${EMBED_HEIGHT_REQUEST}"`);
    expect(document).toContain("event.source === parent");
  });

  it("keeps pasted code inside the frame's own document", () => {
    const document = sandboxDocument("<script>top.location = 'https://evil.example'</script>");
    // Nothing in the wrapper loosens the sandbox; the iframe's sandbox attribute does the rest.
    expect(document).not.toMatch(/allow-same-origin|document\.domain/);
    expect(document.startsWith("<!doctype html>")).toBe(true);
  });
});
