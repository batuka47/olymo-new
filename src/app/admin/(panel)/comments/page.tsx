import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FilterLinks } from "@/components/site/filter-links";
import { Pagination } from "@/components/site/pagination";
import { Tag } from "@/components/ui/tag";
import { adminRoutes } from "@/config/admin";
import { articlePath } from "@/lib/articles/status";
import { requireStaff } from "@/lib/auth/staff";
import { cx } from "@/lib/cx";
import { formatDateTime } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { CommentActions } from "./comment-actions";

export const metadata: Metadata = { title: t("admin.nav.comments") };

const PAGE_SIZE = 30;

/** newest: everything, newest first. reported: reported ones, most reports first. hidden: held or hidden. */
const views = ["newest", "reported", "hidden"] as const;
type View = (typeof views)[number];

function parseView(value: unknown): View {
  return views.find((view) => view === value) ?? "newest";
}

function pageHref(view: View, page = 1): string {
  const params = new URLSearchParams();
  if (view !== "newest") params.set("view", view);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${adminRoutes.comments}?${query}` : adminRoutes.comments;
}

async function getComments(view: View, page: number) {
  const supabase = await createClient();
  // Two paths lead from comments to profiles (the author, and the reporters through
  // comment_reports), so the author's is named by its foreign key.
  let query = supabase
    .from("comments")
    .select(
      "id, body, status, held, report_count, parent_id, created_at, author:profiles!comments_user_id_fkey(id, display_name, banned, role), article:articles(title, slug, category_slug)",
      { count: "exact" },
    )
    .is("deleted_at", null);
  if (view === "reported") {
    query = query.gt("report_count", 0).order("report_count", { ascending: false });
  } else if (view === "hidden") {
    query = query.eq("status", "hidden");
  }
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error && error.code !== "PGRST103") {
    throw error;
  }
  return { comments: data ?? [], total: count ?? 0 };
}

export default async function AdminCommentsPage({ searchParams }: PageProps<"/admin/comments">) {
  await requireStaff();
  const params = await searchParams;
  const view = parseView(params.view);
  const pageNumber = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const { comments, total } = await getComments(view, page);

  return (
    <>
      <AdminPageHeader title={t("admin.nav.comments")} intro={t("admin.comments.intro")} />

      <div className="mb-6">
        <FilterLinks
          label={t("admin.comments.viewFilter")}
          align="start"
          options={views.map((option) => ({
            key: option,
            label: t(`admin.comments.views.${option}`),
            href: pageHref(option),
            active: view === option,
          }))}
        />
      </div>

      {comments.length === 0 ? (
        <p className="border border-line p-8 text-center text-muted">{t("admin.comments.empty")}</p>
      ) : (
        <ul aria-label={t("admin.comments.list")} className="border border-line">
          {comments.map((comment) => {
            const author = comment.author;
            const visible = comment.status === "visible";
            return (
              <li
                key={comment.id}
                className={cx(
                  "flex flex-col gap-3 border-t border-line p-4 first:border-t-0 lg:p-5",
                  !visible && "bg-stone",
                )}
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">{author?.display_name ?? "—"}</span>
                  {author?.banned && <Tag variant="ink">{t("admin.comments.banned")}</Tag>}
                  {author && author.role !== "reader" && <Tag>{t("admin.comments.staff")}</Tag>}
                  <span className="font-mono text-xs text-muted">
                    {formatDateTime(comment.created_at)}
                  </span>
                  {comment.parent_id && (
                    <span className="font-mono text-xs text-muted">
                      · {t("admin.comments.reply")}
                    </span>
                  )}
                </div>
                <p className="line-clamp-4 text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                  {comment.body}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {comment.article && (
                    <a
                      href={`${articlePath(comment.article.category_slug, comment.article.slug)}#comments`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center text-accent underline underline-offset-4"
                    >
                      {comment.article.title}
                    </a>
                  )}
                  {comment.report_count > 0 && (
                    <Tag variant="lime">
                      {t("admin.comments.reports", { count: comment.report_count })}
                    </Tag>
                  )}
                  {!visible && (
                    <Tag variant="outline">
                      {comment.held ? t("admin.comments.held") : t("admin.comments.hidden")}
                    </Tag>
                  )}
                </div>
                {author && (
                  <CommentActions
                    commentId={comment.id}
                    visible={visible}
                    author={{
                      id: author.id,
                      name: author.display_name ?? "—",
                      banned: author.banned,
                      isReader: author.role === "reader",
                    }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={Math.ceil(total / PAGE_SIZE)}
        hrefFor={(next) => pageHref(view, next)}
      />
    </>
  );
}
