"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminRoutes } from "@/config/admin";
import { requireStaff } from "@/lib/auth/staff";
import { t, type MessageKey } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ModerationResult = { ok: true } | { ok: false; error: string };

function failure(key: MessageKey): ModerationResult {
  return { ok: false, error: t(key) };
}

const isId = (value: unknown) => z.uuid().safeParse(value).success;

/** Hide or show. Showing also clears the word filter's hold. Staff session, so RLS applies. */
export async function setCommentVisible(id: string, visible: boolean): Promise<ModerationResult> {
  await requireStaff();
  if (!isId(id)) {
    return failure("admin.comments.errors.notFound");
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .update({ status: visible ? "visible" : "hidden", held: false })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return failure("admin.comments.errors.failed");
  }
  revalidatePath(adminRoutes.comments);
  return { ok: true };
}

export async function deleteCommentAsStaff(id: string): Promise<ModerationResult> {
  await requireStaff();
  if (!isId(id)) {
    return failure("admin.comments.errors.notFound");
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("comments").delete().eq("id", id).select("id");
  if (error || data.length === 0) {
    return failure("admin.comments.errors.failed");
  }
  revalidatePath(adminRoutes.comments);
  return { ok: true };
}

/**
 * Stops (or lets again) a reader from commenting; their comments stay as they are. Editors may not
 * change other people's profiles under RLS, so this runs as the service role once the staff check
 * has passed, and only ever touches reader accounts.
 */
export async function setReaderBanned(userId: string, banned: boolean): Promise<ModerationResult> {
  await requireStaff();
  if (!isId(userId)) {
    return failure("admin.comments.errors.notFound");
  }
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) {
    return failure("admin.comments.errors.notFound");
  }
  if (profile.role !== "reader") {
    return failure("admin.comments.errors.staffBan");
  }
  const { error } = await admin.from("profiles").update({ banned }).eq("id", userId);
  if (error) {
    return failure("admin.comments.errors.failed");
  }
  revalidatePath(adminRoutes.comments);
  return { ok: true };
}
