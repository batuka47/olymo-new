"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button, buttonClasses } from "@/components/ui/button";
import { adminRoutes } from "@/config/admin";
import { t } from "@/lib/i18n";
import { deleteAd } from "./actions";

export function AdRowActions({ id, title }: { id: string; title: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [deleting, startDelete] = useTransition();

  function confirmDelete() {
    startDelete(async () => {
      const result = await deleteAd(id);
      if (result.ok) {
        setConfirming(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`${adminRoutes.ads}/${id}`} className={buttonClasses({ variant: "ink" })}>
        {t("admin.ads.actions.edit")}
      </Link>
      <Button variant="outline" onClick={() => setConfirming(true)}>
        {t("admin.ads.actions.delete")}
      </Button>
      <ConfirmDialog
        open={confirming}
        title={t("admin.ads.delete.title")}
        message={`«${title}». ${t("admin.ads.delete.message")}`}
        confirmLabel={t("admin.ads.delete.confirm")}
        pendingLabel={t("admin.ads.delete.pending")}
        pending={deleting}
        error={confirming ? error : undefined}
        danger
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirming(false);
          setError(undefined);
        }}
      />
    </div>
  );
}
