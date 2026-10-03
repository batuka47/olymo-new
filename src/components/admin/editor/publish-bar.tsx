"use client";

import { useState } from "react";
import { ArticleStateBadge } from "@/components/admin/article-state-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EditorBar } from "@/components/admin/editor/editor-bar";
import { SaveStatus, type LastSave, type SavingKind } from "@/components/admin/editor/save-status";
import { Button, buttonClasses } from "@/components/ui/button";
import type { ArticleState } from "@/lib/articles/status";
import { t } from "@/lib/i18n";
import type { PublishMode } from "@/lib/publishing";

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
      <EditorBar
        title={title}
        status={
          <>
            <ArticleStateBadge state={state} />
            <SaveStatus saving={saving} lastSaved={lastSaved} dirty={dirty} />
          </>
        }
        actions={
          <>
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
              <Button
                variant="outline"
                onClick={() => setConfirmingUnpublish(true)}
                disabled={busy}
              >
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
          </>
        }
      />

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
