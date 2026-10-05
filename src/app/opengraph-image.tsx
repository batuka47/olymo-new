import { siteConfig } from "@/config/site";
import { SOCIAL_IMAGE_SIZE } from "@/lib/media";
import { siteShareImage } from "@/lib/og/share-card";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = "image/png";

/** Share image of every page without its own (articles and events bring theirs). */
export default function OpengraphImage() {
  return siteShareImage();
}
