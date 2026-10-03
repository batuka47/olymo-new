"use client";

import { useActionState } from "react";
import { Turnstile } from "@/components/turnstile";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { signIn, type SignInState } from "./actions";

interface LoginFormProps {
  next?: string;
  initialError?: string;
  labels: {
    email: string;
    password: string;
    submit: string;
    submitting: string;
  };
}

export function LoginForm({ next, initialError, labels }: LoginFormProps) {
  const [state, formAction] = useActionState<SignInState, FormData>(signIn, {
    error: initialError,
  });

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <TextField
        label={labels.email}
        name="email"
        type="email"
        autoComplete="username"
        inputMode="email"
        defaultValue={state.email}
        required
      />
      <TextField
        label={labels.password}
        name="password"
        type="password"
        autoComplete="current-password"
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
