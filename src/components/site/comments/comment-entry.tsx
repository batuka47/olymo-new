"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { CharacterCount } from "@/components/ui/character-count";
import { TextAreaField } from "@/components/ui/textarea-field";
import { loginHref } from "@/lib/auth/reader";
import { deleteComment, editComment, reportComment } from "@/lib/comments/actions";
import {
  COMMENT_MAX,
  commentBodySchema,
  timeAgo,
  withinEditWindow,
  type CommentItem,
} from "@/lib/comments/shared";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";

const actionClasses =
  "inline-flex min-h-11 cursor-pointer items-center font-mono text-[11px] tracking-label text-muted uppercase hover:text-ink disabled:cursor-default disabled:hover:text-muted";

interface CommentEntryProps {
  item: CommentItem;
  now: number;
  signedIn: boolean;
  /** The article address, to come back to after signing in. */
  returnTo: string;
  /** Top-level comments on an open article can be answered. */
  onReply?: () => void;
  onChange: (changes: Partial<CommentItem>) => void;
  /** tombstone: kept as "Устгагдсан сэтгэгдэл" because others replied. */
  onRemove: (tombstone: boolean) => void;
  /** Replies and the reply form, under this comment. */
  children?: ReactNode;
}

/** One comment: initial, name, time, text, and what this reader may do with it. */
export function CommentEntry({
  item,
  now,
  signedIn,
  returnTo,
  onReply,
  onChange,
  onRemove,
  children,
}: CommentEntryProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.body);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const changeable = item.isOwn && withinEditWindow(item.createdAt, now);

  function run(action: () => Promise<string | undefined>) {
    setError(undefined);
    startTransition(async () => setError(await action()));
  }

  function save() {
    const checked = commentBodySchema.safeParse(draft);
    if (!checked.success) {
      setError(checked.error.issues[0]?.message);
      return;
    }
    run(async () => {
      const result = await editComment({ id: item.id, body: draft });
      if (!result.ok) return result.error;
      onChange(result.value);
      setEditing(false);
    });
  }

  function remove() {
    run(async () => {
      const result = await deleteComment(item.id);
      if (!result.ok) {
        setConfirmingDelete(false);
        return result.error;
      }
      onRemove(result.value.tombstone);
    });
  }

  function report() {
    run(async () => {
      const result = await reportComment(item.id);
      if (!result.ok) return result.error;
      onChange({ reported: true });
    });
  }

  const signInAction = (label: string) => (
    <Link href={loginHref(returnTo)} className={actionClasses}>
      {label}
    </Link>
  );

  // What is left of a deleted comment that others answered: a placeholder, no actions.
  if (item.deleted) {
    return (
      <li className="border-t border-line">
        <article className="flex items-center gap-3.5 py-4">
          <span aria-hidden="true" className="size-10 shrink-0 stripe-pattern" />
          <p className="text-[15px] text-muted italic">{t("comments.deletedLabel")}</p>
        </article>
        {children}
      </li>
    );
  }

  return (
    <li className="border-t border-line">
      <article className="flex gap-3.5 py-4">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center bg-ink font-display text-sm font-bold text-paper uppercase"
        >
          {item.authorName.charAt(0)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="text-[15px] font-semibold">{item.authorName}</span>
            <span className="font-mono text-[11px] text-muted">
              <time dateTime={item.createdAt}>{timeAgo(item.createdAt, now)}</time>
              {item.editedAt && ` · ${t("comments.edited")}`}
            </span>
          </p>
          {item.hidden && (
            <p className="border-l-2 border-danger pl-2 text-xs text-danger">
              {t("comments.hiddenNote")}
            </p>
          )}
          {editing ? (
            <div className="flex flex-col gap-3">
              <TextAreaField
                label={t("comments.editLabel")}
                name={`edit-${item.id}`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                maxLength={COMMENT_MAX}
                autoFocus
                hint={<CharacterCount value={draft} limit={COMMENT_MAX} />}
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={save} disabled={pending}>
                  {t("comments.save")}
                </Button>
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    setEditing(false);
                    setDraft(item.body);
                  }}
                >
                  {t("comments.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-base leading-[1.55] break-words whitespace-pre-wrap text-ink">
              {item.body}
            </p>
          )}
          {!editing && (
            <div className="flex flex-wrap gap-x-4">
              {onReply &&
                (signedIn ? (
                  <button type="button" onClick={onReply} className={actionClasses}>
                    {t("comments.reply")}
                  </button>
                ) : (
                  signInAction(t("comments.reply"))
                ))}
              {changeable && (
                <>
                  <button type="button" onClick={() => setEditing(true)} className={actionClasses}>
                    {t("comments.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className={actionClasses}
                  >
                    {t("comments.delete")}
                  </button>
                </>
              )}
              {!item.isOwn &&
                (signedIn ? (
                  <button
                    type="button"
                    onClick={report}
                    disabled={item.reported || pending}
                    className={cx(actionClasses, item.reported && "text-ink")}
                  >
                    {item.reported ? t("comments.reported") : t("comments.report")}
                  </button>
                ) : (
                  signInAction(t("comments.report"))
                ))}
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </article>
      {children}
      <ConfirmDialog
        open={confirmingDelete}
        title={t("comments.deleteTitle")}
        message={t("comments.deleteMessage")}
        confirmLabel={t("comments.deleteConfirm")}
        pendingLabel={t("comments.deleting")}
        pending={pending}
        danger
        onConfirm={remove}
        onCancel={() => setConfirmingDelete(false)}
      />
    </li>
  );
}
