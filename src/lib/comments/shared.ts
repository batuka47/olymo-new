import { z } from "zod";
import { formatShortDate, ulaanbaatarDate } from "@/lib/dates";
import { t } from "@/lib/i18n";

// Shared by the comments section in the browser and the server actions.

export const COMMENT_MAX = 1000;
export const COMMENTS_PAGE_SIZE = 20;
/** Authors may edit or delete their comment this long after posting; the database agrees. */
export const EDIT_WINDOW_MS = 15 * 60_000;

export const commentBodySchema = z
  .string()
  .trim()
  .min(1, { error: () => t("comments.errors.empty") })
  .max(COMMENT_MAX, { error: () => t("comments.errors.tooLong", { max: COMMENT_MAX }) });

/** One comment as the section shows it (from article_comments, or an action's answer). */
export interface CommentItem {
  id: string;
  parentId: string | null;
  authorName: string;
  body: string;
  /** Not public: held by the word filter or hidden by staff. Only its author sees it. */
  hidden: boolean;
  /** A tombstone: deleted, but kept because others replied ("Устгагдсан сэтгэгдэл"). */
  deleted: boolean;
  createdAt: string;
  editedAt: string | null;
  isOwn: boolean;
  reported: boolean;
}

export function withinEditWindow(createdAt: string, now: number): boolean {
  return now - Date.parse(createdAt) < EDIT_WINDOW_MS;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** "Саяхан", "5 минутын өмнө", "2 цагийн өмнө", "Өчигдөр", then the date. */
export function timeAgo(value: string, now: number): string {
  const elapsed = now - Date.parse(value);
  if (elapsed < MINUTE_MS) {
    return t("comments.time.now");
  }
  if (elapsed < HOUR_MS) {
    return t("comments.time.minutes", { count: Math.floor(elapsed / MINUTE_MS) });
  }
  const today = ulaanbaatarDate(new Date(now));
  if (ulaanbaatarDate(value) === today) {
    return t("comments.time.hours", { count: Math.floor(elapsed / HOUR_MS) });
  }
  if (ulaanbaatarDate(value) === ulaanbaatarDate(new Date(now - 24 * HOUR_MS))) {
    return t("comments.time.yesterday");
  }
  return formatShortDate(value, new Date(now));
}
