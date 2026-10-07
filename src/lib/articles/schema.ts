import { z } from "zod";
import { EVENTS_CATEGORY_SLUG } from "@/config/categories";
import { COVER_POSITIONS } from "@/lib/articles/cover";
import { olympiadSubjects } from "@/lib/articles/olympiad";
import { t } from "@/lib/i18n";
import { articleFolder, COVER_NAME, isUploadedImagePath } from "@/lib/media";
import { publishInputFields } from "@/lib/publishing";
import { SLUG_PATTERN } from "@/lib/slug";
import { isHttpUrl } from "@/lib/url";

/** A category an article can be in (not the events section); saveArticle checks it exists. */
const categorySlug = z
  .string()
  .regex(SLUG_PATTERN, { error: () => t("admin.articles.errors.category") })
  .refine((slug) => slug !== EVENTS_CATEGORY_SLUG, {
    error: () => t("admin.articles.errors.category"),
  });

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

/** "Богино тайлбар": the line under the title in lists and link previews. */
export const EXCERPT_LENGTH = { min: 50, max: 200 } as const;

const excerptError = () =>
  t("admin.articles.errors.excerpt", { min: EXCERPT_LENGTH.min, max: EXCERPT_LENGTH.max });

export const tagSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN).max(60),
  label: z.string().trim().min(1).max(60),
});

export type TagValue = z.infer<typeof tagSchema>;

export const articleInputSchema = z
  .object({
    id: z.uuid(),
    title: z
      .string()
      .trim()
      .min(1, { error: () => t("admin.articles.errors.title") })
      .max(200, { error: () => t("admin.articles.errors.tooLong") }),
    slug: z
      .string()
      .trim()
      .max(120)
      .regex(SLUG_PATTERN, { error: () => t("admin.slug.invalid") }),
    /** Made from the title, not typed: the server may add "-2" to keep it unique. */
    slugFollowsTitle: z.boolean(),
    categorySlug,
    /** "Хамаарах категориуд": lists the article in these too; its address keeps the main one. */
    secondaryCategories: z.array(categorySlug).max(20),
    tags: z.array(tagSchema).max(15),
    authorName: optionalText(80),
    excerpt: z
      .string()
      .trim()
      .max(EXCERPT_LENGTH.max, { error: excerptError })
      .transform((value) => value || null),
    bodyJson: z.object({ type: z.literal("doc") }).loose(),
    coverPath: z.string().nullable(),
    coverAlt: optionalText(200),
    coverCaption: optionalText(200),
    coverPosition: z.enum(COVER_POSITIONS),
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
    commentsClosed: z.boolean(),
    seoTitle: optionalText(120),
    seoDescription: optionalText(300),
    ...publishInputFields,
  })
  .superRefine((values, context) => {
    // Drafts save with any excerpt (autosave runs while it is being written); going live needs one.
    if (values.intent === "publish" && (values.excerpt?.length ?? 0) < EXCERPT_LENGTH.min) {
      context.addIssue({ code: "custom", message: excerptError(), path: ["excerpt"] });
    }
    // Covers can only point at this article's own folder (see CoverImageField).
    if (
      values.coverPath &&
      !isUploadedImagePath(values.coverPath, articleFolder(values.id), COVER_NAME)
    ) {
      context.addIssue({
        code: "custom",
        message: t("admin.cover.invalid"),
        path: ["coverPath"],
      });
    }
    if (values.coverPath && !values.coverAlt) {
      context.addIssue({
        code: "custom",
        message: t("admin.cover.altRequired"),
        path: ["coverAlt"],
      });
    }
  });

export type ArticleInput = z.input<typeof articleInputSchema>;
