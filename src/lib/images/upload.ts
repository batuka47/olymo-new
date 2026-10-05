import type { EncodedImage } from "@/lib/images/encode";
import {
  MEDIA_BUCKET,
  MEDIA_CACHE_SECONDS,
  newUploadToken,
  type VariantPathBuilder,
} from "@/lib/media";
import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a file to the media bucket from the browser, as the signed-in staff member (storage RLS
 * allows staff only). File names are new for every upload and never overwritten, so the file is
 * cached for a year.
 */
export async function uploadMedia(path: string, blob: Blob): Promise<void> {
  const { error } = await createClient()
    .storage.from(MEDIA_BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: String(MEDIA_CACHE_SECONDS) });
  if (error) {
    throw error;
  }
}

/** Uploads every width of an encoded image. Returns the 1600 px path, which is what gets saved. */
export async function uploadVariants(
  image: EncodedImage,
  pathFor: VariantPathBuilder,
): Promise<string> {
  const token = newUploadToken();
  await Promise.all(
    image.variants.map((variant) =>
      uploadMedia(pathFor(token, variant.width, image.format.extension), variant.blob),
    ),
  );
  return pathFor(token, 1600, image.format.extension);
}
