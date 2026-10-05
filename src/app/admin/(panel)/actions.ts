"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/ui/form-message";
import { adminRoutes } from "@/config/admin";
import { requireAdmin } from "@/lib/auth/staff";
import { t } from "@/lib/i18n";
import { removeUnusedFolders } from "@/lib/media-cleanup";
import { createClient } from "@/lib/supabase/server";

const UNUSED_IMAGE_MIN_AGE_MS = 24 * 60 * 60 * 1000;

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(adminRoutes.login);
}

/** Admin only. Uses the admin's own session: storage RLS lets staff list and delete media. */
export async function cleanUnusedImages(): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();

  try {
    const { folders, files } = await removeUnusedFolders(supabase, UNUSED_IMAGE_MIN_AGE_MS);
    return {
      success:
        files > 0 ? t("admin.cleanup.removed", { folders, files }) : t("admin.cleanup.nothing"),
    };
  } catch (error) {
    console.error("Unused image cleanup failed", error);
    return { error: t("admin.cleanup.failed") };
  }
}
