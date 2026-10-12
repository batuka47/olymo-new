import type { SocialPlatform } from "@/config/embeds";

// Each platform's own embed script turns its markup (socialPostSpec in lib/editor/nodes.ts) into
// the post at the post's own size. A script is added only when a post of that platform nears the
// screen, and only once per page.

declare global {
  interface Window {
    twttr?: { widgets?: { load: (element?: HTMLElement) => void } };
    instgrm?: { Embeds?: { process: () => void } };
    FB?: { XFBML?: { parse: (element?: HTMLElement) => void } };
  }
}

const SCRIPTS: Record<SocialPlatform, string> = {
  x: "https://platform.twitter.com/widgets.js",
  instagram: "https://www.instagram.com/embed.js",
  tiktok: "https://www.tiktok.com/embed.js",
  facebook: "https://connect.facebook.net/mn_MN/sdk.js#xfbml=1&version=v21.0",
};

const loading = new Map<SocialPlatform, Promise<void>>();

function addScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.body.append(script);
  });
}

function loadScript(platform: SocialPlatform): Promise<void> {
  if (platform === "facebook" && !document.getElementById("fb-root")) {
    const root = document.createElement("div");
    root.id = "fb-root";
    document.body.prepend(root);
  }
  let pending = loading.get(platform);
  if (!pending) {
    pending = addScript(SCRIPTS[platform]);
    loading.set(platform, pending);
  }
  return pending;
}

/** Draws one post; the platform's script processes the markup inside `figure`. */
export async function renderSocialPost(figure: HTMLElement): Promise<void> {
  const platform = figure.dataset.social as SocialPlatform | undefined;
  if (!platform || !(platform in SCRIPTS)) return;
  const firstLoad = !loading.has(platform);
  await loadScript(platform);
  switch (platform) {
    case "x":
      window.twttr?.widgets?.load(figure);
      break;
    case "instagram":
      window.instgrm?.Embeds?.process();
      break;
    case "facebook":
      window.FB?.XFBML?.parse(figure);
      break;
    case "tiktok":
      // TikTok's script has no "process" call: it reads the page when it runs, so posts added
      // after the first load need it to run again.
      if (!firstLoad) await addScript(`${SCRIPTS.tiktok}?${Date.now()}`);
      break;
  }
}

/** Renders each post in `root` when it comes within `margin` of the screen. */
export function renderSocialPostsNearScreen(root: HTMLElement, margin = "600px"): () => void {
  const posts = root.querySelectorAll<HTMLElement>("figure[data-social]");
  if (posts.length === 0) return () => {};
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        void renderSocialPost(entry.target as HTMLElement).catch(() => {
          // Blocked or offline: the plain link to the post stays in place.
        });
      }
    },
    { rootMargin: `${margin} 0px` },
  );
  posts.forEach((post) => observer.observe(post));
  return () => observer.disconnect();
}
