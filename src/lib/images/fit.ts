// How an image resized in the browser is kept small enough to upload, whatever was picked: a
// 50 MP phone photo, a scan, a very long infographic. Pure, so it is tested without a browser.

/** Files aim to be under this; the bucket takes up to MEDIA_BUCKET_LIMIT_BYTES as a margin. */
export const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024;

/** The media bucket's file_size_limit (migration 20261012000100_media_bucket_limit.sql). */
export const MEDIA_BUCKET_LIMIT_BYTES = 10 * 1024 * 1024;

/** Quality steps for a file that is too big, after the format's own; 0.6 is the last. */
const LOWER_QUALITIES = [0.7, 0.6];
export const MIN_QUALITY = LOWER_QUALITIES[LOWER_QUALITIES.length - 1];

/** Then narrower, 400 px at a time, down to 1600 px. */
const WIDTH_STEP = 400;
export const MIN_FIT_WIDTH = 1600;

/**
 * iPhones cannot draw a canvas over 16.7 million pixels (toBlob gives nothing); every copy stays
 * under this, which also keeps very long images small.
 */
export const MAX_CANVAS_PIXELS = 16_000_000;

/** Never narrower than this, even for a file the bucket would still refuse. */
const NARROWEST_WIDTH = 400;

export interface FitAttempt {
  width: number;
  quality: number;
}

export interface FittedImage<File> {
  file: File;
  attempt: FitAttempt;
}

/** The widest copy of a width × height image that a phone can draw. */
export function widthWithinCanvas(width: number, height: number): number {
  return Math.min(width, Math.floor(Math.sqrt((MAX_CANVAS_PIXELS * width) / height)));
}

/** What to try, in order: lower quality first, then narrower. */
export function fitAttempts({ width, quality }: FitAttempt): FitAttempt[] {
  const attempts = [quality, ...LOWER_QUALITIES.filter((lower) => lower < quality)].map(
    (stepQuality) => ({ width, quality: stepQuality }),
  );
  let narrower = width;
  while (narrower > MIN_FIT_WIDTH) {
    narrower = Math.max(MIN_FIT_WIDTH, narrower - WIDTH_STEP);
    attempts.push({ width: narrower, quality: MIN_QUALITY });
  }
  return attempts;
}

/**
 * Encodes with `encode` until a file is under MAX_IMAGE_BYTES. If even 1600 px at quality 0.6 is
 * over (a very long image), that file is used: the bucket takes up to 10 MB. Only a file the bucket
 * would refuse is made narrower still, so an upload never fails on size.
 */
export async function fitImage<File extends { size: number }>(
  encode: (attempt: FitAttempt) => Promise<File>,
  start: FitAttempt,
): Promise<FittedImage<File>> {
  const [first, ...rest] = fitAttempts(start);
  let fitted: FittedImage<File> = { file: await encode(first), attempt: first };
  for (const attempt of rest) {
    if (fitted.file.size <= MAX_IMAGE_BYTES) return fitted;
    fitted = { file: await encode(attempt), attempt };
  }
  while (fitted.file.size > MEDIA_BUCKET_LIMIT_BYTES && fitted.attempt.width > NARROWEST_WIDTH) {
    const attempt = {
      width: Math.max(NARROWEST_WIDTH, Math.round(fitted.attempt.width * 0.75)),
      quality: MIN_QUALITY,
    };
    fitted = { file: await encode(attempt), attempt };
  }
  return fitted;
}
