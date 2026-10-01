"use client";

import { useActionState } from "react";
import { FormMessage, type FormState } from "@/components/ui/form-message";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { inviteStaff } from "./actions";

interface InviteFormProps {
  roleOptions: { value: string; label: string }[];
  labels: { email: string; role: string; submit: string; submitting: string };
}

export function InviteForm({ roleOptions, labels }: InviteFormProps) {
  const [state, formAction] = useActionState<FormState, FormData>(inviteStaff, {});

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <TextField
          label={labels.email}
          name="email"
          type="email"
          autoComplete="off"
          required
          className="flex-1"
        />
        <SelectField
          label={labels.role}
          name="role"
          options={roleOptions}
          defaultValue="editor"
          className="sm:w-44"
        />
        <SubmitButton size="field" pendingLabel={labels.submitting}>
          {labels.submit}
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
