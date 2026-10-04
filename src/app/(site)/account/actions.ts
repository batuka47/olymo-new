"use server";

import { z } from "zod";
import type { FormState } from "@/components/ui/form-message";
import { DISPLAY_NAME_MAX } from "@/lib/auth/reader";
import { getSignedInUserId } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const displayNameSchema = z
  .string()
  .trim()
  .min(2, { error: () => t("account.errors.nameShort") })
  .max(DISPLAY_NAME_MAX, { error: () => t("account.errors.nameLong") });

/** Readers change the name they got at sign-up once; the database enforces it too. */
export async function updateDisplayName(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = displayNameSchema.safeParse(formData.get("displayName") ?? "");
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    return { error: t("account.errors.signedOut") };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("name_changed_at")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) {
    return { error: t("account.errors.failed") };
  }
  if (profile.name_changed_at) {
    return { error: t("account.errors.nameLocked") };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data })
    .eq("id", userId);
  if (error) {
    const locked = error.message.includes("display_name_locked");
    return { error: t(locked ? "account.errors.nameLocked" : "account.errors.failed") };
  }
  // No refresh: the form shows that it worked; the next visit shows the name as locked.
  return { success: t("account.nameSaved") };
}

/**
 * "Delete my account and comments": removes the auth user, which takes the profile, the reports
 * and the comments with it, except comments others answered: the database keeps those as
 * tombstones so the replies stay (profiles_keep_answered_comments). Readers only: a staff account
 * is never removed from the site side by its owner. The browser then signs out and leaves.
 */
export async function deleteAccount(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    return { ok: false, error: t("account.errors.signedOut") };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role !== "reader") {
    return { ok: false, error: t("account.errors.staffAccount") };
  }

  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) {
    console.error(`Deleting reader account ${userId} failed:`, error);
    return { ok: false, error: t("account.errors.failed") };
  }
  return { ok: true };
}
