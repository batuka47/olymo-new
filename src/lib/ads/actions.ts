"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Adds one to the ad's impression_count. Sent by AdImpression once per page view, when at least
 * half of the ad is on screen; nothing about the reader is stored.
 */
export async function recordAdImpression(adId: string): Promise<void> {
  const id = z.uuid().safeParse(adId);
  if (!id.success) {
    return;
  }
  const { error } = await createAdminClient().rpc("record_ad_impression", { ad_id: id.data });
  if (error) {
    console.error("Recording an ad impression failed", error);
  }
}
