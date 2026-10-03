import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adRowToValues, emptyAdValues } from "@/lib/ads/form";
import { requireStaff } from "@/lib/auth/staff";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { AdForm } from "../ad-form";

export async function generateMetadata({
  searchParams,
}: PageProps<"/admin/ads/[id]">): Promise<Metadata> {
  const { new: isNew } = await searchParams;
  return { title: t(isNew ? "admin.ads.form.newTitle" : "admin.ads.form.editTitle") };
}

export default async function EditAdPage({ params, searchParams }: PageProps<"/admin/ads/[id]">) {
  await requireStaff();
  const { id } = await params;
  const { new: isNew } = await searchParams;
  if (!z.uuid().safeParse(id).success) {
    notFound();
  }

  const supabase = await createClient();
  const { data: ad } = await supabase.from("ads").select("*").eq("id", id).maybeSingle();
  // ?new=1 comes from /admin/ads/new: the ad is created on its first save.
  if (!ad && !isNew) {
    notFound();
  }

  return (
    <>
      <AdminPageHeader title={t(ad ? "admin.ads.form.editTitle" : "admin.ads.form.newTitle")} />
      <AdForm
        key={id}
        adId={id}
        initialValues={ad ? adRowToValues(ad) : emptyAdValues()}
        imageVersion={ad?.updated_at ?? "new"}
      />
    </>
  );
}
