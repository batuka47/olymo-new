"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminRoutes } from "@/config/admin";
import { adDatesToInstants, type AdFormValues } from "@/lib/ads/form";
import { ADS_CACHE_TAG } from "@/lib/ads/queries";
import { adInputSchema } from "@/lib/ads/schema";
import { requireStaff } from "@/lib/auth/staff";
import { t } from "@/lib/i18n";
import { adFolder } from "@/lib/media";
import { removeFolder } from "@/lib/media-cleanup";
import { createClient } from "@/lib/supabase/server";

export interface AdActionResult {
  ok: boolean;
  error?: string;
}

/** Ads show on most public pages: expire the cached ads and every cached page. */
function refreshAdPages() {
  updateTag(ADS_CACHE_TAG);
  revalidatePath("/", "layout");
}

/** Creates or updates the ad, then returns to the list. */
export async function saveAd(id: string, values: AdFormValues): Promise<AdActionResult> {
  await requireStaff();
  const parsed = adInputSchema.safeParse({ ...values, id });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? t("admin.ads.errors.saveFailed"),
    };
  }

  const ad = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("ads").upsert({
    id: ad.id,
    title: ad.title,
    link_url: ad.linkUrl,
    placement: ad.placement,
    image_path: ad.imagePath,
    image_path_mobile: ad.imagePathMobile,
    is_active: ad.isActive,
    ...adDatesToInstants(ad.startDate, ad.endDate),
  });
  if (error) {
    console.error("Saving an ad failed", error);
    return { ok: false, error: t("admin.ads.errors.saveFailed") };
  }

  refreshAdPages();
  redirect(adminRoutes.ads);
}

export async function setAdActive(id: string, active: boolean): Promise<AdActionResult> {
  await requireStaff();
  if (!z.uuid().safeParse(id).success) {
    return { ok: false, error: t("admin.ads.errors.notFound") };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("ads").update({ is_active: active }).eq("id", id);
  if (error) {
    return { ok: false, error: t("admin.ads.errors.saveFailed") };
  }
  refreshAdPages();
  return { ok: true };
}

export async function deleteAd(id: string): Promise<AdActionResult> {
  await requireStaff();
  if (!z.uuid().safeParse(id).success) {
    return { ok: false, error: t("admin.ads.errors.notFound") };
  }
  const supabase = await createClient();
  const { data: deleted, error } = await supabase
    .from("ads")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !deleted) {
    return { ok: false, error: t("admin.ads.errors.deleteFailed") };
  }

  // The row is gone either way; leftover files would only waste space, so log and go on.
  try {
    await removeFolder(supabase, adFolder(id));
  } catch (storageError) {
    console.error(`Could not remove images of deleted ad ${id}:`, storageError);
  }
  refreshAdPages();
  return { ok: true };
}
