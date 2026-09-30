"use client";

import { useActionState } from "react";
import { FormMessage, type FormState } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { setPassword } from "./actions";

interface SetPasswordFormProps {
  labels: { password: string; confirm: string; submit: string; submitting: string };
}

export function SetPasswordForm({ labels }: SetPasswordFormProps) {
  const [state, formAction] = useActionState<FormState, FormData>(setPassword, {});

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-5" noValidate>
      <TextField
        label={labels.password}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <TextField
        label={labels.confirm}
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
      />
      <FormMessage state={state} />
      <SubmitButton pendingLabel={labels.submitting} className="self-start">
        {labels.submit}
      </SubmitButton>
    </form>
  );
}
