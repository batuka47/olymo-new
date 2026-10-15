// Demo images, stored the way the admin stores uploads: every width next to the others,
// {folder}/{name}-{token}-{width}.jpg, with the 1600 px path saved in the row.
import type { Browser } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  IMAGE_WIDTHS,
  MEDIA_BUCKET,
  MEDIA_CACHE_SECONDS,
  mediaUrl,
  newUploadToken,
  SOCIAL_IMAGE_SIZE,
  socialImagePath,
  type ImageWidth,
} from "../../src/lib/media";
import type { BodyImage } from "./body";

/**
 * Free photos (Unsplash licence) from picsum.photos. A seed always gives the same photo, so the
 * demo looks the same after every fill.
 */
const PHOTO_SOURCE = "https://picsum.photos/seed";
/** Height of a photo for its width: 3:2, like most camera pictures. */
const PHOTO_RATIO = 2 / 3;

type PathBuilder = (token: string, width: ImageWidth) => string;

export async function uploadFile(
  supabase: SupabaseClient,
  path: string,
  body: ArrayBuffer | Buffer,
): Promise<void> {
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, body, {
    contentType: "image/jpeg",
    cacheControl: String(MEDIA_CACHE_SECONDS),
    upsert: true,
  });
  if (error) {
    throw new Error(`Could not upload ${path}: ${error.message}`);
  }
}

async function fetchPhoto(seed: string, width: number, height: number): Promise<ArrayBuffer> {
  const response = await fetch(`${PHOTO_SOURCE}/${seed}/${width}/${height}.jpg`);
  if (!response.ok) {
    throw new Error(`Could not download photo "${seed}" (${width}×${height}): ${response.status}`);
  }
  return response.arrayBuffer();
}

function photoHeight(width: number): number {
  return Math.round(width * PHOTO_RATIO);
}

/** Uploads a photo in every width; returns the path of the 1600 px file. */
async function uploadPhotoWidths(
  supabase: SupabaseClient,
  seed: string,
  pathFor: PathBuilder,
): Promise<{ token: string; path: string }> {
  const token = newUploadToken();
  await Promise.all(
    IMAGE_WIDTHS.map(async (width) =>
      uploadFile(
        supabase,
        pathFor(token, width),
        await fetchPhoto(seed, width, photoHeight(width)),
      ),
    ),
  );
  return { token, path: pathFor(token, 1600) };
}

/** A cover photo with its 1200 × 630 share image, as the admin crops it on upload. */
export async function uploadCover(
  supabase: SupabaseClient,
  seed: string,
  pathFor: PathBuilder,
): Promise<string> {
  const { path } = await uploadPhotoWidths(supabase, seed, pathFor);
  const { width, height } = SOCIAL_IMAGE_SIZE;
  await uploadFile(supabase, socialImagePath(path), await fetchPhoto(seed, width, height));
  return path;
}

/** A photo in the text of an article (folder articles/{id}, files body-{token}-{width}.jpg). */
export async function uploadBodyPhoto(
  supabase: SupabaseClient,
  folder: string,
  seed: string,
): Promise<BodyImage> {
  const pathFor: PathBuilder = (token, width) => `${folder}/body-${token}-${width}.jpg`;
  const { token } = await uploadPhotoWidths(supabase, seed, pathFor);
  return {
    src: mediaUrl(pathFor(token, 800)),
    srcset: IMAGE_WIDTHS.map((width) => `${mediaUrl(pathFor(token, width))} ${width}w`).join(", "),
    width: 1600,
    height: photoHeight(1600),
  };
}

/**
 * Draws `html` at `size` (CSS pixels) and uploads it in every width, sharper for the wider files.
 * Returns the path of the 1600 px file.
 */
export async function uploadDrawing(
  supabase: SupabaseClient,
  browser: Browser,
  html: string,
  size: { width: number; height: number },
  pathFor: PathBuilder,
): Promise<string> {
  const token = newUploadToken();
  for (const width of IMAGE_WIDTHS) {
    const page = await browser.newPage({
      viewport: size,
      deviceScaleFactor: width / size.width,
    });
    await page.setContent(html);
    const picture = await page.screenshot({ type: "jpeg", quality: 88 });
    await page.close();
    await uploadFile(supabase, pathFor(token, width), picture);
  }
  return pathFor(token, 1600);
}
