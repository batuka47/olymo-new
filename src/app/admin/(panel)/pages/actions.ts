"use server";

import type { JSONContent } from "@tiptap/react";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { adminRoutes } from "@/config/admin";
import { hasPart, sitePageHref } from "@/config/site-pages";
import { requireStaff } from "@/lib/auth/staff";
import { renderArticleHtml } from "@/lib/editor/render-html";
import { t } from "@/lib/i18n";
import { teamFolder } from "@/lib/media";
import { removeFolder } from "@/lib/media-cleanup";
import { blocksForPage } from "@/lib/site-pages/blocks";
import { sitePageInputSchema, type SitePageInput } from "@/lib/site-pages/schema";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Values = z.output<typeof sitePageInputSchema>;

export type SaveSitePageResult = { ok: true; savedAt: string } | { ok: false; error: string };

function missingIds(rows: { id: string }[], keep: { id: string }[]): string[] {
  const kept = new Set(keep.map((item) => item.id));
  return rows.map((row) => row.id).filter((id) => !kept.has(id));
}

// Lists are saved by upserting the rows in their new order, then deleting the rows that were
// removed. A failure half-way leaves an extra row at worst, never a lost one.

async function saveFaqItems(supabase: Supabase, items: Values["faq"]) {
  if (items.length > 0) {
    const { error } = await supabase.from("faq_items").upsert(
      items.map((item, index) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        sort_order: index,
      })),
    );
    if (error) throw error;
  }
  const { data, error } = await supabase.from("faq_items").select("id");
  if (error) throw error;
  const removed = missingIds(data, items);
  if (removed.length > 0) {
    const { error: deleteError } = await supabase.from("faq_items").delete().in("id", removed);
    if (deleteError) throw deleteError;
  }
}

async function saveTeamMembers(supabase: Supabase, members: Values["team"]) {
  if (members.length > 0) {
    const { error } = await supabase.from("team_members").upsert(
      members.map((member, index) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        photo_path: member.photoPath,
        sort_order: index,
      })),
    );
    if (error) throw error;
  }
  const { data, error } = await supabase.from("team_members").select("id");
  if (error) throw error;
  const removed = missingIds(data, members);
  if (removed.length === 0) {
    return;
  }
  const { error: deleteError } = await supabase.from("team_members").delete().in("id", removed);
  if (deleteError) throw deleteError;
  // The rows are gone either way; leftover photos would only waste space, so log and go on.
  for (const id of removed) {
    try {
      await removeFolder(supabase, teamFolder(id));
    } catch (storageError) {
      console.error(`Could not remove the photo of removed team member ${id}:`, storageError);
    }
  }
}

/** The body is rendered only when it was edited; untouched (seeded) HTML stays as it is. */
function renderBody(bodyJson: Values["bodyJson"]) {
  if (!bodyJson) {
    return {};
  }
  // Arrived as JSON; rendering it with the article schema throws on anything unknown.
  return { body_json: bodyJson as Json, body_html: renderArticleHtml(bodyJson as JSONContent) };
}

export async function saveSitePage(input: SitePageInput): Promise<SaveSitePageResult> {
  await requireStaff();

  const parsed = sitePageInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? t("admin.pages.errors.saveFailed"),
    };
  }
  const values = parsed.data;

  let body: ReturnType<typeof renderBody>;
  try {
    body = renderBody(values.bodyJson);
  } catch (error) {
    console.error(`Site page ${values.slug}: body could not be rendered`, error);
    return { ok: false, error: t("admin.pages.errors.body") };
  }

  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("site_pages")
      .update({
        title: values.title,
        description: values.description,
        blocks: blocksForPage(values.slug, values.blocks),
        ...body,
      })
      .eq("slug", values.slug)
      .select("slug")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`No site_pages row for "${values.slug}"`);

    if (hasPart(values.slug, "faq")) {
      await saveFaqItems(supabase, values.faq);
    }
    if (hasPart(values.slug, "team")) {
      await saveTeamMembers(supabase, values.team);
    }
  } catch (error) {
    console.error(`Saving site page ${values.slug} failed`, error);
    return { ok: false, error: t("admin.pages.errors.saveFailed") };
  }

  revalidatePath(sitePageHref(values.slug));
  revalidatePath(adminRoutes.pages);
  return { ok: true, savedAt: new Date().toISOString() };
}
