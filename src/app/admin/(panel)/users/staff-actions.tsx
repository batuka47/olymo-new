"use client";

import { useActionState, type FormEvent } from "react";
import { FormMessage, type FormState } from "@/components/ui/form-message";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { changeStaffRole, removeStaff } from "./actions";

interface StaffActionsProps {
  userId: string;
  role: string;
  roleOptions: { value: string; label: string }[];
  labels: {
    role: string;
    save: string;
    saving: string;
    remove: string;
    removeConfirm: string;
  };
}

export function StaffActions({ userId, role, roleOptions, labels }: StaffActionsProps) {
  const [roleState, changeRoleAction] = useActionState<FormState, FormData>(changeStaffRole, {});
  const [removeState, removeAction] = useActionState<FormState, FormData>(removeStaff, {});

  function confirmRemoval(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(labels.removeConfirm)) {
      event.preventDefault();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <form action={changeRoleAction} className="flex items-end gap-2">
          <input type="hidden" name="userId" value={userId} />
          <SelectField
            label={labels.role}
            name="role"
            id={`role-${userId}`}
            options={roleOptions}
            defaultValue={role}
            hideLabel
          />
          <SubmitButton variant="ink" pendingLabel={labels.saving} className="h-12">
            {labels.save}
          </SubmitButton>
        </form>
        <form action={removeAction} onSubmit={confirmRemoval}>
          <input type="hidden" name="userId" value={userId} />
          <SubmitButton variant="outline" pendingLabel={labels.saving} className="h-12">
            {labels.remove}
          </SubmitButton>
        </form>
      </div>
      <FormMessage state={roleState} />
      <FormMessage state={removeState} />
    </div>
  );
}
