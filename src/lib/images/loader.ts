"use client";

import type { ImageLoaderProps } from "next/image";
import { IMAGE_WIDTHS, variantPath } from "../media";

/**
 * next/image loader for media bucket images. `src` is the URL of the 1600 px variant; the loader
 * returns the smallest stored width that covers the requested one.
 */
export default function mediaImageLoader({ src, width }: ImageLoaderProps): string {
  const storedWidth =
    IMAGE_WIDTHS.find((stored) => stored >= width) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
  const [path, query] = src.split("?");
  const resized = variantPath(path, storedWidth);
  return query ? `${resized}?${query}` : resized;
}
