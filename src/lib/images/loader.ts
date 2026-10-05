import type { ImageLoaderProps } from "next/image";
import { IMAGE_WIDTHS, variantPath } from "../media";

/**
 * next/image loader for media bucket images. `src` is the URL of the 1600 px variant; the loader
 * returns the smallest stored width that covers the requested one, so Vercel never resizes images.
 */
export default function mediaImageLoader({ src, width }: ImageLoaderProps): string {
  const storedWidth =
    IMAGE_WIDTHS.find((stored) => stored >= width) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
  return variantPath(src, storedWidth);
}
