"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GoogleSignInButton } from "@/components/site/sign-in-panel";
import { Button, buttonClasses } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { loginHref } from "@/lib/auth/reader";
import { useReader } from "@/lib/auth/use-reader";
import { COMMENTS_PAGE_SIZE, type CommentItem } from "@/lib/comments/shared";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { CommentEntry } from "./comment-entry";
import { CommentForm } from "./comment-form";

interface Page {
  items: CommentItem[];
  hasMore: boolean;
}

/** 20 top-level comments older than `after` (the last one shown), with their replies. */
async function fetchPage(articleId: string, after: CommentItem | null): Promise<Page> {
  const { data, error } = await createClient().rpc("article_comments", {
    target_article: articleId,
    before_created_at: after?.createdAt,
    before_id: after?.id,
    page_size: COMMENTS_PAGE_SIZE,
  });
  if (error) {
    throw error;
  }
  const items = data.map((row) => ({
    id: row.id,
    parentId: row.parent_id,
    authorName: row.author_name,
    body: row.body,
    hidden: row.hidden,
    deleted: row.deleted,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    isOwn: row.is_own,
    reported: row.reported,
  }));
  const topLevel = items.filter((item) => item.parentId === null).length;
  return { items, hasMore: topLevel === COMMENTS_PAGE_SIZE };
}

async function fetchCount(articleId: string): Promise<number> {
  const { data, error } = await createClient().rpc("article_comment_count", {
    target_article: articleId,
  });
  if (error) {
    throw error;
  }
  return data;
}

function SignInPrompt({ returnTo }: { returnTo: string }) {
  return (
    <div className="flex flex-col gap-4 border border-ink bg-white p-4 sm:flex-row sm:items-center sm:justify-between lg:px-5">
      <p className="text-[15px] text-graphite">{t("comments.signInPrompt")}</p>
      <div className="flex flex-wrap gap-2">
        <GoogleSignInButton returnTo={returnTo} />
        <Link href={loginHref(returnTo)} className={buttonClasses({ variant: "outline" })}>
          {t("comments.signInEmail")}
        </Link>
      </div>
    </div>
  );
}

export interface CommentsProps {
  articleId: string;
  /** "Сэтгэгдэл хаах" in the article editor: the list stays, new comments are refused. */
  closed: boolean;
  /** The article address with #comments, where signing in comes back to. */
  returnTo: string;
}

/**
 * "Сэтгэгдэл (n)", loaded in the browser so the article HTML stays cacheable. LazyComments mounts
 * it when the section nears the screen.
 */
