import type { MessageKey } from "@/lib/i18n";

/**
 * What readers see, derived from status + publish_at. The database treats "published" and
 * "scheduled" alike: both go live once publish_at has passed.
 */
export type ArticleState = "draft" | "scheduled" | "published";

export const articleStates: readonly ArticleState[] = ["draft", "scheduled", "published"];

/** Statuses that go live at publish_at (same rule as the RLS policies). */
export const publicStatuses = ["published", "scheduled"];

export function articleState(
  status: string,
  publishAt: string | null,
  now = new Date(),
): ArticleState {
  if (status === "draft" || !publishAt) {
    return "draft";
  }
  return new Date(publishAt) > now ? "scheduled" : "published";
}

export function isArticleState(value: unknown): value is ArticleState {
  return articleStates.includes(value as ArticleState);
}

export const articleStateLabelKeys: Record<ArticleState, MessageKey> = {
  draft: "admin.articles.state.draft",
  scheduled: "admin.articles.state.scheduled",
  published: "admin.articles.state.published",
};

export function articlePath(categorySlug: string, slug: string): string {
  return `/${categorySlug}/${slug}`;
}
