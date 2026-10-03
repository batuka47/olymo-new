import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { SitePageSlug } from "@/config/site-pages";
import { readSitePageBlocks } from "@/lib/site-pages/blocks";
import { createPublicClient } from "@/lib/supabase/server";

// Everything here is public (RLS: anyone reads), so the cookie-free client serves the site and the
// admin editor alike. Site pages are ISR; saving in /admin/pages revalidates them.

export const getSitePage = cache(async (slug: SitePageSlug) => {
  const { data, error } = await createPublicClient()
    .from("site_pages")
    .select("slug, title, description, body_json, body_html, blocks, updated_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data && { ...data, blocks: readSitePageBlocks(data.blocks) };
});

export type SitePage = NonNullable<Awaited<ReturnType<typeof getSitePage>>>;

/** The row is created by the content migration, so a missing one is a 404, not an empty page. */
export async function requireSitePage(slug: SitePageSlug): Promise<SitePage> {
  const page = await getSitePage(slug);
  if (!page) {
    notFound();
  }
  return page;
}

export async function getAllSitePages() {
  const { data, error } = await createPublicClient()
    .from("site_pages")
    .select("slug, title, updated_at");
  if (error) {
    throw error;
  }
  return data;
}

export const getFaqItems = cache(async () => {
  const { data, error } = await createPublicClient()
    .from("faq_items")
    .select("id, question, answer")
    .order("sort_order")
    .order("created_at");
  if (error) {
    throw error;
  }
  return data;
});

export const getTeamMembers = cache(async () => {
  const { data, error } = await createPublicClient()
    .from("team_members")
    .select("id, name, role, photo_path, updated_at")
    .order("sort_order")
    .order("created_at");
  if (error) {
    throw error;
  }
  return data;
});

export type TeamMember = Awaited<ReturnType<typeof getTeamMembers>>[number];
