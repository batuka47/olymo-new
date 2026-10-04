"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { CharacterCount } from "@/components/ui/character-count";
import { Spinner } from "@/components/ui/spinner";
import { TextAreaField } from "@/components/ui/textarea-field";
import { addComment } from "@/lib/comments/actions";
import { COMMENT_MAX, commentBodySchema, type CommentItem } from "@/lib/comments/shared";
import { t } from "@/lib/i18n";

interface CommentFormProps {
  articleId: string;
  /** A reply to this top-level comment; null for a new comment. */
  parentId: string | null;
  onPosted: (item: CommentItem) => void;
  onCancel?: () => void;
}

/** A new comment or a reply: up to 1000 characters, checked here and again on the server. */
export function CommentForm({ articleId, parentId, onPosted, onCancel }: CommentFormProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const isReply = parentId !== null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checked = commentBodySchema.safeParse(body);
    if (!checked.success) {
      setError(checked.error.issues[0]?.message);
      return;
    }
    startTransition(async () => {
      const result = await addComment({ articleId, body, parentId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBody("");
      setError(undefined);
      onPosted(result.value);
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <TextAreaField
        label={isReply ? t("comments.replyLabel") : t("comments.label")}
        name={isReply ? `reply-${parentId}` : "comment"}
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          setError(undefined);
        }}
        rows={isReply ? 3 : 4}
        maxLength={COMMENT_MAX}
        autoFocus={isReply}
        error={error}
        hint={<CharacterCount value={body} limit={COMMENT_MAX} />}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          {pending ? t("comments.sending") : isReply ? t("comments.sendReply") : t("comments.send")}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            {t("comments.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
