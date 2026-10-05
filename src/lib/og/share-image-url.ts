import { siteConfig } from "@/config/site";
import { mediaUrl, socialImagePath } from "@/lib/media";

interface Shareable {
  slug: string;
  updated_at: string;
  cover_path: string | null;
}

/**
 * Absolute URL of a 1200 × 630 share image: the crop stored with the cover, or one drawn from the
 * title at /og/{kind}/{slug} when there is no cover. updated_at in that URL changes it on every
 * save, so it can be cached for a year.
 */
export function shareImageUrl(kind: "articles" | "events", item: Shareable): string {
  if (item.cover_path) {
    return mediaUrl(socialImagePath(item.cover_path));
  }
  const version = Date.parse(item.updated_at).toString(36);
  return `${siteConfig.url}/og/${kind}/${encodeURIComponent(item.slug)}?v=${version}`;
}
