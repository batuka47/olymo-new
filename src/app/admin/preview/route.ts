import { draftMode } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { eventPath } from "@/config/events";
import { articlePath } from "@/lib/articles/status";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function articleUrl(supabase: Supabase, id: string): Promise<string | null> {
  const { data } = await supabase
    .from("articles")
    .select("slug, category_slug")
    .eq("id", id)
    .maybeSingle();
  return data && articlePath(data.category_slug, data.slug);
}

async function eventUrl(supabase: Supabase, id: string): Promise<string | null> {
  const { data } = await supabase.from("events").select("slug").eq("id", id).maybeSingle();
  return data && eventPath(data.slug);
}

/**
 * Opens an article (?id=) or event (?event=) on the public site in Draft Mode, so drafts and
 * scheduled items render. Staff only: the proxy and requireStaff() both check.
 */
export async function GET(request: NextRequest) {
  await requireStaff();

  const params = request.nextUrl.searchParams;
  const eventId = params.get("event");
  const id = z.uuid().safeParse(eventId ?? params.get("id"));
  if (!id.success) {
    notFound();
  }

  const supabase = await createClient();
  const url = eventId ? await eventUrl(supabase, id.data) : await articleUrl(supabase, id.data);
  if (!url) {
    notFound();
  }

  (await draftMode()).enable();
  redirect(url);
}
