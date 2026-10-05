import type { JSONContent } from "@tiptap/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasPart, isSitePageSlug } from "@/config/site-pages";
import { requireStaff } from "@/lib/auth/staff";
import { t } from "@/lib/i18n";
import { blocksWithIds, type SitePageFormValues } from "@/lib/site-pages/form";
import { getFaqItems, getSitePage, getTeamMembers } from "@/lib/site-pages/queries";
import { SitePageEditor } from "../site-page-editor";

export const metadata: Metadata = { title: t("admin.nav.pages") };

export default async function EditSitePagePage({ params }: PageProps<"/admin/pages/[slug]">) {
  await requireStaff();
  const { slug } = await params;
  if (!isSitePageSlug(slug)) {
    notFound();
  }
  const [page, faq, team] = await Promise.all([
    getSitePage(slug),
    hasPart(slug, "faq") ? getFaqItems() : [],
    hasPart(slug, "team") ? getTeamMembers() : [],
  ]);
  if (!page) {
    notFound();
  }

  const initialValues: SitePageFormValues = {
    title: page.title,
    description: page.description,
    bodyJson: page.body_json as JSONContent | null,
    rationale: blocksWithIds(page.blocks.rationale),
    vision: page.blocks.vision,
    mission: page.blocks.mission,
    benefits: blocksWithIds(page.blocks.benefits),
    faq,
    team: team.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      photoPath: member.photo_path,
    })),
  };

  return (
    <SitePageEditor
      slug={slug}
      initialValues={initialValues}
      initialBody={(page.body_json as JSONContent | null) ?? page.body_html ?? ""}
    />
  );
}
