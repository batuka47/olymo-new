import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  // X shows og:image in a large card; pages without their own twitter field inherit this.
  twitter: { card: "summary_large_image" },
  facebook: siteConfig.facebookAppId ? { appId: siteConfig.facebookAppId } : undefined,
};

// Vercel's page view and Core Web Vitals scripts, off unless switched on (see .env.example).
const analyticsEnabled = process.env.VERCEL_ANALYTICS === "1";
const speedInsightsEnabled = process.env.VERCEL_SPEED_INSIGHTS === "1";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="mn"
      className={`${unbounded.variable} ${onest.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        {children}
        {analyticsEnabled && <Analytics />}
        {speedInsightsEnabled && <SpeedInsights />}
      </body>
    </html>
  );
}
