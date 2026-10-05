import { z } from "zod";
import { eventTypes } from "@/config/events";
import { fromUlaanbaatarInputValue } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { COVER_NAME, eventFolder, isUploadedImagePath } from "@/lib/media";
import { publishInputFields } from "@/lib/publishing";
import { SLUG_PATTERN } from "@/lib/slug";
import { isHttpUrl } from "@/lib/url";

/** Digits with the usual separators: "+976 9911-2233", "(7011) 2233". */
const PHONE_PATTERN = /^\+?[\d\s()-]{6,20}$/;

/** Trimmed text; an empty field becomes null in the database. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: () => t("admin.events.errors.tooLong") })
    .transform((value) => value || null);

/** A datetime-local value read as Ulaanbaatar time, as an ISO instant. */
const startDateTime = z.string().transform((value, context) => {
  const instant = fromUlaanbaatarInputValue(value);
  if (!instant) {
    context.addIssue({ code: "custom", message: t("admin.events.errors.startsAt") });
    return z.NEVER;
  }
  return instant.toISOString();
});

/** Like startDateTime, but empty is allowed (no end time) and becomes null. */
const optionalEndDateTime = z.string().transform((value, context) => {
  if (value === "") {
    return null;
  }
  const instant = fromUlaanbaatarInputValue(value);
  if (!instant) {
    context.addIssue({ code: "custom", message: t("admin.events.errors.endsAt") });
    return z.NEVER;
  }
  return instant.toISOString();
});

/** Server-side check of the event editor (see EventFormValues). */
export const eventInputSchema = z
  .object({
    id: z.uuid(),
    title: z
      .string()
      .trim()
      .min(1, { error: () => t("admin.events.errors.title") })
      .max(200, { error: () => t("admin.events.errors.tooLong") }),
    slug: z
      .string()
      .trim()
      .max(120)
      .regex(SLUG_PATTERN, { error: () => t("admin.slug.invalid") }),
    excerpt: optionalText(200),
    bodyJson: z.object({ type: z.literal("doc") }).loose(),
    coverPath: z.string().nullable(),
    coverAlt: optionalText(200),
    eventType: z.enum(eventTypes, { error: () => t("admin.events.errors.eventType") }),
    organizer: optionalText(200),
    startsAt: startDateTime,
    endsAt: optionalEndDateTime,
    location: optionalText(200),
    priceText: optionalText(100),
    contactPhone: optionalText(40).refine((value) => value === null || PHONE_PATTERN.test(value), {
      error: () => t("admin.events.errors.phone"),
    }),
    registrationUrl: optionalText(500).refine((value) => value === null || isHttpUrl(value), {
      error: () => t("admin.events.errors.url"),
    }),
    isFeatured: z.boolean(),
    ...publishInputFields,
  })
  .superRefine((values, context) => {
    if (values.endsAt && values.endsAt < values.startsAt) {
      context.addIssue({
        code: "custom",
        message: t("admin.events.errors.endsBeforeStart"),
        path: ["endsAt"],
      });
    }
    // Covers can only point at this event's own folder (see CoverImageField).
    if (
      values.coverPath &&
      !isUploadedImagePath(values.coverPath, eventFolder(values.id), COVER_NAME)
    ) {
      context.addIssue({ code: "custom", message: t("admin.cover.invalid"), path: ["coverPath"] });
    }
    if (values.coverPath && !values.coverAlt) {
      context.addIssue({
        code: "custom",
        message: t("admin.cover.altRequired"),
        path: ["coverAlt"],
      });
    }
  });

export type EventInput = z.input<typeof eventInputSchema>;
