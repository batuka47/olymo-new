"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import {
  deleteCommentAsStaff,
  setCommentVisible,
  setReaderBanned,
  type ModerationResult,
} from "./actions";

interface CommentActionsProps {
  commentId: string;
  visible: boolean;
  author: { id: string; name: string; banned: boolean; isReader: boolean };
}

type Confirming = "delete" | "ban" | null;

/** Hide or show, delete, and ban the author (readers only); delete and ban ask first. */
export function CommentActions({ commentId, visible, author }: CommentActionsProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<Confirming>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ModerationResult>) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setConfirming(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => run(() => setCommentVisible(commentId, !visible))}
      >
        {visible ? t("admin.comments.hide") : t("admin.comments.show")}
      </Button>
      <Button variant="outline" disabled={pending} onClick={() => setConfirming("delete")}>
        {t("admin.comments.delete")}
      </Button>
      {author.isReader &&
        (author.banned ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => run(() => setReaderBanned(author.id, false))}
          >
            {t("admin.comments.unban")}
          </Button>
        ) : (
          <Button variant="outline" disabled={pending} onClick={() => setConfirming("ban")}>
            {t("admin.comments.ban")}
          </Button>
        ))}
      {error && !confirming && (
        <p role="alert" className="basis-full text-sm text-danger">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirming === "delete"}
        title={t("admin.comments.deleteTitle")}
        message={t("admin.comments.deleteMessage")}
        confirmLabel={t("admin.comments.deleteConfirm")}
        pending={pending}
        error={confirming === "delete" ? error : undefined}
        danger
        onConfirm={() => run(() => deleteCommentAsStaff(commentId))}
        onCancel={() => setConfirming(null)}
      />
      <ConfirmDialog
        open={confirming === "ban"}
        title={t("admin.comments.banTitle", { name: author.name })}
        message={t("admin.comments.banMessage")}
        confirmLabel={t("admin.comments.banConfirm")}
        pending={pending}
        error={confirming === "ban" ? error : undefined}
        danger
        onConfirm={() => run(() => setReaderBanned(author.id, true))}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
