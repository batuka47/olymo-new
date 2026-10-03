import { z } from "zod";
import { categories, type CategorySlug } from "@/config/categories";
import { olympiadSubjects } from "@/lib/articles/olympiad";
import { t } from "@/lib/i18n";
import { articleCoverPath, IMAGE_EXTENSIONS } from "@/lib/media";
import { SLUG_PATTERN } from "@/lib/slug";
import { isHttpUrl } from "@/lib/url";

const categorySlugs = categories.map((category) => category.slug) as [
  CategorySlug,
  ...CategorySlug[],
];

/** Trimmed text; an empty field becomes null in the database. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: () => t("admin.articles.errors.tooLong") })
    .transform((value) => value || null);

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    error: () => t("admin.articles.errors.date"),
  })
  .transform((value) => value || null);

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || isHttpUrl(value), {
    error: () => t("admin.articles.errors.url"),
  })
  .transform((value) => value || null);

export const tagSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN).max(60),
  label: z.string().trim().min(1).max(60),
});

export type TagValue = z.infer<typeof tagSchema>;

export const articleInputSchema = z
  .object({
    id: z.uuid(),
    intent: z.enum(["draft", "publish"]),
    title: z
      .string()
      .trim()
      .min(1, { error: () => t("admin.articles.errors.title") })
      .max(200, { error: () => t("admin.articles.errors.tooLong") }),
    slug: z
      .string()
      .trim()
      .max(120)
      .regex(SLUG_PATTERN, { error: () => t("admin.articles.errors.slug") }),
    categorySlug: z.enum(categorySlugs, { error: () => t("admin.articles.errors.category") }),
    tags: z.array(tagSchema).max(15),
    authorName: optionalText(80),
    excerpt: optionalText(200),
    bodyJson: z.object({ type: z.literal("doc") }).loose(),
    coverPath: z.string().nullable(),
    coverAlt: optionalText(200),
    coverCaption: optionalText(200),
    subject: z.enum(olympiadSubjects).nullable(),
    levelText: optionalText(100),
    registrationDeadline: optionalDate,
    examDate: optionalDate,
    audience: optionalText(200),
    location: optionalText(200),
    feeText: optionalText(100),
    organizer: optionalText(200),
    registrationUrl: optionalUrl,
    isFeatured: z.boolean(),
    isGoodToKnow: z.boolean(),
    isBreaking: z.boolean(),
    isSpecial: z.boolean(),
    specialUntil: optionalDate,
    seoTitle: optionalText(120),
    seoDescription: optionalText(300),
    publishMode: z.enum(["now", "schedule"]),
    scheduleAt: z.string(),
  })
  .superRefine((values, context) => {
    // Covers can only point at this article's own folder (see CoverImageField).
    const allowedCoverPaths = IMAGE_EXTENSIONS.map((extension) =>
      articleCoverPath(values.id, 1600, extension),
    );
    if (values.coverPath && !allowedCoverPaths.includes(values.coverPath)) {
      context.addIssue({
        code: "custom",
        message: t("admin.articles.errors.cover"),
        path: ["coverPath"],
      });
    }
    if (values.coverPath && !values.coverAlt) {
      context.addIssue({
        code: "custom",
        message: t("admin.articles.errors.coverAlt"),
        path: ["coverAlt"],
      });
    }
  });

export type ArticleInput = z.input<typeof articleInputSchema>;
