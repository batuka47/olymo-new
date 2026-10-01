import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { jetbrainsMono, onest, unbounded } from "@/lib/fonts";
import { siteOpenGraph } from "@/lib/metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.tagline,
  openGraph: { ...siteOpenGraph, type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="mn"
      className={`${unbounded.variable} ${onest.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">{children}</body>
    </html>
  );
}
