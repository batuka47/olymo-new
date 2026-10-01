import type { EncodedImage } from "@/lib/images/encode";
import { MEDIA_BUCKET, type ImageExtension, type ImageWidth } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";

/**
 * Uploads every width of an encoded image to the media bucket from the browser, as the signed-in
 * staff member (storage RLS allows staff only). Returns the 1600 px path, which is what gets saved.
 */
export async function uploadVariants(
  image: EncodedImage,
  pathFor: (width: ImageWidth, extension: ImageExtension) => string,
): Promise<string> {
  const supabase = createClient();
  const results = await Promise.all(
    image.variants.map((variant) =>
      supabase.storage
        .from(MEDIA_BUCKET)
        .upload(pathFor(variant.width, image.format.extension), variant.blob, {
          contentType: image.format.mimeType,
          cacheControl: "3600",
          upsert: true,
        }),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    throw failed.error;
  }
  return pathFor(1600, image.format.extension);
}