export function Comments({ articleId, closed, returnTo }: CommentsProps) {
  const readerState = useReader();
  const signedIn = readerState.status === "signed-in";
  const readerId = signedIn ? readerState.reader.id : null;
  const [items, setItems] = useState<CommentItem[] | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // "5 минутын өмнө" and the 15 minutes to edit move on while the page stays open.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // The first page, and again after signing in or out: a reader also sees their own unpublished
  // comments and what they reported.
  const ready = readerState.status !== "loading";
  useEffect(() => {
    if (!ready) return;
    let active = true;
    Promise.all([fetchPage(articleId, null), fetchCount(articleId)])
      .then(([page, total]) => {
        if (!active) return;
        setItems(page.items);
        setHasMore(page.hasMore);
        setCount(total);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [ready, readerId, articleId]);

  async function loadMore() {
    const lastTopLevel = items?.findLast((item) => item.parentId === null) ?? null;
    setLoadingMore(true);
    try {
      const page = await fetchPage(articleId, lastTopLevel);
      setItems((current) => [...(current ?? []), ...page.items]);
      setHasMore(page.hasMore);
    } catch {
      setFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }

  function added(item: CommentItem) {
    setItems((current) =>
      item.parentId ? [...(current ?? []), item] : [item, ...(current ?? [])],
    );
    if (!item.hidden) setCount((current) => (current ?? 0) + 1);
    setReplyTo(null);
  }

  function changed(id: string, changes: Partial<CommentItem>) {
    setItems(
      (current) =>
        current?.map((item) => (item.id === id ? { ...item, ...changes } : item)) ?? null,
    );
  }

  /**
   * A tombstone stays in place with its replies. A comment really deleted goes, and so does a
   * tombstone left without replies (the database removes it too).
   */
  function removed(id: string, tombstone: boolean) {
    const item = items?.find((candidate) => candidate.id === id);
    if (tombstone) {
      changed(id, { deleted: true, body: "", authorName: "", isOwn: false, hidden: false });
    } else {
      setItems((current) => {
        const left = current?.filter((candidate) => candidate.id !== id) ?? [];
        return left.filter(
          (candidate) =>
            !candidate.deleted || left.some((reply) => reply.parentId === candidate.id),
        );
      });
    }
    if (item && !item.hidden) {
      setCount((current) => Math.max(0, (current ?? 0) - 1));
    }
  }

  const topLevel = items?.filter((item) => item.parentId === null) ?? [];
  const repliesTo = (id: string) => items?.filter((item) => item.parentId === id) ?? [];
  const canWrite = signedIn && !closed && !readerState.reader.banned;

  const entryProps = (item: CommentItem) => ({
    item,
    now,
    signedIn,
    returnTo,
    onChange: (changes: Partial<CommentItem>) => changed(item.id, changes),
    onRemove: (tombstone: boolean) => removed(item.id, tombstone),
  });

  return (
    <div className="flex flex-col gap-5">
      <h2 id="comments-title" className="font-display text-[22px] font-bold lg:text-2xl">
        {t("comments.title")}{" "}
        {count !== null && (
          <span className="font-mono text-sm font-normal text-muted">({count})</span>
        )}
      </h2>

      {closed ? (
        <p className="border border-line p-4 text-[15px] text-graphite">{t("comments.closed")}</p>
      ) : readerState.status === "signed-out" ? (
        <SignInPrompt returnTo={returnTo} />
      ) : signedIn && readerState.reader.banned ? (
        <p className="border-l-2 border-danger pl-3 text-sm text-danger">
          {t("comments.errors.banned")}
        </p>
      ) : canWrite ? (
        <CommentForm articleId={articleId} parentId={null} onPosted={added} />
      ) : null}

      {failed && (
        <p role="alert" className="text-sm text-danger">
          {t("comments.errors.load")}
        </p>
      )}
      {items === null && !failed && (
        <p role="status" className="flex items-center gap-2 text-sm text-muted">
          <Spinner /> {t("comments.loading")}
        </p>
      )}
      {items !== null && topLevel.length === 0 && (
        <p className="text-[15px] text-muted">{t("comments.empty")}</p>
      )}

      {topLevel.length > 0 && (
        <ol aria-label={t("comments.title")}>
          {topLevel.map((item) => (
            <CommentEntry
              key={item.id}
              {...entryProps(item)}
              onReply={closed || item.deleted ? undefined : () => setReplyTo(item.id)}
            >
              {(repliesTo(item.id).length > 0 || replyTo === item.id) && (
                <div className="ml-6 border-l border-line pl-4 sm:ml-14">
                  {repliesTo(item.id).length > 0 && (
                    <ol aria-label={t("comments.replies")}>
                      {repliesTo(item.id).map((reply) => (
                        <CommentEntry key={reply.id} {...entryProps(reply)} />
                      ))}
                    </ol>
                  )}
                  {replyTo === item.id && canWrite && (
                    <div className="py-4">
                      <CommentForm
                        articleId={articleId}
                        parentId={item.id}
                        onPosted={added}
                        onCancel={() => setReplyTo(null)}
                      />
                    </div>
                  )}
                </div>
              )}
            </CommentEntry>
          ))}
        </ol>
      )}

      {hasMore && (
        <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="self-start">
          {loadingMore && <Spinner />}
          {t("comments.more")}
        </Button>
      )}
    </div>
  );
}
