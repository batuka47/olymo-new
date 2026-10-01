import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/** A page's own openGraph replaces the root one entirely, so pages that set it spread this in. */
export const siteOpenGraph = {
  siteName: siteConfig.name,
  locale: "mn_MN",
} satisfies Metadata["openGraph"];
