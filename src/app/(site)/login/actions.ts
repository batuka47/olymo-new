"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/ui/form-message";
import { routes } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { safeReturnPath } from "@/lib/auth/reader";
import { t } from "@/lib/i18n";
import { checkAuthAttempt } from "@/lib/spam/auth-guard";
import { createClient } from "@/lib/supabase/server";

/**
 * /auth/callback?next=<path>: the page to come back to travels in the link itself, so an emailed
 * link opened in another browser or in a mail app still lands on the article.
 */
function callbackUrl(next: FormDataEntryValue | null): string {
  return `${siteConfig.url}${routes.authCallback}?next=${encodeURIComponent(safeReturnPath(next))}`;
}

/** "Google-ээр нэвтрэх": off to Google, back through /auth/callback with a PKCE code. */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(formData.get("next")), skipBrowserRedirect: true },
  });
  if (error || !data.url) {
    console.error("Google sign-in could not start:", error);
    redirect(`${routes.login}?error=google`);
  }
  redirect(data.url);
}

const emailSchema = z.email({ error: () => t("signIn.errors.email") });

/**
 * "Имэйлээр": emails a one-time sign-in link (templates magic-link.html and confirmation.html),
 * creating the reader account on first use. Turnstile and a per-address limit keep it from being
 * used to flood inboxes.
 */
export async function sendSignInLink(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }
  const blocked = await checkAuthAttempt("magic_link", formData);
  if (blocked) {
    return { error: blocked };
  }

  // The email templates link to {{ .RedirectTo }}&token_hash=…, so this URL carries ?next=.
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: callbackUrl(formData.get("next")), shouldCreateUser: true },
  });
  if (error) {
    console.error("Sign-in link failed:", error.code ?? error.message);
    const limited = error.status === 429 || error.code === "over_email_send_rate_limit";
    return { error: t(limited ? "signIn.errors.tooMany" : "signIn.errors.failed") };
  }
  return { success: t("signIn.linkSent") };
}
