import type { MessageKey } from "@/lib/i18n";

/** Same values as the ads.placement check constraint. */
export const adPlacements = [
  "home_1",
  "home_2",
  "home_3",
  "home_4",
  "category_1",
  "category_2",
  "category_3",
  "article_side",
] as const;

export type AdPlacement = (typeof adPlacements)[number];

export function isAdPlacement(value: string): value is AdPlacement {
  return adPlacements.some((placement) => placement === value);
}

interface AdSize {
  width: number;
  height: number;
}

interface AdFormat {
  desktop: AdSize;
  /** Shown under 640 px when uploaded; null where one image serves every screen. */
  mobile: AdSize | null;
  /** The img sizes attribute: how wide the slot is drawn. */
  sizes: string;
}

/** Recommended image sizes; the slot keeps these proportions and crops anything else. */
const leaderboard: AdFormat = {
  desktop: { width: 1248, height: 140 },
  mobile: { width: 358, height: 100 },
  sizes: "(min-width: 1440px) 1248px, 100vw",
};
const rectangle: AdFormat = {
  desktop: { width: 300, height: 250 },
  mobile: null,
  sizes: "300px",
};

export function adFormat(placement: AdPlacement): AdFormat {
  return placement === "article_side" ? rectangle : leaderboard;
}

/** Where each placement appears, for the admin. */
export const adPlacementLabelKeys: Record<AdPlacement, MessageKey> = {
  home_1: "ads.placements.home_1",
  home_2: "ads.placements.home_2",
  home_3: "ads.placements.home_3",
  home_4: "ads.placements.home_4",
  category_1: "ads.placements.category_1",
  category_2: "ads.placements.category_2",
  category_3: "ads.placements.category_3",
  article_side: "ads.placements.article_side",
};
