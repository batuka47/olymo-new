"use server";

import type { JSONContent } from "@tiptap/react";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { adminRoutes } from "@/config/admin";
import { routes } from "@/config/navigation";
import { requireStaff } from "@/lib/auth/staff";
import { renderArticleHtml } from "@/lib/editor/render-html";
import { eventPath } from "@/config/events";
import { EVENTS_CACHE_TAG } from "@/lib/events/queries";
import { eventInputSchema, type EventInput } from "@/lib/events/schema";
import { t } from "@/lib/i18n";
import { eventFolder } from "@/lib/media";
import { removeFolder } from "@/lib/media-cleanup";
import { resolvePublishing } from "@/lib/publishing";
import { SLUG_PATTERN } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type SaveEventResult =
  | { ok: true; status: string; publishAt: string | null; slug: string; savedAt: string }
  | { ok: false; error: string };

export interface EventActionResult {
  ok: boolean;
  error?: string;
}

/** The home page (section 04 and 05), /events and the event pages show events. */
function refreshEventPages(slugs: (string | null | undefined)[]) {
  updateTag(EVENTS_CACHE_TAG);
  revalidatePath("/");
  revalidatePath(routes.events);
  for (const slug of slugs) {
    if (slug) {
      revalidatePath(eventPath(slug));
    }
  }
  revalidatePath(adminRoutes.events);
}

async function isSlugTaken(supabase: Supabase, slug: string, eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .neq("id", eventId)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function saveEvent(input: EventInput): Promise<SaveEventResult> {
  await requireStaff();

  const parsed = eventInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? t("admin.events.errors.saveFailed"),
    };
  }
  const values = parsed.data;

  let bodyHtml: string;
  try {
    bodyHtml = renderArticleHtml(values.bodyJson as JSONContent);
  } catch (error) {
    console.error(`Event ${values.id}: body could not be rendered`, error);
    return { ok: false, error: t("admin.events.errors.body") };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("events")
    .select("status, publish_at, slug")
    .eq("id", values.id)
    .maybeSingle();
  if (await isSlugTaken(supabase, values.slug, values.id)) {
    return { ok: false, error: t("admin.slug.taken") };
  }

  const publishing = resolvePublishing(values, existing, new Date());
  if ("error" in publishing) {
    return { ok: false, error: publishing.error };
  }

  const { error } = await supabase.from("events").upsert({
    id: values.id,
    title: values.title,
    slug: values.slug,
    excerpt: values.excerpt,
    // Arrived as JSON and was just rendered with the article schema above.
    body_json: values.bodyJson as Json,
    body_html: bodyHtml,
    cover_path: values.coverPath,
    cover_alt: values.coverAlt,
    event_type: values.eventType,
    organizer: values.organizer,
    starts_at: values.startsAt,
    ends_at: values.endsAt,
    location: values.location,
    price_text: values.priceText,
    contact_phone: values.contactPhone,
    registration_url: values.registrationUrl,
    is_featured: values.isFeatured,
    status: publishing.status,
    publish_at: publishing.publishAt,
  });
  if (error) {
    const slugTaken = error.code === "23505";
    return {
      ok: false,
      error: t(slugTaken ? "admin.slug.taken" : "admin.events.errors.saveFailed"),
    };
  }

  refreshEventPages([values.slug, existing?.slug]);
  return {
    ok: true,
    status: publishing.status,
    publishAt: publishing.publishAt,
    slug: values.slug,
    savedAt: new Date().toISOString(),
  };
}

/** true = free, false = taken, null = not a valid slug. */
export async function checkEventSlugAvailability(
  slug: string,
  eventId: string,
): Promise<boolean | null> {
  await requireStaff();
  if (!SLUG_PATTERN.test(slug) || !z.uuid().safeParse(eventId).success) {
    return null;
  }
  const supabase = await createClient();
  return !(await isSlugTaken(supabase, slug, eventId));
}

export async function deleteEvent(eventId: string): Promise<EventActionResult> {
  await requireStaff();
  if (!z.uuid().safeParse(eventId).success) {
    return { ok: false, error: t("admin.events.errors.notFound") };
  }

  const supabase = await createClient();
  const { data: deleted, error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .select("slug")
    .maybeSingle();
  if (error || !deleted) {
    return { ok: false, error: t("admin.events.errors.deleteFailed") };
  }

  // The row is gone either way; leftover files would only waste space, so log and go on.
  try {
    await removeFolder(supabase, eventFolder(eventId));
  } catch (storageError) {
    console.error(`Could not remove images of deleted event ${eventId}:`, storageError);
  }
  refreshEventPages([deleted.slug]);
  return { ok: true };
}
