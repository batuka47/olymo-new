import { allowedIframeSources, type SocialPlatform } from "@/config/embeds";

// Pasted links and embed code, turned into what the article stores. No DOM here: the editor, the
// server renderer and the tests all use these.

/** The sandbox for pasted code: it may run scripts, open popups and send forms, but never runs
 * with the site's origin, so it cannot read the page, its cookies or the reader's session. */
export const EMBED_SANDBOX = "allow-scripts allow-popups allow-forms";

/** postMessage type a sandboxed embed uses to report its height to the page. */
export const EMBED_HEIGHT_MESSAGE = "olymo-embed-height";

/** The page asks with this once it listens, in case the embed reported before that. */
export const EMBED_HEIGHT_REQUEST = "olymo-embed-height-request";

/** Heights an embed may ask for, in CSS pixels. */
export const EMBED_HEIGHT = { min: 80, max: 4000, initial: 300 } as const;

function parseUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  try {
    const url = new URL(/^[a-z][a-z+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

/** "m.youtube.com" → "youtube.com"; "www.facebook.com" → "facebook.com". */
function bareHost(url: URL): string {
  return url.hostname.toLowerCase().replace(/^(www|m|mobile|web)\./, "");
}

function pathParts(url: URL): string[] {
  return url.pathname.split("/").filter(Boolean);
}

// --- YouTube -----------------------------------------------------------------------------------

export interface YouTubeVideo {
  videoId: string;
  /** Start time in seconds (from ?t= or ?start=). */
  start: number | null;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** "90", "90s", "1m30s", "1h2m3s" → seconds. */
function parseStart(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  if (!match) return null;
  const [, hours = "0", minutes = "0", seconds = "0"] = match;
  const total = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  return total > 0 ? total : null;
}

/** youtube.com/watch?v=…, youtu.be/…, /shorts/…, /embed/…, /live/… (also m. and nocookie). */
export function parseYouTubeUrl(input: string): YouTubeVideo | null {
  const url = parseUrl(input);
  if (!url) return null;
  const host = bareHost(url);
  const [first, second] = pathParts(url);

  let videoId: string | null = null;
  if (host === "youtu.be") {
    videoId = first ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (first === "watch") videoId = url.searchParams.get("v");
    else if (["shorts", "embed", "live", "v"].includes(first ?? "")) videoId = second ?? null;
  }
  if (!videoId || !YOUTUBE_ID.test(videoId)) return null;
  return {
    videoId,
    start: parseStart(url.searchParams.get("t") ?? url.searchParams.get("start")),
  };
}

export function youTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** The player, loaded only after a click: youtube-nocookie.com sets no cookies until playing. */
export function youTubePlayerUrl({ videoId, start }: YouTubeVideo): string {
  const query = new URLSearchParams({ autoplay: "1", rel: "0" });
  if (start) query.set("start", String(start));
  return `https://www.youtube-nocookie.com/embed/${videoId}?${query}`;
}

export function youTubeWatchUrl({ videoId, start }: YouTubeVideo): string {
  return `https://www.youtube.com/watch?v=${videoId}${start ? `&t=${start}s` : ""}`;
}

// --- Social posts ------------------------------------------------------------------------------

export interface SocialPost {
  platform: SocialPlatform;
  /** The post's address in the form the platform's embed script expects. */
  url: string;
  /** Facebook draws videos and posts with different plugins. */
  kind: "post" | "video";
  /** TikTok's script needs the video id as well. */
  id: string | null;
}

const NUMERIC_ID = /^\d{5,25}$/;
const SHORT_CODE = /^[A-Za-z0-9_-]{5,40}$/;

function parseX(url: URL): SocialPost | null {
  const [user, status, id] = pathParts(url);
  if (!user || status !== "status" || !id || !NUMERIC_ID.test(id)) return null;
  return { platform: "x", url: `https://twitter.com/${user}/status/${id}`, kind: "post", id };
}

function parseInstagram(url: URL): SocialPost | null {
  const [type, code] = pathParts(url);
  if (!["p", "reel", "tv"].includes(type ?? "") || !code || !SHORT_CODE.test(code)) return null;
  return {
    platform: "instagram",
    url: `https://www.instagram.com/${type}/${code}/`,
    kind: "post",
    id: code,
  };
}

function parseTikTok(url: URL): SocialPost | null {
  const [user, video, id] = pathParts(url);
  if (!user?.startsWith("@") || video !== "video" || !id || !NUMERIC_ID.test(id)) return null;
  return {
    platform: "tiktok",
    url: `https://www.tiktok.com/${user}/video/${id}`,
    kind: "post",
    id,
  };
}

const FACEBOOK_QUERY_KEYS = ["story_fbid", "fbid", "id", "v", "set"];

function parseFacebook(url: URL): SocialPost | null {
  const parts = pathParts(url);
  const [first, second] = parts;
  const isVideo =
    second === "videos" || first === "watch" || first === "reel" || first === "videos";
  const isPost =
    ["posts", "photos", "permalink"].includes(second ?? "") ||
    ["permalink.php", "story.php", "photo.php", "photo", "share", "groups"].includes(first ?? "");
  if (!isVideo && !isPost) return null;

  const query = new URLSearchParams();
  for (const key of FACEBOOK_QUERY_KEYS) {
    const value = url.searchParams.get(key);
    if (value) query.set(key, value);
  }
  const path = `/${parts.join("/")}${first === "watch" ? "/" : ""}`;
  const shareVideo = first === "share" && (second === "v" || second === "r");
  return {
    platform: "facebook",
    url: `https://www.facebook.com${path}${query.size > 0 ? `?${query}` : ""}`,
    kind: isVideo || shareVideo ? "video" : "post",
    id: null,
  };
}

/** A Facebook, Instagram, X or TikTok post link, or null when it is not one. */
export function parseSocialUrl(input: string): SocialPost | null {
  const url = parseUrl(input);
  if (!url) return null;
  switch (bareHost(url)) {
    case "twitter.com":
    case "x.com":
      return parseX(url);
    case "instagram.com":
      return parseInstagram(url);
    case "tiktok.com":
      return parseTikTok(url);
    case "facebook.com":
      return parseFacebook(url);
    default:
      return null;
  }
}

// --- Embed code --------------------------------------------------------------------------------

export type EmbedPlan =
  | {
      kind: "iframe";
      src: string;
      height: number | null;
      title: string | null;
      fullscreen: boolean;
    }
  | { kind: "youtube"; video: YouTubeVideo }
  | { kind: "sandbox"; code: string };

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

function decodeEntities(value: string): string {
  return value.replace(/&(amp|quot|#39|apos|lt|gt);/g, (entity) => ENTITIES[entity] ?? entity);
}

/** Attributes of `<iframe …></iframe>` when the code is that one element and nothing else. */
function singleIframe(code: string): Record<string, string> | null {
  const match = code.trim().match(/^<iframe\b([^<>]*)>\s*<\/iframe>$/i);
  if (!match) return null;
  const attributes: Record<string, string> = {};
  const attribute = /([a-z_:][-a-z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gi;
  for (const [, name, double, single, bare] of match[1].matchAll(attribute)) {
    attributes[name.toLowerCase()] = decodeEntities(double ?? single ?? bare ?? "");
  }
  return attributes;
}

/** Whether an iframe address is on the allow-list (config/embeds.ts): https, host and path. */
export function isAllowedIframeSrc(src: string): boolean {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    allowedIframeSources.some(
      (source) => url.hostname === source.host && url.pathname.startsWith(source.pathPrefix),
    )
  );
}

/** "450", "450px" → 450 within EMBED_HEIGHT; "100%" or nothing → null. */
function iframeHeight(value: string | undefined): number | null {
  const match = value?.trim().match(/^(\d+)(px)?$/);
  if (!match) return null;
  return Math.min(EMBED_HEIGHT.max, Math.max(EMBED_HEIGHT.min, Number(match[1])));
}

/**
 * How pasted embed code is shown: one iframe from an allow-listed address as it is, a YouTube
 * iframe as the YouTube block, anything else inside the sandbox.
 */
export function planEmbed(code: string): EmbedPlan {
  const iframe = singleIframe(code);
  if (iframe?.src) {
    const video = parseYouTubeUrl(iframe.src);
    if (video) return { kind: "youtube", video };
    if (isAllowedIframeSrc(iframe.src)) {
      return {
        kind: "iframe",
        src: iframe.src,
        height: iframeHeight(iframe.height),
        title: iframe.title?.trim() || null,
        fullscreen: "allowfullscreen" in iframe,
      };
    }
  }
  return { kind: "sandbox", code: code.trim() };
}

/**
 * The document a sandboxed embed runs in: the pasted code, links opening in a new tab, and a
 * script that reports the content's height so the frame can grow to fit (no scrollbars).
 */
export function sandboxDocument(code: string): string {
  const reportHeight = `(function () {
  var last = 0;
  function send() {
    var height = Math.ceil(document.documentElement.scrollHeight);
    if (height !== last) {
      last = height;
      parent.postMessage({ type: "${EMBED_HEIGHT_MESSAGE}", height: height }, "*");
    }
  }
  if (window.ResizeObserver) new ResizeObserver(send).observe(document.documentElement);
  window.addEventListener("load", send);
  window.addEventListener("message", function (event) {
    if (event.source === parent && event.data && event.data.type === "${EMBED_HEIGHT_REQUEST}") {
      last = 0;
      send();
    }
  });
  setInterval(send, 1000);
  send();
})();`;
  return [
    "<!doctype html>",
    '<html><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<base target="_blank">',
    "<style>html, body { margin: 0; padding: 0; } body { overflow: hidden; font-family: system-ui, sans-serif; }</style>",
    `</head><body>${code}<script>${reportHeight}</script></body></html>`,
  ].join("");
}
