"use server";

import type { JSONContent } from "@tiptap/react";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminRoutes } from "@/config/admin";
import { ARTICLES_CACHE_TAG } from "@/lib/articles/public";
import { articleInputSchema, type ArticleInput, type TagValue } from "@/lib/articles/schema";
import { articlePath } from "@/lib/articles/status";
import { requireStaff } from "@/lib/auth/staff";
import { fromUlaanbaatarInputValue } from "@/lib/dates";
import { renderArticleHtml } from "@/lib/editor/render-html";
import { t } from "@/lib/i18n";
import { articleFolder, MEDIA_BUCKET } from "@/lib/media";
import { SLUG_PATTERN } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type SaveArticleResult =
  | {
      ok: true;
      status: string;
      publishAt: string | null;
      slug: string;
      categorySlug: string;
      savedAt: string;
    }
  | { ok: false; error: string };

export interface ActionResult {
  ok: boolean;
  error?: string;
}

interface ArticleLocation {
  category_slug: string;
  slug: string;
}

/** Home, category page and article page all show the article; refresh their cached HTML and lists. */
function revalidateArticlePages(locations: (ArticleLocation | null | undefined)[]) {
  updateTag(ARTICLES_CACHE_TAG);
  revalidatePath("/");
  for (const location of locations) {
    if (location) {
      revalidatePath(`/${location.category_slug}`);
      revalidatePath(articlePath(location.category_slug, location.slug));
    }
  }
  revalidatePath(adminRoutes.articles);
}

async function isSlugTaken(supabase: Supabase, slug: string, articleId: string): Promise<boolean> {
  const { data } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .neq("id", articleId)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

interface Publishing {
  status: "draft" | "published" | "scheduled";
  publishAt: string | null;
}

function resolvePublishing(
  input: { intent: "draft" | "publish"; publishMode: "now" | "schedule"; scheduleAt: string },
  existing: { status: string; publish_at: string | null } | null,
  now: Date,
): Publishing | { error: string } {
  if (input.intent === "draft") {
    return { status: "draft", publishAt: null };
  }
  if (input.publishMode === "schedule") {
    const scheduledAt = fromUlaanbaatarInputValue(input.scheduleAt);
    if (!scheduledAt || scheduledAt <= now) {
      return { error: t("admin.articles.errors.futureRequired") };
    }
    return { status: "scheduled", publishAt: scheduledAt.toISOString() };
  }
  // Re-saving a live article keeps its original publish time.
  const alreadyLive =
    existing?.status !== "draft" && existing?.publish_at && new Date(existing.publish_at) <= now;
  return { status: "published", publishAt: alreadyLive ? existing.publish_at : now.toISOString() };
}

async function replaceTags(supabase: Supabase, articleId: string, tags: TagValue[]) {
  if (tags.length > 0) {
    const { error } = await supabase
      .from("tags")
      .upsert(tags, { onConflict: "slug", ignoreDuplicates: true });
    if (error) return error;
  }
  const { error: deleteError } = await supabase
    .from("article_tags")
    .delete()
    .eq("article_id", articleId);
  if (deleteError || tags.length === 0) return deleteError;

  const { error } = await supabase
    .from("article_tags")
    .insert(tags.map((tag) => ({ article_id: articleId, tag_slug: tag.slug })));
  return error;
}

export async function saveArticle(input: ArticleInput): Promise<SaveArticleResult> {
  await requireStaff();

  const parsed = articleInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? t("admin.articles.errors.saveFailed"),
    };
  }
  const values = parsed.data;

  let bodyHtml: string;
  try {
    bodyHtml = renderArticleHtml(values.bodyJson as JSONContent);
  } catch (error) {
    console.error(`Article ${values.id}: body could not be rendered`, error);
    return { ok: false, error: t("admin.articles.errors.body") };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("articles")
    .select("status, publish_at, slug, category_slug")
    .eq("id", values.id)
    .maybeSingle();

  if (await isSlugTaken(supabase, values.slug, values.id)) {
    return { ok: false, error: t("admin.articles.errors.slugTaken") };
  }

  const publishing = resolvePublishing(values, existing, new Date());
  if ("error" in publishing) {
    return { ok: false, error: publishing.error };
  }

  const { error } = await supabase.from("articles").upsert({
    id: values.id,
    title: values.title,
    slug: values.slug,
    category_slug: values.categorySlug,
    author_name: values.authorName,
    excerpt: values.excerpt,
    // Arrived as JSON and was just rendered with the article schema above.
    body_json: values.bodyJson as Json,
    body_html: bodyHtml,
    cover_path: values.coverPath,
    cover_alt: values.coverAlt,
    cover_caption: values.coverCaption,
    subject: values.subject,
    level_text: values.levelText,
    registration_deadline: values.registrationDeadline,
    exam_date: values.examDate,
    audience: values.audience,
    location: values.location,
    fee_text: values.feeText,
    organizer: values.organizer,
    registration_url: values.registrationUrl,
    is_featured: values.isFeatured,
    is_good_to_know: values.isGoodToKnow,
    is_breaking: values.isBreaking,
    seo_title: values.seoTitle,
    seo_description: values.seoDescription,
    status: publishing.status,
    publish_at: publishing.publishAt,
  });
  if (error) {
    const message = error.code === "23505" ? "slugTaken" : "saveFailed";
    return { ok: false, error: t(`admin.articles.errors.${message}`) };
  }

  if (await replaceTags(supabase, values.id, values.tags)) {
    return { ok: false, error: t("admin.articles.errors.saveFailed") };
  }

  revalidateArticlePages([{ category_slug: values.categorySlug, slug: values.slug }, existing]);
  return {
    ok: true,
    status: publishing.status,
    publishAt: publishing.publishAt,
    slug: values.slug,
    categorySlug: values.categorySlug,
    savedAt: new Date().toISOString(),
  };
}

