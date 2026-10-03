import { z } from "zod";
import { fromUlaanbaatarInputValue, toUlaanbaatarInputValue } from "@/lib/dates";
import { t } from "@/lib/i18n";

/**
 * Publishing shared by articles and events: both tables have status + publish_at, and readers see
 * a row once it is "published" or "scheduled" and publish_at has passed (see the RLS policies).
 */
export type PublishIntent = "draft" | "publish";
export type PublishMode = "now" | "schedule";
export type PublishStatus = "draft" | "published" | "scheduled";

export interface PublishFormFields {
  publishMode: PublishMode;
  /** A datetime-local value in Ulaanbaatar time ("2026-10-05T09:00"). */
  scheduleAt: string;
}

/** The zod fields every publishable form sends along with its own values. */
export const publishInputFields = {
  intent: z.enum(["draft", "publish"]),
  publishMode: z.enum(["now", "schedule"]),
  scheduleAt: z.string(),
};

/** A saved row opens with "schedule" selected while its publish time is still ahead. */
export function publishFieldsFromRow(
  row: { status: string; publish_at: string | null },
  now = new Date(),
): PublishFormFields {
  const scheduled = row.status !== "draft" && row.publish_at && new Date(row.publish_at) > now;
  return {
    publishMode: scheduled ? "schedule" : "now",
    scheduleAt: scheduled && row.publish_at ? toUlaanbaatarInputValue(row.publish_at) : "",
  };
}

export interface Publishing {
  status: PublishStatus;
  publishAt: string | null;
}

/** What to store for a save: a draft, a scheduled time in the future, or live now. */
export function resolvePublishing(
  input: PublishFormFields & { intent: PublishIntent },
  existing: { status: string; publish_at: string | null } | null,
  now: Date,
): Publishing | { error: string } {
  if (input.intent === "draft") {
    return { status: "draft", publishAt: null };
  }
  if (input.publishMode === "schedule") {
    const scheduledAt = fromUlaanbaatarInputValue(input.scheduleAt);
    if (!scheduledAt || scheduledAt <= now) {
      return { error: t("admin.publish.futureRequired") };
    }
    return { status: "scheduled", publishAt: scheduledAt.toISOString() };
  }
  // Re-saving a live row keeps its original publish time.
  const alreadyLive =
    existing?.status !== "draft" && existing?.publish_at && new Date(existing.publish_at) <= now;
  return { status: "published", publishAt: alreadyLive ? existing.publish_at : now.toISOString() };
}
