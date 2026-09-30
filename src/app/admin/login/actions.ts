"use server";

import type { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/ui/form-message";
import { safeAdminRedirect } from "@/config/admin";
import { isStaffRole } from "@/lib/auth/roles";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export interface SignInState extends FormState {
  email?: string;
}

const signInSchema = z.object({
  email: z.email({ error: () => t("admin.validation.email") }),
  password: z.string().min(1, { error: () => t("admin.validation.password") }),
  next: z.string().optional(),
});

// One message for unknown email, wrong password and unconfirmed email, so the form never
// reveals which accounts exist.
function signInErrorMessage(error: AuthError): string {
  if (error.status === 429 || error.code === "over_request_rate_limit") {
    return t("admin.login.tooManyAttempts");
  }
  if (error.status && error.status >= 500) {
    return t("admin.login.failed");
  }
  return t("admin.login.invalidCredentials");
}

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message, email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return { error: signInErrorMessage(error), email };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!isStaffRole(profile?.role)) {
    await supabase.auth.signOut();
    return { error: t("admin.login.noAccess"), email };
  }

  redirect(safeAdminRedirect(parsed.data.next));
}
