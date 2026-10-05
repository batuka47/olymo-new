import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The colour pairs the site uses, read from the design tokens in globals.css, against WCAG 2.1 AA:
// 4.5:1 for text, 3:1 for the focus ring. Changing a token re-runs this.

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function token(name: string): string {
  const value = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  if (!value) throw new Error(`--color-${name} not found in globals.css`);
  return value;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

const color = (name: string) => (name === "white" ? "#ffffff" : token(name));

/** [text, background] as they appear on the site. */
const TEXT_PAIRS: [string, string][] = [
  ["ink", "paper"],
  ["muted", "paper"],
  ["graphite", "paper"],
  ["accent", "paper"],
  ["danger", "paper"],
  ["ink", "white"],
  ["muted", "white"],
  ["accent", "white"],
  ["ink", "stone"],
  ["muted", "stone"],
  ["paper", "ink"],
  ["fog", "ink"],
  ["ash", "ink"],
  ["lime", "ink"],
  ["white", "accent"],
  ["ink", "lime"],
];

describe("colour contrast of the design tokens", () => {
  it.each(TEXT_PAIRS)("%s text on %s is at least 4.5:1", (text, background) => {
    expect(contrast(color(text), color(background))).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ["accent", "paper"],
    ["accent", "white"],
    ["lime", "ink"],
  ])("the %s focus ring on %s is at least 3:1", (ring, background) => {
    expect(contrast(color(ring), color(background))).toBeGreaterThanOrEqual(3);
  });
});
