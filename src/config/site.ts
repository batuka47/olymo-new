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

export const siteConfig = {
  name: "НЭР",
  tagline: t("site.tagline"),
  url: siteUrl.replace(/\/+$/, ""),
  email: "[ИМЭЙЛ]",
  phone: "[УТАС]",
  address: "[ХАЯГ]",
  socials,
} as const;
