"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Adds one to the article's view_count. Sent by ViewBeacon at most once per browser session;
 * nothing about the reader is stored. Unpublished articles are ignored by the database function.
 */
export async function recordArticleView(articleId: string): Promise<void> {
  const id = z.uuid().safeParse(articleId);
  if (!id.success) {
    return;
  }
  const { error } = await createAdminClient().rpc("record_article_view", { article_id: id.data });
  if (error) {
    console.error("Recording an article view failed", error);
  }
}
