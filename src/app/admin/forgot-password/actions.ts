"use server";

import { z } from "zod";
import type { FormState } from "@/components/ui/form-message";
import { t } from "@/lib/i18n";
import { checkAuthAttempt } from "@/lib/spam/auth-guard";
import { createPublicClient } from "@/lib/supabase/server";

const emailSchema = z.email({ error: () => t("admin.validation.email") });

/**
 * Sends a password reset email (template: supabase/templates/recovery.html). The answer is the
 * same whether or not the account exists, and whether or not sending worked, so the form cannot
 * be used to find out which emails are registered.
 */
export async function requestPasswordReset(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }
  const blocked = await checkAuthAttempt("forgot_password", formData);
  if (blocked) {
    return { error: blocked };
  }

  const supabase = createPublicClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data);
  if (error) {
    console.error("Password reset email failed:", error.code ?? error.message);
  }

  return { success: t("admin.forgotPassword.sent") };
}
