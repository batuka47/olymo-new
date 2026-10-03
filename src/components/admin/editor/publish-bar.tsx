"use client";

import { useState } from "react";
import { ArticleStateBadge } from "@/components/admin/article-state-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button, buttonClasses } from "@/components/ui/button";
import type { ArticleState } from "@/lib/articles/status";
import { cx } from "@/lib/cx";
import { formatDateTime } from "@/lib/dates";
import { t } from "@/lib/i18n";
import type { PublishMode } from "@/lib/publishing";

export type SavingKind = "manual" | "auto" | null;

export interface LastSave {
  at: string;
  auto: boolean;
}

interface PublishBarProps {
  title: string;
  state: ArticleState;
  saving: SavingKind;
  lastSaved: LastSave | null;
  dirty: boolean;
  /** Published or scheduled: the draft button becomes "Ноорог болгох" and asks first. */
  isLive: boolean;
  publishMode: PublishMode;
  /** Public address, linked while the saved version is live and unchanged. */
  viewHref: string | null;
  /** Shown inside the unpublish dialog. */
  error?: string;
  unpublishDialog: { title: string; message: string };
  onPreview: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  /** Saves as a draft; resolves true when it worked, which closes the dialog. */
  onUnpublish: () => Promise<boolean>;
}

function SaveStatus({
  saving,
  lastSaved,
  dirty,
}: Pick<PublishBarProps, "saving" | "lastSaved" | "dirty">) {
  let text = "";
  if (saving) {
    text = t("admin.publish.saving");
  } else if (dirty) {
    text = t("admin.publish.unsaved");
  } else if (lastSaved) {
    const label = lastSaved.auto ? t("admin.publish.autosaved") : t("admin.publish.saved");
    text = `${label} · ${formatDateTime(lastSaved.at)}`;
  }

  return (
    <span
      role="status"
      className={cx("font-mono text-[11px]", dirty && !saving ? "text-danger" : "text-muted")}
    >
      {text}
    </span>
  );
}

function publishLabel(isLive: boolean, mode: PublishMode): string {
  if (isLive) {
    return t("admin.publish.update");
  }
  return mode === "schedule" ? t("admin.publish.scheduleButton") : t("admin.publish.publish");
}

/** The sticky bar on top of an editor: state, save status and the publish actions. */
export function PublishBar({
  title,
  state,
  saving,
  lastSaved,
  dirty,
  isLive,
  publishMode,
  viewHref,
  error,
  unpublishDialog,
  onPreview,
  onSaveDraft,
  onPublish,
  onUnpublish,
}: PublishBarProps) {
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false);
  const busy = saving !== null;

  async function unpublish() {
    if (await onUnpublish()) {
      setConfirmingUnpublish(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 lg:-mx-8 lg:px-8">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1 className="font-display text-xl font-bold">{title}</h1>
          <ArticleStateBadge state={state} />
          <SaveStatus saving={saving} lastSaved={lastSaved} dirty={dirty} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onPreview} disabled={busy}>
            {t("admin.publish.preview")}
          </Button>
          {state === "published" && !dirty && viewHref && (
            <a
              href={viewHref}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses({ variant: "outline" })}
            >
              {t("admin.publish.view")}
            </a>
          )}
          {isLive ? (
            <Button variant="outline" onClick={() => setConfirmingUnpublish(true)} disabled={busy}>
              {t("admin.publish.unpublish")}
            </Button>
          ) : (
            <Button variant="outline" onClick={onSaveDraft} disabled={busy}>
              {t("admin.publish.saveDraft")}
            </Button>
          )}
          <Button onClick={onPublish} disabled={busy}>
            {publishLabel(isLive, publishMode)}
          </Button>
        </div>
      </header>

      <ConfirmDialog
        open={confirmingUnpublish}
        title={unpublishDialog.title}
        message={unpublishDialog.message}
        confirmLabel={t("admin.unpublish.confirm")}
        pendingLabel={t("admin.unpublish.pending")}
        pending={busy}
        error={confirmingUnpublish ? error : undefined}
        danger
        onConfirm={unpublish}
        onCancel={() => setConfirmingUnpublish(false)}
      />
    </>
  );
}
