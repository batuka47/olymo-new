import { getSupabaseConfig } from "@/lib/supabase/config";

export const MEDIA_BUCKET = "media";

/** Every uploaded image is stored in these widths as name-{width}.{extension}. */
export const IMAGE_WIDTHS = [400, 800, 1600] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

/** WebP where the browser can encode it, JPEG otherwise (Safari). All widths share one format. */
export const IMAGE_EXTENSIONS = ["webp", "jpg"] as const;
export type ImageExtension = (typeof IMAGE_EXTENSIONS)[number];

const VARIANT_SUFFIX = /-\d+\.(webp|jpg)$/;

/** Start of every public media URL, e.g. https://xyz.supabase.co/storage/v1/object/public/media/ */
export function mediaUrlPrefix(): string {
  return `${getSupabaseConfig().url}/storage/v1/object/public/${MEDIA_BUCKET}/`;
}

/** `version` busts caches when a file is replaced at the same path. */
export function mediaUrl(path: string, version?: string | number): string {
  const url = `${mediaUrlPrefix()}${path}`;
  return version === undefined ? url : `${url}?v=${encodeURIComponent(String(version))}`;
}

/**
 * The saved path is the 1600 px variant (its extension records the format); the other widths sit
 * next to it with the same extension.
 */
export function variantPath(path: string, width: ImageWidth): string {
  return path.replace(VARIANT_SUFFIX, `-${width}.$1`);
}

export function responsiveImageSources(path: string, version?: string | number) {
  if (!VARIANT_SUFFIX.test(path)) {
    return { src: mediaUrl(path, version), srcSet: undefined };
  }
  return {
    src: mediaUrl(variantPath(path, 800), version),
    srcSet: IMAGE_WIDTHS.map(
      (width) => `${mediaUrl(variantPath(path, width), version)} ${width}w`,
    ).join(", "),
  };
}

export function articleFolder(articleId: string): string {
  return `articles/${articleId}`;
}

export function articleCoverPath(
  articleId: string,
  width: ImageWidth,
  extension: ImageExtension,
): string {
  return `${articleFolder(articleId)}/cover-${width}.${extension}`;
}
