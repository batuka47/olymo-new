import "server-only";
import { cache } from "react";
import type { SubmissionKind, SubmissionStatus } from "@/config/submissions";
import { createClient } from "@/lib/supabase/server";

// Read as the signed-in admin: RLS lets only admins see submissions, so for anyone else these
// come back empty.

export const INBOX_PAGE_SIZE = 25;

/** "Шинэ" submissions: the badge in the admin nav and the dashboard. Cached per request. */
export const getNewSubmissionCount = cache(async (kind?: SubmissionKind): Promise<number> => {
  const supabase = await createClient();
  let query = supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  if (kind) {
    query = query.eq("kind", kind);
  }
  const { count } = await query;
  return count ?? 0;
});

export interface InboxQuery {
  kind: SubmissionKind | null;
  /** null: everything except spam, which has its own filter. */
  status: SubmissionStatus | null;
  page: number;
}

export async function getInbox({ kind, status, page }: InboxQuery) {
  const supabase = await createClient();
  let query = supabase
    .from("submissions")
    .select("id, kind, first_name, last_name, organization, title, message, status, created_at", {
      count: "exact",
    });
  if (kind) {
    query = query.eq("kind", kind);
  }
  query = status ? query.eq("status", status) : query.neq("status", "spam");
  const from = (page - 1) * INBOX_PAGE_SIZE;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + INBOX_PAGE_SIZE - 1);
  // PGRST103: a page past the end, which shows as empty.
  if (error && error.code !== "PGRST103") {
    throw error;
  }
  return { rows: data ?? [], total: count ?? 0 };
}

export type InboxRow = Awaited<ReturnType<typeof getInbox>>["rows"][number];

export async function getSubmission(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(
      "id, kind, first_name, last_name, phone, email, organization, title, files_url, message, status, admin_note, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

export type Submission = NonNullable<Awaited<ReturnType<typeof getSubmission>>>;
