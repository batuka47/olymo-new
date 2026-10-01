import { IMAGE_WIDTHS, type ImageExtension, type ImageWidth } from "@/lib/media";

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

interface OutputFormat {
  mimeType: "image/webp" | "image/jpeg";
  extension: ImageExtension;
  quality: number;
  label: string;
}

const WEBP: OutputFormat = {
  mimeType: "image/webp",
  extension: "webp",
  quality: 0.8,
  label: "WebP",
};
const JPEG: OutputFormat = {
  mimeType: "image/jpeg",
  extension: "jpg",
  quality: 0.82,
  label: "JPEG",
};

export interface EncodedImage {
  format: OutputFormat;
  variants: { width: ImageWidth; blob: Blob }[];
}

function canvasToBlob(canvas: HTMLCanvasElement, format: OutputFormat): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, format.mimeType, format.quality));
}

/** Browsers without a WebP encoder (Safari) quietly return a PNG when asked for WebP. */
async function canEncodeWebp(): Promise<boolean> {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const blob = await canvasToBlob(canvas, WEBP);
  return blob?.type === WEBP.mimeType;
}

async function encode(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  format: OutputFormat,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is not available");
  }
  if (format === JPEG) {
    // JPEG has no transparency; without a background transparent areas turn black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, format);
  if (blob?.type !== format.mimeType) {
    throw new Error(`The browser could not encode ${format.label}`);
  }
  return blob;
}

/**
 * Resizes an image in the browser to every IMAGE_WIDTHS width, as WebP or (where WebP cannot be
 * encoded) JPEG. Images are never enlarged: a 900 px photo produces 400, 800 and 900 px files.
 */
export async function encodeImageVariants(file: File): Promise<EncodedImage> {
  const format = (await canEncodeWebp()) ? WEBP : JPEG;
  const bitmap = await createImageBitmap(file);
  try {
    const variants = await Promise.all(
      IMAGE_WIDTHS.map(async (width) => {
        const targetWidth = Math.min(width, bitmap.width);
        const targetHeight = Math.round((bitmap.height * targetWidth) / bitmap.width);
        return { width, blob: await encode(bitmap, targetWidth, targetHeight, format) };
      }),
    );
    return { format, variants };
  } finally {
    bitmap.close();
  }
}

export function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