/** true = free, false = taken, null = not a valid slug. */
export async function checkSlugAvailability(
  slug: string,
  articleId: string,
): Promise<boolean | null> {
  await requireStaff();
  if (!SLUG_PATTERN.test(slug) || !z.uuid().safeParse(articleId).success) {
    return null;
  }
  const supabase = await createClient();
  return !(await isSlugTaken(supabase, slug, articleId));
}

async function removeArticleFiles(supabase: Supabase, articleId: string) {
  const folder = articleFolder(articleId);
  const { data: files, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .list(folder, { limit: 1000 });
  if (error || !files?.length) return error;

  const { error: removeError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove(files.map((file) => `${folder}/${file.name}`));
  return removeError;
}

export async function deleteArticle(articleId: string): Promise<ActionResult> {
  await requireStaff();
  if (!z.uuid().safeParse(articleId).success) {
    return { ok: false, error: t("admin.articles.errors.notFound") };
  }

  const supabase = await createClient();
  const { data: deleted, error } = await supabase
    .from("articles")
    .delete()
    .eq("id", articleId)
    .select("slug, category_slug")
    .maybeSingle();
  if (error || !deleted) {
    return { ok: false, error: t("admin.articles.errors.deleteFailed") };
  }

  // The article row is gone either way; leftover files would only waste space, so log and go on.
  const storageError = await removeArticleFiles(supabase, articleId);
  if (storageError) {
    console.error(`Could not remove images of deleted article ${articleId}:`, storageError.message);
  }

  revalidateArticlePages([deleted]);
  return { ok: true };
}

async function availableSlug(supabase: Supabase, base: string, articleId: string): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`;
    if (!(await isSlugTaken(supabase, candidate, articleId))) {
      return candidate;
    }
  }
}

async function copyArticleFiles(supabase: Supabase, fromId: string, toId: string) {
  const from = articleFolder(fromId);
  const to = articleFolder(toId);
  const { data: files, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .list(from, { limit: 1000 });
  if (error) return error;

  for (const file of files ?? []) {
    const { error: copyError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .copy(`${from}/${file.name}`, `${to}/${file.name}`);
    if (copyError) return copyError;
  }
  return null;
}

/**
 * Copies an article as a new draft, including its images, so deleting either article never breaks
 * the other. Then opens the copy in the editor.
 */
export async function duplicateArticle(articleId: string): Promise<ActionResult> {
  await requireStaff();
  if (!z.uuid().safeParse(articleId).success) {
    return { ok: false, error: t("admin.articles.errors.notFound") };
  }

  const supabase = await createClient();
  const { data: source } = await supabase
    .from("articles")
    .select("*, article_tags(tag_slug)")
    .eq("id", articleId)
    .maybeSingle();
  if (!source) {
    return { ok: false, error: t("admin.articles.errors.notFound") };
  }

  const copyId = crypto.randomUUID();
  if (await copyArticleFiles(supabase, articleId, copyId)) {
    return { ok: false, error: t("admin.articles.errors.duplicateFailed") };
  }

  const moveToCopy = (text: string) =>
    text.replaceAll(`${articleFolder(articleId)}/`, `${articleFolder(copyId)}/`);
  // Everything except the identity, generated and bookkeeping columns is copied.
  const { id, article_tags: tags, search_vector, created_at, updated_at, ...fields } = source;

  const { error } = await supabase.from("articles").insert({
    ...fields,
    id: copyId,
    slug: await availableSlug(supabase, `${source.slug}-khuulbar`, copyId),
    title: `${source.title} ${t("admin.articles.copySuffix")}`.slice(0, 200),
    status: "draft",
    publish_at: null,
    is_featured: false,
    is_breaking: false,
    view_count: 0,
    cover_path: source.cover_path && moveToCopy(source.cover_path),
    body_html: source.body_html && moveToCopy(source.body_html),
    body_json: source.body_json && JSON.parse(moveToCopy(JSON.stringify(source.body_json))),
  });
  if (error) {
    return { ok: false, error: t("admin.articles.errors.duplicateFailed") };
  }

  if (tags.length > 0) {
    await supabase
      .from("article_tags")
      .insert(tags.map(({ tag_slug }) => ({ article_id: copyId, tag_slug })));
  }

  revalidatePath(adminRoutes.articles);
  redirect(`${adminRoutes.articles}/${copyId}`);
}
