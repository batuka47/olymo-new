"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminRoutes } from "@/config/admin";
import { NOTE_MAX, submissionStatuses } from "@/config/submissions";
import { requireAdmin } from "@/lib/auth/staff";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  id: z.uuid(),
  status: z.enum(submissionStatuses),
  adminNote: z
    .string()
    .trim()
    .max(NOTE_MAX, { error: () => t("submissions.errors.tooLong") })
    .transform((value) => value || null),
});

export type UpdateSubmissionResult = { ok: true } | { ok: false; error: string };

/** Status and internal note from the inbox drawer. */
export async function updateSubmission(
  input: z.input<typeof updateSchema>,
): Promise<UpdateSubmissionResult> {
  await requireAdmin();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? t("admin.inbox.errors.saveFailed"),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .update({ status: parsed.data.status, admin_note: parsed.data.adminNote })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return { ok: false, error: t("admin.inbox.errors.saveFailed") };
  }

  // The list, the nav badge and the dashboard count all change with the status.
  revalidatePath(adminRoutes.dashboard, "layout");
  return { ok: true };
}
