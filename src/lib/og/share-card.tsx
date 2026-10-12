import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { ReactElement, ReactNode } from "react";
import { siteConfig, siteHost } from "@/config/site";
import { SOCIAL_IMAGE_SIZE } from "@/lib/media";

/** The palette of design/style-system, written out: share images cannot read Tailwind tokens. */
const color = {
  paper: "#F3F0E8",
  ink: "#17181A",
  line: "#D6D2C8",
  muted: "#55565A",
  accent: "#2E3BFF",
  lime: "#C8F031",
};

const FONT_DIR = join(process.cwd(), "assets/fonts");

/** Static TTF files with Cyrillic (next/og cannot use the woff2 files of next/font). */
async function loadFonts() {
  const [display, body, mono] = await Promise.all(
    ["Unbounded-ExtraBold.ttf", "Onest-Medium.ttf", "JetBrainsMono-Medium.ttf"].map((file) =>
      readFile(join(FONT_DIR, file)),
    ),
  );
  return [
    { name: "Unbounded", data: display, weight: 800 as const, style: "normal" as const },
    { name: "Onest", data: body, weight: 500 as const, style: "normal" as const },
    { name: "JetBrains Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

let fonts: ReturnType<typeof loadFonts> | undefined;

/** Long names and titles get smaller type so they still fit the card. */
function fitFontSize(text: string, steps: [maxLength: number, size: number][], smallest: number) {
  return steps.find(([maxLength]) => text.length <= maxLength)?.[1] ?? smallest;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function BrandMark({ size }: { size: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        background: color.accent,
        color: "#FFFFFF",
        fontFamily: "Unbounded",
        fontSize: size / 2,
      }}
    >
      {siteConfig.name.charAt(0)}
    </div>
  );
}

function Label({ children, tone = "muted" }: { children: string; tone?: "muted" | "ink" }) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: "JetBrains Mono",
        fontSize: 22,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: tone === "ink" ? color.ink : color.muted,
      }}
    >
      {children}
    </div>
  );
}

/** Paper card with the 1px frame of the site's grid. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: 40,
        background: color.paper,
        color: color.ink,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "44px 52px",
          border: `1px solid ${color.line}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface RenderOptions {
  size?: { width: number; height: number };
  cacheControl?: string;
}

async function render(
  card: ReactElement,
  { size = SOCIAL_IMAGE_SIZE, cacheControl }: RenderOptions = {},
) {
  fonts ??= loadFonts();
  return new ImageResponse(card, {
    ...size,
    fonts: await fonts,
    headers: cacheControl ? { "Cache-Control": cacheControl } : undefined,
  });
}

/** The accent square with the name's first letter, as an icon of `size` pixels. */
export function brandMarkImage(size: number) {
  return render(<BrandMark size={size} />, { size: { width: size, height: size } });
}

/** The site's default share image: huge name, accent square, tagline. */
export function siteShareImage() {
  const nameSize = fitFontSize(
    siteConfig.name,
    [
      [6, 220],
      [10, 150],
      [16, 104],
    ],
    76,
  );
  return render(
    <Frame>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BrandMark size={88} />
        <Label>{siteHost()}</Label>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Unbounded",
            fontSize: nameSize,
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          {siteConfig.name}
        </div>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "6px 14px",
            background: color.lime,
            fontFamily: "Onest",
            fontSize: 38,
            lineHeight: 1.25,
          }}
        >
          {siteConfig.tagline}
        </div>
      </div>
    </Frame>,
  );
}

interface ContentShareImage {
  title: string;
  /** Category or event type, shown in brackets above the title. */
  label: string;
  /** Formatted date at the bottom. */
  date?: string;
}

/** Public share images: their URL carries the row's updated_at, so they may be cached for a year. */
const CACHED_FOR_A_YEAR = "public, max-age=31536000, s-maxage=31536000, immutable";

/** Share image of an article or event without a cover: its title in the site's style. */
export function contentShareImage(
  { title, label, date }: ContentShareImage,
  cacheControl = CACHED_FOR_A_YEAR,
) {
  const shown = truncate(title, 140);
  const titleSize = fitFontSize(
    shown,
    [
      [40, 76],
      [70, 62],
      [100, 52],
    ],
    44,
  );
  return render(
    <Frame>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BrandMark size={52} />
          <div style={{ display: "flex", fontFamily: "Unbounded", fontSize: 34 }}>
            {siteConfig.name}
          </div>
        </div>
        <Label tone="ink">{`[ ${label} ]`}</Label>
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "Unbounded",
          fontSize: titleSize,
          lineHeight: 1.12,
          letterSpacing: "-0.02em",
        }}
      >
        {shown}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: 22,
          borderTop: `1px solid ${color.line}`,
        }}
      >
        <Label>{siteHost()}</Label>
        {date ? <Label>{date}</Label> : <div style={{ display: "flex" }} />}
      </div>
    </Frame>,
    { cacheControl },
  );
}
