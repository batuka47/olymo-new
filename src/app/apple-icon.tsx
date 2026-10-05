import { brandMarkImage } from "@/lib/og/share-card";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home screen icon on iPhones and iPads. */
export default function AppleIcon() {
  return brandMarkImage(size.width);
}
