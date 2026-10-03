import "server-only";
import { unstable_cache } from "next/cache";
import type { AdPlacement } from "@/config/ads";
import { createPublicClient } from "@/lib/supabase/server";

/** unstable_cache tag of the running ads; ad saves in the admin expire it. */
export const ADS_CACHE_TAG = "ads";

/**
 * Ads readers may see now for one placement (RLS: active and inside their dates). Cached for 60 s,
 * so an ad starts or ends within about a minute of its time.
 */
export const getRunningAds = unstable_cache(
  async (placement: AdPlacement) => {
    const { data, error } = await createPublicClient()
      .from("ads")
      .select("id, title, image_path, image_path_mobile, updated_at")
      .eq("placement", placement);
    if (error) {
      throw error;
    }
    return data;
  },
  ["running-ads"],
  { revalidate: 60, tags: [ADS_CACHE_TAG] },
);

export type RunningAd = Awaited<ReturnType<typeof getRunningAds>>[number];

/** One running ad at random, so ads sharing a placement take turns. */
export function pickAd(ads: RunningAd[]): RunningAd | null {
  return ads.length > 0 ? ads[Math.floor(Math.random() * ads.length)] : null;
}
