/**
 * Iframes from these addresses are shown as they are when an editor pastes embed code (Google
 * Maps, Forms, Canva…). Any other code runs in a sandboxed frame instead (src/lib/editor/embeds.ts).
 * Each entry is a host and the path its embeddable pages start with.
 */
export const allowedIframeSources: { host: string; pathPrefix: string }[] = [
  { host: "www.google.com", pathPrefix: "/maps/embed" },
  { host: "maps.google.com", pathPrefix: "/maps" },
  { host: "docs.google.com", pathPrefix: "/forms/" },
  { host: "docs.google.com", pathPrefix: "/document/" },
  { host: "docs.google.com", pathPrefix: "/presentation/" },
  { host: "docs.google.com", pathPrefix: "/spreadsheets/" },
  { host: "calendar.google.com", pathPrefix: "/calendar/embed" },
  { host: "drive.google.com", pathPrefix: "/file/" },
  { host: "www.canva.com", pathPrefix: "/design/" },
  { host: "player.vimeo.com", pathPrefix: "/video/" },
  { host: "open.spotify.com", pathPrefix: "/embed/" },
  { host: "w.soundcloud.com", pathPrefix: "/player/" },
  { host: "www.facebook.com", pathPrefix: "/plugins/" },
];

/** Social posts that can be embedded with the platform's own script. */
export const socialPlatforms = ["facebook", "instagram", "x", "tiktok"] as const;
export type SocialPlatform = (typeof socialPlatforms)[number];
