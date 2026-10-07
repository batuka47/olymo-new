import { describe, expect, it } from "vitest";
import {
  fitAttempts,
  fitImage,
  MAX_CANVAS_PIXELS,
  MAX_IMAGE_BYTES,
  MEDIA_BUCKET_LIMIT_BYTES,
  widthWithinCanvas,
  type FitAttempt,
} from "./fit";

/**
 * Stands in for the browser's encoder: the file grows with the pixels drawn and the quality.
 * 0.55 bytes per pixel at full quality is a pessimistic, noisy photo.
 */
function fakeEncoder(width: number, height: number, bytesPerPixel = 0.55) {
  const attempts: (FitAttempt & { pixels: number })[] = [];
  const encode = async (attempt: FitAttempt) => {
    const pixels = attempt.width * Math.round((height * attempt.width) / width);
    attempts.push({ ...attempt, pixels });
    return { size: pixels * attempt.quality * bytesPerPixel };
  };
  return { encode, attempts };
}

/** Where encodeLargest starts: the widest copy, no wider than the photo or a phone's canvas. */
function start(width: number, height: number, widest: number, quality = 0.8): FitAttempt {
  return { width: Math.min(widest, widthWithinCanvas(width, height)), quality };
}

describe("fitAttempts", () => {
  it("lowers the quality to 0.6 first, then the width to 1600 px", () => {
    expect(fitAttempts({ width: 2400, quality: 0.8 })).toEqual([
      { width: 2400, quality: 0.8 },
      { width: 2400, quality: 0.7 },
      { width: 2400, quality: 0.6 },
      { width: 2000, quality: 0.6 },
      { width: 1600, quality: 0.6 },
    ]);
  });

  it("starts from JPEG's own quality and always ends at 1600 px", () => {
    expect(fitAttempts({ width: 2200, quality: 0.82 })).toEqual([
      { width: 2200, quality: 0.82 },
      { width: 2200, quality: 0.7 },
      { width: 2200, quality: 0.6 },
      { width: 1800, quality: 0.6 },
      { width: 1600, quality: 0.6 },
    ]);
  });

  it("never makes a copy of 1600 px or less narrower", () => {
    expect(fitAttempts({ width: 1200, quality: 0.8 }).map((attempt) => attempt.width)).toEqual([
      1200, 1200, 1200,
    ]);
  });
});

describe("fitImage", () => {
  it("keeps the first file of an ordinary phone photo", async () => {
    const { encode, attempts } = fakeEncoder(4000, 3000);
    const fitted = await fitImage(encode, start(4000, 3000, 2400));
    expect(attempts).toHaveLength(1);
    expect(fitted.attempt).toEqual({ width: 2400, quality: 0.8 });
    expect(fitted.file.size).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
  });

  it("re-encodes a tall poster at lower quality, then narrower, until it fits", async () => {
    const { encode, attempts } = fakeEncoder(2400, 6600);
    const fitted = await fitImage(encode, start(2400, 6600, 2400));
    expect(attempts.map(({ width, quality }) => [width, quality])).toEqual([
      [2400, 0.8],
      [2400, 0.7],
      [2400, 0.6],
      [2000, 0.6],
    ]);
    expect(fitted.attempt).toEqual({ width: 2000, quality: 0.6 });
    expect(fitted.file.size).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
  });

  it("uploads a very tall image (3000 × 40000 px) without failing", async () => {
    const { encode, attempts } = fakeEncoder(3000, 40_000);
    const fitted = await fitImage(encode, start(3000, 40_000, 2400));
    // Narrowed so a phone can draw it (16 MP), then 0.6: just over 4.5 MB, within the bucket's 10.
    expect(fitted.attempt.width).toBe(1095);
    expect(attempts.every((attempt) => attempt.pixels <= MAX_CANVAS_PIXELS)).toBe(true);
    expect(fitted.attempt.quality).toBe(0.6);
    expect(fitted.file.size).toBeGreaterThan(MAX_IMAGE_BYTES);
    expect(fitted.file.size).toBeLessThanOrEqual(MEDIA_BUCKET_LIMIT_BYTES);
  });

  it("makes a file the bucket would refuse narrower still", async () => {
    // An encoder far worse than any real one: 3 bytes per pixel, 12.7 MB at 1600 px and 0.6.
    const { encode } = fakeEncoder(2400, 6600, 3);
    const fitted = await fitImage(encode, start(2400, 6600, 2400));
    expect(fitted.attempt.width).toBeLessThan(1600);
    expect(fitted.file.size).toBeLessThanOrEqual(MEDIA_BUCKET_LIMIT_BYTES);
  });
});
