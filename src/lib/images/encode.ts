import { IMAGE_WIDTHS, SOCIAL_IMAGE_SIZE, type ImageExtension, type ImageWidth } from "@/lib/media";

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

export interface EncodedCover extends EncodedImage {
  /** SOCIAL_IMAGE_SIZE JPEG; every link-preview crawler reads JPEG. */
  socialImage: Blob;
}

interface SourceArea {
  x: number;
  y: number;
  width: number;
  height: number;
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
  source: SourceArea,
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
  context.drawImage(bitmap, source.x, source.y, source.width, source.height, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, format);
  if (blob?.type !== format.mimeType) {
    throw new Error(`The browser could not encode ${format.label}`);
  }
  return blob;
}

function wholeImage(bitmap: ImageBitmap): SourceArea {
  return { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
}

/** The centred part of the image with the target's aspect ratio (like object-fit: cover). */
function centredCrop(bitmap: ImageBitmap, width: number, height: number): SourceArea {
  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const cropWidth = width / scale;
  const cropHeight = height / scale;
  return {
    x: (bitmap.width - cropWidth) / 2,
    y: (bitmap.height - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  };
}

/** Images are never enlarged: a 900 px photo produces 400, 800 and 900 px files. */
function encodeWidths(
  bitmap: ImageBitmap,
  format: OutputFormat,
): Promise<EncodedImage["variants"]> {
  return Promise.all(
    IMAGE_WIDTHS.map(async (width) => {
      const targetWidth = Math.min(width, bitmap.width);
      const targetHeight = Math.round((bitmap.height * targetWidth) / bitmap.width);
      const blob = await encode(bitmap, wholeImage(bitmap), targetWidth, targetHeight, format);
      return { width, blob };
    }),
  );
}

async function withBitmap<T>(file: File, handle: (bitmap: ImageBitmap) => Promise<T>): Promise<T> {
  const bitmap = await createImageBitmap(file);
  try {
    return await handle(bitmap);
  } finally {
    bitmap.close();
  }
}

async function outputFormat(): Promise<OutputFormat> {
  return (await canEncodeWebp()) ? WEBP : JPEG;
}

/**
 * Resizes an image in the browser to every IMAGE_WIDTHS width, as WebP or (where WebP cannot be
 * encoded) JPEG.
 */
export function encodeImageVariants(file: File): Promise<EncodedImage> {
  return withBitmap(file, async (bitmap) => {
    const format = await outputFormat();
    return { format, variants: await encodeWidths(bitmap, format) };
  });
}

/** The widths of encodeImageVariants plus the share image for link previews. */
export function encodeCoverImage(file: File): Promise<EncodedCover> {
  return withBitmap(file, async (bitmap) => {
    const format = await outputFormat();
    const { width, height } = SOCIAL_IMAGE_SIZE;
    const [variants, socialImage] = await Promise.all([
      encodeWidths(bitmap, format),
      encode(bitmap, centredCrop(bitmap, width, height), width, height, JPEG),
    ]);
    return { format, variants, socialImage };
  });
}

export function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
