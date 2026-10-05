import { brandMarkImage } from "@/lib/og/share-card";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Browser tab icon, and the logo in the site's schema.org data (see lib/json-ld.ts). */
export default function Icon() {
  return brandMarkImage(size.width);
}
