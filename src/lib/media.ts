import { getSupabaseConfig } from "@/lib/supabase/config";

export const MEDIA_BUCKET = "media";

/** Every uploaded image is stored in these widths as {name}-{token}-{width}.{extension}. */
export const IMAGE_WIDTHS = [400, 800, 1600] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

/** WebP where the browser can encode it, JPEG otherwise (Safari). All widths share one format. */
export const IMAGE_EXTENSIONS = ["webp", "jpg"] as const;
export type ImageExtension = (typeof IMAGE_EXTENSIONS)[number];

const VARIANT_SUFFIX = /-\d+\.(webp|jpg)$/;

/** Browsers and the CDN keep media files for a year: a stored file never changes. */
export const MEDIA_CACHE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Part of every uploaded file name, new for each upload, so replacing an image stores new files
 * instead of overwriting cached ones. Images uploaded before tokens have none (cover-1600.webp).
 */
export function newUploadToken(): string {
  return crypto.randomUUID().slice(0, 8);
}

/** Where each width of one upload goes, e.g. (token, width, extension) => articleCoverPath(…). */
export type VariantPathBuilder = (
  token: string,
  width: ImageWidth,
  extension: ImageExtension,
) => string;

/** Whether `path` is the 1600 px file of an image called `name` in `folder`, from any upload. */
export function isUploadedImagePath(path: string, folder: string, name: string): boolean {
  const prefix = `${folder}/${name}-`;
  if (!path.startsWith(prefix)) {
    return false;
  }
  return /^(?:[a-z0-9]{1,16}-)?1600\.(?:webp|jpg)$/.test(path.slice(prefix.length));
}

/** Start of every public media URL, e.g. https://xyz.supabase.co/storage/v1/object/public/media/ */
export function mediaUrlPrefix(): string {
  return `${getSupabaseConfig().url}/storage/v1/object/public/${MEDIA_BUCKET}/`;
}

export function mediaUrl(path: string): string {
  return `${mediaUrlPrefix()}${path}`;
}

/**
 * The saved path is the 1600 px variant (its extension records the format); the other widths sit
 * next to it with the same extension.
 */
export function variantPath(path: string, width: ImageWidth): string {
  return path.replace(VARIANT_SUFFIX, `-${width}.$1`);
}

export function responsiveImageSources(path: string) {
  if (!VARIANT_SUFFIX.test(path)) {
    return { src: mediaUrl(path), srcSet: undefined };
  }
  return {
    src: mediaUrl(variantPath(path, 800)),
    srcSet: IMAGE_WIDTHS.map((width) => `${mediaUrl(variantPath(path, width))} ${width}w`).join(
      ", ",
    ),
  };
}

/** Share image for Facebook, Messenger and X: 1200 × 630 JPEG, cropped from the cover on upload. */
export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** The share image stored next to a cover: cover-{token}-1600.webp → cover-{token}-og.jpg. */
export function socialImagePath(coverPath: string): string {
  return coverPath.replace(VARIANT_SUFFIX, "-og.jpg");
}

export function articleFolder(articleId: string): string {
  return `articles/${articleId}`;
}

export const COVER_NAME = "cover";

export function articleCoverPath(
  articleId: string,
  token: string,
  width: ImageWidth,
  extension: ImageExtension,
): string {
  return `${articleFolder(articleId)}/${COVER_NAME}-${token}-${width}.${extension}`;
}

export function adFolder(adId: string): string {
  return `ads/${adId}`;
}

export type AdImageKind = "desktop" | "mobile";

/** Ad images: ads/{id}/desktop-{token}-{width}.{extension}, and mobile-… for the phone image. */
export function adImagePath(
  adId: string,
  kind: AdImageKind,
  token: string,
  width: ImageWidth,
  extension: ImageExtension,
): string {
  return `${adFolder(adId)}/${kind}-${token}-${width}.${extension}`;
}

export function eventFolder(eventId: string): string {
  return `events/${eventId}`;
}

export function eventCoverPath(
  eventId: string,
  token: string,
  width: ImageWidth,
  extension: ImageExtension,
): string {
  return `${eventFolder(eventId)}/${COVER_NAME}-${token}-${width}.${extension}`;
}

/** Images added to a site page's text in /admin/pages. */
export function sitePageFolder(slug: string): string {
  return `pages/${slug}`;
}

export function teamFolder(memberId: string): string {
  return `team/${memberId}`;
}

export const TEAM_PHOTO_NAME = "photo";

export function teamPhotoPath(
  memberId: string,
  token: string,
  width: ImageWidth,
  extension: ImageExtension,
): string {
  return `${teamFolder(memberId)}/${TEAM_PHOTO_NAME}-${token}-${width}.${extension}`;
}
