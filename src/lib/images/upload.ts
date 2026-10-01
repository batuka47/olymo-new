import type { EncodedImage } from "@/lib/images/encode";
import { MEDIA_BUCKET, type ImageExtension, type ImageWidth } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a file to the media bucket from the browser, as the signed-in staff member (storage RLS
 * allows staff only). Replaces any file at the same path.
 */
export async function uploadMedia(path: string, blob: Blob): Promise<void> {
  const { error } = await createClient()
    .storage.from(MEDIA_BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: "3600", upsert: true });
  if (error) {
    throw error;
  }
}

/** Uploads every width of an encoded image. Returns the 1600 px path, which is what gets saved. */
export async function uploadVariants(
  image: EncodedImage,
  pathFor: (width: ImageWidth, extension: ImageExtension) => string,
): Promise<string> {
  await Promise.all(
    image.variants.map((variant) =>
      uploadMedia(pathFor(variant.width, image.format.extension), variant.blob),
    ),
  );
  return pathFor(1600, image.format.extension);
}
