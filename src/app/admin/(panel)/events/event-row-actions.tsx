"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button, buttonClasses } from "@/components/ui/button";
import { adminRoutes } from "@/config/admin";
import { t } from "@/lib/i18n";
import { deleteEvent } from "./actions";

interface EventRowActionsProps {
  id: string;
  title: string;
  publicPath: string | null;
}

export function EventRowActions({ id, title, publicPath }: EventRowActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [deleting, startDelete] = useTransition();

  function confirmDelete() {
    startDelete(async () => {
      const result = await deleteEvent(id);
      if (result.ok) {
        setConfirming(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`${adminRoutes.events}/${id}`} className={buttonClasses({ variant: "ink" })}>
        {t("admin.events.actions.edit")}
      </Link>
      {publicPath && (
        <a
          href={publicPath}
          target="_blank"
          rel="noreferrer"
          className={buttonClasses({ variant: "outline" })}
        >
          {t("admin.events.actions.view")}
        </a>
      )}
      <Button variant="outline" onClick={() => setConfirming(true)}>
        {t("admin.events.actions.delete")}
      </Button>
      <ConfirmDialog
        open={confirming}
        title={t("admin.events.delete.title")}
        message={`«${title}». ${t("admin.events.delete.message")}`}
        confirmLabel={t("admin.events.delete.confirm")}
        pendingLabel={t("admin.events.delete.pending")}
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
