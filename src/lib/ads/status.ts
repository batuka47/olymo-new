import type { MessageKey } from "@/lib/i18n";

/** What readers see right now: the same rule as the "running ads" RLS policy. */
export type AdState = "running" | "scheduled" | "ended" | "paused";

interface AdTiming {
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
}

export function adState(ad: AdTiming, now = new Date()): AdState {
  if (!ad.is_active) {
    return "paused";
  }
  if (new Date(ad.starts_at) > now) {
    return "scheduled";
  }
  return ad.ends_at && new Date(ad.ends_at) <= now ? "ended" : "running";
}

export const adStateLabelKeys: Record<AdState, MessageKey> = {
  running: "admin.ads.state.running",
  scheduled: "admin.ads.state.scheduled",
  ended: "admin.ads.state.ended",
  paused: "admin.ads.state.paused",
};

/** Click-through rate as a percentage with one decimal, or null before the first impression. */
export function clickThroughRate(clicks: number, impressions: number): string | null {
  return impressions > 0 ? `${((clicks / impressions) * 100).toFixed(1)}%` : null;
}
