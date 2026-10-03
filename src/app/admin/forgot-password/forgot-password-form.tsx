"use client";

import { useActionState } from "react";
import { Turnstile } from "@/components/turnstile";
import { FormMessage, type FormState } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { requestPasswordReset } from "./actions";

interface ForgotPasswordFormProps {
  labels: { email: string; submit: string; submitting: string };
}

export function ForgotPasswordForm({ labels }: ForgotPasswordFormProps) {
  const [state, formAction] = useActionState<FormState, FormData>(requestPasswordReset, {});

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <TextField
        label={labels.email}
        name="email"
        type="email"
        autoComplete="username"
        inputMode="email"
        required
      />
      <Turnstile resetKey={state} />
      <FormMessage state={state} />
      <SubmitButton size="lg" pendingLabel={labels.submitting} className="w-full">
        {labels.submit}
      </SubmitButton>
    </form>
  );
}
