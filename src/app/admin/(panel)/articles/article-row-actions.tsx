"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button, buttonClasses } from "@/components/ui/button";
import { adminRoutes } from "@/config/admin";
import { t } from "@/lib/i18n";
import { deleteArticle, duplicateArticle } from "./actions";

interface ArticleRowActionsProps {
  id: string;
  title: string;
  publicPath: string | null;
}

export function ArticleRowActions({ id, title, publicPath }: ArticleRowActionsProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string>();
  const [deleting, startDelete] = useTransition();
  const [duplicating, startDuplicate] = useTransition();

  function duplicate() {
    setError(undefined);
    startDuplicate(async () => {
      const result = await duplicateArticle(id);
      if (!result.ok) setError(result.error);
    });
  }

  function confirmDelete() {
    startDelete(async () => {
      const result = await deleteArticle(id);
      if (result.ok) {
        setConfirmingDelete(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Link href={`${adminRoutes.articles}/${id}`} className={buttonClasses({ variant: "ink" })}>
          {t("admin.articles.actions.edit")}
        </Link>
        {publicPath && (
          <a
            href={publicPath}
            target="_blank"
            rel="noreferrer"
            className={buttonClasses({ variant: "outline" })}
          >
            {t("admin.articles.actions.view")}
          </a>
        )}
        <Button variant="outline" onClick={duplicate} disabled={duplicating}>
          {t("admin.articles.actions.duplicate")}
        </Button>
        <Button variant="outline" onClick={() => setConfirmingDelete(true)}>
          {t("admin.articles.actions.delete")}
        </Button>
      </div>
      {error && !confirmingDelete && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={confirmingDelete}
        title={t("admin.articles.delete.title")}
        message={`«${title}». ${t("admin.articles.delete.message")}`}
        confirmLabel={t("admin.articles.delete.confirm")}
        pendingLabel={t("admin.articles.delete.pending")}
        pending={deleting}
        error={confirmingDelete ? error : undefined}
        danger
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmingDelete(false);
          setError(undefined);
        }}
      />
    </div>
  );
}
