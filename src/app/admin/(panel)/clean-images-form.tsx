"use client";

import { useActionState } from "react";
import { FormMessage, type FormState } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/lib/i18n";
import { cleanUnusedImages } from "./actions";

export function CleanImagesForm() {
  const [state, formAction] = useActionState<FormState, FormData>(cleanUnusedImages, {});

  return (
    <form action={formAction} className="flex flex-col items-start gap-3">
      <SubmitButton variant="outline" pendingLabel={t("admin.cleanup.working")}>
        {t("admin.cleanup.button")}
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
