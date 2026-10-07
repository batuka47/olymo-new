import { fitImage, widthWithinCanvas } from "@/lib/images/fit";
import { IMAGE_WIDTHS, SOCIAL_IMAGE_SIZE, type ImageExtension, type ImageWidth } from "@/lib/media";

/** Any image the browser can read: phone photos of any size are resized here before upload. */
export const IMAGE_INPUT_ACCEPT = "image/*";

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/** The browser could not decode the file (HEIC in Chrome, a broken file). */
export class UnreadableImageError extends Error {}

/** Widths of images in the article text: none wider than 2400 px, the widest full-width use. */
export const BODY_IMAGE_WIDTHS = [400, 800, 1600, 2400] as const;

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

export interface EncodedImage<Width extends number = ImageWidth> {
  format: OutputFormat;
  variants: { width: Width; blob: Blob }[];
  /** Pixel size of the largest file, for the width and height attributes of <img>. */
  size: { width: number; height: number };
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

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality = format.quality,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, format.mimeType, quality));
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
  quality = format.quality,
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

  const blob = await canvasToBlob(canvas, format, quality);
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

/** Size of a `width` px wide copy: never larger than the original, nor than a phone can draw. */
function scaledSize(bitmap: ImageBitmap, width: number) {
  const scaledWidth = Math.min(width, widthWithinCanvas(bitmap.width, bitmap.height));
  return { width: scaledWidth, height: Math.round((bitmap.height * scaledWidth) / bitmap.width) };
}

function encodeWidth(bitmap: ImageBitmap, width: number, format: OutputFormat, quality?: number) {
  const target = scaledSize(bitmap, width);
  return encode(bitmap, wholeImage(bitmap), target.width, target.height, format, quality);
}

/** The widest copy, re-encoded smaller (see fitImage) until it is small enough to upload. */
function encodeLargest(bitmap: ImageBitmap, width: number, format: OutputFormat) {
  return fitImage((attempt) => encodeWidth(bitmap, attempt.width, format, attempt.quality), {
    width: scaledSize(bitmap, width).width,
    quality: format.quality,
  });
}

const LARGEST_STORED_WIDTH = IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];

/**
 * Every stored cover width, named by width even when the photo is smaller (900 px → "1600"). The
 * largest is fitted under the upload limit first; the smaller ones use the quality it needed.
 */
async function encodeStoredWidths(bitmap: ImageBitmap, format: OutputFormat) {
  const largest = await encodeLargest(bitmap, LARGEST_STORED_WIDTH, format);
  const smaller = await Promise.all(
    IMAGE_WIDTHS.slice(0, -1).map(async (width) => ({
      width,
      blob: await encodeWidth(bitmap, width, format, largest.attempt.quality),
    })),
  );
  return [...smaller, { width: LARGEST_STORED_WIDTH, blob: largest.file }];
}

async function withBitmap<T>(file: File, handle: (bitmap: ImageBitmap) => Promise<T>): Promise<T> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new UnreadableImageError(`Could not decode ${file.name}`);
  }
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
 * encoded) JPEG. Covers, ads and team photos.
 */
export function encodeImageVariants(file: File): Promise<EncodedImage> {
  return withBitmap(file, async (bitmap) => {
    const format = await outputFormat();
    return {
      format,
      variants: await encodeStoredWidths(bitmap, format),
      size: scaledSize(bitmap, LARGEST_STORED_WIDTH),
    };
  });
}

/** The widths of encodeImageVariants plus the share image for link previews. */
export function encodeCoverImage(file: File): Promise<EncodedCover> {
  return withBitmap(file, async (bitmap) => {
    const format = await outputFormat();
    const { width, height } = SOCIAL_IMAGE_SIZE;
    const [variants, socialImage] = await Promise.all([
      encodeStoredWidths(bitmap, format),
      encode(bitmap, centredCrop(bitmap, width, height), width, height, JPEG),
    ]);
    return { format, variants, size: scaledSize(bitmap, LARGEST_STORED_WIDTH), socialImage };
  });
}

/**
 * An image for the article text: BODY_IMAGE_WIDTHS up to the photo's own width, each file named
 * and listed in srcset by its real width (a 1000 px photo gives 400, 800 and 1000). The widest is
 * fitted under the upload limit first, which can make it narrower (2400 → 2000 → 1600).
 */
export function encodeBodyImage(file: File): Promise<EncodedImage<number>> {
  return withBitmap(file, async (bitmap) => {
    const format = await outputFormat();
    const widest = BODY_IMAGE_WIDTHS[BODY_IMAGE_WIDTHS.length - 1];
    const largest = await encodeLargest(bitmap, widest, format);
    const { width: largestWidth, quality } = largest.attempt;
    const smallerWidths = [
      ...new Set(BODY_IMAGE_WIDTHS.map((width) => scaledSize(bitmap, width).width)),
    ].filter((width) => width < largestWidth);
    const smaller = await Promise.all(
      smallerWidths.map(async (width) => ({
        width,
        blob: await encodeWidth(bitmap, width, format, quality),
      })),
    );
    return {
      format,
      variants: [...smaller, { width: largestWidth, blob: largest.file }],
      size: scaledSize(bitmap, largestWidth),
    };
  });
}

export function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
