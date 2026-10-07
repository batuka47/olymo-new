import { encodeBodyImage } from "@/lib/images/encode";
import { uploadMedia } from "@/lib/images/upload";
import { mediaUrl, newUploadToken } from "@/lib/media";

/** What an image in the article text stores: the files, and its size to keep its space. */
export interface BodyImageFiles {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

/** Share of the progress bar for resizing in the browser; the uploads fill the rest. */
const RESIZE_SHARE = 0.3;
/** The width readers without srcset support get. */
const FALLBACK_WIDTH = 800;

/**
 * Resizes one image in the browser and uploads every width to `folder` (articles/{id}, …).
 * onProgress receives 0–1 as the work goes on.
 */
export async function uploadBodyImage(
  file: File,
  folder: string,
  onProgress?: (fraction: number) => void,
): Promise<BodyImageFiles> {
  onProgress?.(0.05);
  const image = await encodeBodyImage(file);
  onProgress?.(RESIZE_SHARE);

  const token = newUploadToken();
  let uploaded = 0;
  const files = await Promise.all(
    image.variants.map(async ({ width, blob }) => {
      const path = `${folder}/body-${token}-${width}.${image.format.extension}`;
      await uploadMedia(path, blob);
      uploaded += 1;
      onProgress?.(RESIZE_SHARE + ((1 - RESIZE_SHARE) * uploaded) / image.variants.length);
      return { width, url: mediaUrl(path) };
    }),
  );

  const fallback = files.filter((file) => file.width <= FALLBACK_WIDTH).at(-1) ?? files[0];
  return {
    src: fallback.url,
    srcset: files.map((file) => `${file.url} ${file.width}w`).join(", "),
    width: image.size.width,
    height: image.size.height,
  };
}
