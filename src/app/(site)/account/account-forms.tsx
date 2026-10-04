"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { FormMessage, type FormState } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { routes } from "@/config/navigation";
import { DISPLAY_NAME_MAX } from "@/lib/auth/reader";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { deleteAccount, updateDisplayName } from "./actions";

export function DisplayNameForm({ name }: { name: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(updateDisplayName, {});
  if (state.success) {
    return <FormMessage state={state} />;
  }
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <TextField
        label={t("account.displayName")}
        name="displayName"
        defaultValue={name}
        maxLength={DISPLAY_NAME_MAX}
        autoComplete="nickname"
        required
        hint={t("account.nameOnce")}
      />
      <FormMessage state={state} />
      <SubmitButton pendingLabel={t("account.saving")} className="self-start">
        {t("account.saveName")}
      </SubmitButton>
    </form>
  );
}

/** Signs out in the browser, so the header's account menu goes with it. */
async function leave(router: ReturnType<typeof useRouter>) {
  await createClient().auth.signOut({ scope: "local" });
  router.push(routes.home);
  router.refresh();
}

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => leave(router))}
    >
      {t("account.signOut")}
    </Button>
  );
}

/** Asks first: the account goes for good; comments others answered stay as tombstones. */
export function DeleteAccountButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteAccount();
      if (result.ok) {
        await leave(router);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <Button variant="danger" onClick={() => setConfirming(true)} className="self-start">
        {t("account.delete")}
      </Button>
      <ConfirmDialog
        open={confirming}
        title={t("account.deleteTitle")}
        message={t("account.deleteMessage")}
        confirmLabel={t("account.deleteConfirm")}
        pendingLabel={t("account.deleting")}
        pending={pending}
        error={error}
        danger
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
