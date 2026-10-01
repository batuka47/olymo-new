import { draftMode } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { articlePath } from "@/lib/articles/status";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

/**
 * Opens an article on the public site in Draft Mode, so drafts and scheduled articles render.
 * Staff only: the proxy and requireStaff() both check.
 */
export async function GET(request: NextRequest) {
  await requireStaff();

  const id = z.uuid().safeParse(request.nextUrl.searchParams.get("id"));
  if (!id.success) {
    notFound();
  }

  const supabase = await createClient();
  const { data: article } = await supabase
    .from("articles")
    .select("slug, category_slug")
    .eq("id", id.data)
    .maybeSingle();
  if (!article) {
    notFound();
  }

  (await draftMode()).enable();
  redirect(articlePath(article.category_slug, article.slug));
}
