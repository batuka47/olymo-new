"use client";

import { useActionState } from "react";
import { sendSignInLink, signInWithGoogle } from "@/app/(site)/login/actions";
import { Turnstile } from "@/components/turnstile";
import { FormMessage, type FormState } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { t } from "@/lib/i18n";

/** "Google-ээр нэвтрэх" as a one-button form: also used in the comments sign-in box. */
export function GoogleSignInButton({
  returnTo,
  className,
}: {
  returnTo: string;
  className?: string;
}) {
  return (
    <form action={signInWithGoogle} className={className}>
      <input type="hidden" name="next" value={returnTo} />
      <SubmitButton variant="ink" pendingLabel={t("signIn.redirecting")} className="w-full">
        {t("signIn.google")}
      </SubmitButton>
    </form>
  );
}

interface SignInPanelProps {
  returnTo: string;
  initialError?: string;
}

/** Google, or a one-time link by email (the account is created on first use). */
export function SignInPanel({ returnTo, initialError }: SignInPanelProps) {
  const [state, formAction] = useActionState<FormState, FormData>(sendSignInLink, {
    error: initialError,
  });

  return (
    <div className="flex flex-col gap-6">
      <GoogleSignInButton returnTo={returnTo} />
      <p className="flex items-center gap-3 font-mono text-[11px] tracking-label text-muted uppercase before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
        {t("signIn.or")}
      </p>
      {state.success ? (
        <p role="status" className="border border-ink bg-white p-5 text-[15px] leading-relaxed">
          {state.success}
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="next" value={returnTo} />
          <TextField
            label={t("signIn.email")}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            hint={t("signIn.emailHint")}
          />
          <Turnstile resetKey={state} />
          <FormMessage state={{ error: state.error }} />
          <SubmitButton variant="outline" pendingLabel={t("signIn.sending")} className="w-full">
            {t("signIn.sendLink")}
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
