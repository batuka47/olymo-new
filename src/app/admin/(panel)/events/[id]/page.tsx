import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/staff";
import { emptyEventValues, eventRowToValues } from "@/lib/events/form";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { EventEditor } from "../event-editor";

export async function generateMetadata({
  searchParams,
}: PageProps<"/admin/events/[id]">): Promise<Metadata> {
  const { new: isNew } = await searchParams;
  return { title: t(isNew ? "admin.events.editor.newTitle" : "admin.events.editor.editTitle") };
}

export default async function EditEventPage({
  params,
  searchParams,
}: PageProps<"/admin/events/[id]">) {
  await requireStaff();
  const { id } = await params;
  const { new: isNew } = await searchParams;
  if (!z.uuid().safeParse(id).success) {
    notFound();
  }

  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  // ?new=1 comes from /admin/events/new: the event is created on its first save.
  if (!event && !isNew) {
    notFound();
  }

  return (
    <EventEditor
      key={id}
      eventId={id}
      initialValues={event ? eventRowToValues(event) : emptyEventValues()}
      saved={
        event
          ? { exists: true, status: event.status, publishAt: event.publish_at, slug: event.slug }
          : { exists: false, status: "draft", publishAt: null, slug: "" }
      }
    />
  );
}
