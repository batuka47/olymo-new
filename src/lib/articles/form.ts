import type { JSONContent } from "@tiptap/react";
import type { OlympiadSubject } from "@/lib/articles/olympiad";
import type { ArticleInput, TagValue } from "@/lib/articles/schema";
import { toUlaanbaatarInputValue } from "@/lib/dates";
import type { Database } from "@/lib/supabase/types";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

/** Everything the article editor edits. Empty text fields are "" here and null in the database. */
export interface ArticleFormValues {
  title: string;
  slug: string;
  categorySlug: string;
  tags: TagValue[];
  authorName: string;
  excerpt: string;
  bodyJson: JSONContent;
  coverPath: string | null;
  coverAlt: string;
  coverCaption: string;
  subject: OlympiadSubject | "";
  levelText: string;
  registrationDeadline: string;
  examDate: string;
  audience: string;
  location: string;
  feeText: string;
  organizer: string;
  registrationUrl: string;
  isFeatured: boolean;
  isGoodToKnow: boolean;
  isBreaking: boolean;
  isSpecial: boolean;
  /** Last day on the home banner (YYYY-MM-DD); "" for no end. */
  specialUntil: string;
  seoTitle: string;
  seoDescription: string;
  publishMode: "now" | "schedule";
  scheduleAt: string;
}

export const emptyDocument: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

export function emptyArticleValues(): ArticleFormValues {
  return {
    title: "",
    slug: "",
    categorySlug: "",
    tags: [],
    authorName: "",
    excerpt: "",
    bodyJson: emptyDocument,
    coverPath: null,
    coverAlt: "",
    coverCaption: "",
    subject: "",
    levelText: "",
    registrationDeadline: "",
    examDate: "",
    audience: "",
    location: "",
    feeText: "",
    organizer: "",
    registrationUrl: "",
    isFeatured: false,
    isGoodToKnow: false,
    isBreaking: false,
    isSpecial: false,
    specialUntil: "",
    seoTitle: "",
    seoDescription: "",
    publishMode: "now",
    scheduleAt: "",
  };
}

export function articleRowToValues(
  row: ArticleRow,
  tags: TagValue[],
  now = new Date(),
): ArticleFormValues {
  const scheduled = row.status !== "draft" && row.publish_at && new Date(row.publish_at) > now;

  return {
    title: row.title,
    slug: row.slug,
    categorySlug: row.category_slug,
    tags,
    authorName: row.author_name ?? "",
    excerpt: row.excerpt ?? "",
    bodyJson: (row.body_json as JSONContent | null) ?? emptyDocument,
    coverPath: row.cover_path,
    coverAlt: row.cover_alt ?? "",
    coverCaption: row.cover_caption ?? "",
    subject: (row.subject as OlympiadSubject | null) ?? "",
    levelText: row.level_text ?? "",
    registrationDeadline: row.registration_deadline ?? "",
    examDate: row.exam_date ?? "",
    audience: row.audience ?? "",
    location: row.location ?? "",
    feeText: row.fee_text ?? "",
    organizer: row.organizer ?? "",
    registrationUrl: row.registration_url ?? "",
    isFeatured: row.is_featured,
    isGoodToKnow: row.is_good_to_know,
    isBreaking: row.is_breaking,
    isSpecial: row.is_special,
    specialUntil: row.special_until ?? "",
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    publishMode: scheduled ? "schedule" : "now",
    scheduleAt: scheduled && row.publish_at ? toUlaanbaatarInputValue(row.publish_at) : "",
  };
}

export function toArticleInput(
  values: ArticleFormValues,
  id: string,
  intent: ArticleInput["intent"],
): ArticleInput {
  return {
    ...values,
    id,
    intent,
    categorySlug: values.categorySlug as ArticleInput["categorySlug"],
    subject: values.subject || null,
    // ProseMirror builds attrs with Object.create(null); React only sends plain objects to server
    // actions (others arrive as opaque references), so round-trip through JSON first.
    bodyJson: { ...JSON.parse(JSON.stringify(values.bodyJson)), type: "doc" },
  };
}
