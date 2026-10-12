import { t } from "@/lib/i18n";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!siteUrl) {
  throw new Error(
    "NEXT_PUBLIC_SITE_URL is not set. Copy .env.example to .env.local and fill it in.",
  );
}

export type SocialNetwork = "facebook" | "instagram" | "youtube" | "tiktok";

// Full profile URLs; leave empty to hide a network.
const socials: Record<SocialNetwork, string> = {
  facebook: "",
  instagram: "",
  youtube: "",
  tiktok: "",
};

/** True while a contact value is still a "[УТАС]"-style placeholder that nobody has filled in. */
export function isPlaceholder(value: string): boolean {
  return value.includes("[");
}

export const siteConfig = {
  name: "НЭР",
  /** The company that runs the site, e.g. the data controller in the privacy policy. */
  legalName: "[ХУУЛИЙН ЭТГЭЭДИЙН НЭР]",
  tagline: t("site.tagline"),
  url: siteUrl.replace(/\/+$/, ""),
  email: "[ИМЭЙЛ]",
  phone: "[УТАС]",
  address: "[ХАЯГ]",
  socials,
  /** Optional; enables the Messenger share button on computers. See .env.example. */
  facebookAppId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? "",
  /** Off until launch: robots.txt shuts crawlers out and every page says noindex. */
  allowIndexing: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "1",
} as const;

/** "olymo.mn": the address shown on share cards and their previews. */
export function siteHost(): string {
  return new URL(siteConfig.url).host;
}
