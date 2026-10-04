"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";
import { getSignedInUserId } from "@/lib/auth/session";
import { commentBodySchema, withinEditWindow, type CommentItem } from "@/lib/comments/shared";
import { t, type MessageKey } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

// Readers write with their own session, so RLS and the comments triggers apply to every call
// (supabase/migrations/…_comments.sql). The checks here come first to give clear messages.

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type CommentResult<T> = { ok: true; value: T } | { ok: false; error: string };

function failure(key: MessageKey): { ok: false; error: string } {
  return { ok: false, error: t(key) };
}

/** The database's own refusals, raised by check_comment_write. */
const databaseErrors: [string, MessageKey][] = [
  ["comments_rate_limited", "comments.errors.rateLimited"],
  ["comments_banned", "comments.errors.banned"],
  ["comments_closed", "comments.errors.closed"],
];

function databaseFailure(error: PostgrestError): { ok: false; error: string } {
  const known = databaseErrors.find(([text]) => error.message.includes(text));
  return failure(known ? known[1] : "comments.errors.failed");
}

const isId = (value: unknown) => z.uuid().safeParse(value).success;

export async function addComment(input: {
  articleId: string;
  body: string;
  parentId: string | null;
}): Promise<CommentResult<CommentItem>> {
  const supabase = await createClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    return failure("comments.errors.signIn");
  }
  const body = commentBodySchema.safeParse(input.body);
  if (!body.success) {
    return { ok: false, error: body.error.issues[0]?.message ?? t("comments.errors.failed") };
  }
  if (!isId(input.articleId) || (input.parentId !== null && !isId(input.parentId))) {
    return failure("comments.errors.failed");
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      article_id: input.articleId,
      user_id: userId,
      body: body.data,
      parent_id: input.parentId,
    })
    .select("id, parent_id, body, status, created_at, edited_at")
    .single();
  if (error) {
    return databaseFailure(error);
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  return {
    ok: true,
    value: {
      id: data.id,
      parentId: data.parent_id,
      authorName: profile?.display_name || "—",
      body: data.body,
      hidden: data.status !== "visible",
      deleted: false,
      createdAt: data.created_at,
      editedAt: data.edited_at,
      isOwn: true,
      reported: false,
    },
  };
}

/** The signed-in author's own comment, still within the 15 minutes they may change it. */
async function changeableComment(
  supabase: Supabase,
  id: string,
): Promise<CommentResult<{ id: string }>> {
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    return failure("comments.errors.signIn");
  }
  if (!isId(id)) {
    return failure("comments.errors.notFound");
  }
  const { data: comment } = await supabase
    .from("comments")
    .select("user_id, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!comment) {
    return failure("comments.errors.notFound");
  }
  if (comment.user_id !== userId) {
    return failure("comments.errors.notYours");
  }
  if (!withinEditWindow(comment.created_at, Date.now())) {
    return failure("comments.errors.tooLate");
  }
  return { ok: true, value: { id } };
}

export async function editComment(input: {
  id: string;
  body: string;
}): Promise<CommentResult<Pick<CommentItem, "body" | "hidden" | "editedAt">>> {
  const supabase = await createClient();
  const allowed = await changeableComment(supabase, input.id);
  if (!allowed.ok) {
    return allowed;
  }
  const body = commentBodySchema.safeParse(input.body);
  if (!body.success) {
    return { ok: false, error: body.error.issues[0]?.message ?? t("comments.errors.failed") };
  }
  const { data, error } = await supabase
    .from("comments")
    .update({ body: body.data })
    .eq("id", input.id)
    .select("body, status, edited_at")
    .single();
  if (error) {
    return databaseFailure(error);
  }
  return {
    ok: true,
    value: { body: data.body, hidden: data.status !== "visible", editedAt: data.edited_at },
  };
}

/**
 * Deletes the author's comment. One that others answered is kept as a tombstone by the database
 * (keep_answered_comment), so nothing comes back from the delete: tombstone tells the page which.
 */
export async function deleteComment(id: string): Promise<CommentResult<{ tombstone: boolean }>> {
  const supabase = await createClient();
  const allowed = await changeableComment(supabase, id);
  if (!allowed.ok) {
    return allowed;
  }
  const { data, error } = await supabase.from("comments").delete().eq("id", id).select("id");
  if (error) {
    return failure("comments.errors.failed");
  }
  if (data.length > 0) {
    return { ok: true, value: { tombstone: false } };
  }
  const { data: kept } = await supabase
    .from("comments")
    .select("deleted_at")
    .eq("id", id)
    .maybeSingle();
  return kept?.deleted_at
    ? { ok: true, value: { tombstone: true } }
    : failure("comments.errors.failed");
}

/** "Мэдэгдэх": once per reader and comment, never one's own. Staff see the count. */
export async function reportComment(id: string): Promise<CommentResult<null>> {
  const supabase = await createClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    return failure("comments.errors.signIn");
  }
  if (!isId(id)) {
    return failure("comments.errors.notFound");
  }
  const { data: comment } = await supabase
    .from("comments")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();
  if (!comment) {
    return failure("comments.errors.notFound");
  }
  if (comment.user_id === userId) {
    return failure("comments.errors.ownReport");
  }
  const { error } = await supabase
    .from("comment_reports")
    .insert({ comment_id: id, user_id: userId });
  // Reporting twice is not an error for the reader: it is reported.
  if (error && error.code !== "23505") {
    return failure("comments.errors.failed");
  }
  return { ok: true, value: null };
}
