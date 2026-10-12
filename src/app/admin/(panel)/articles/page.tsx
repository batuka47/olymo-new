import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ArticleStateBadge } from "@/components/admin/article-state-badge";
import { buttonClasses } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { Tag } from "@/components/ui/tag";
import { TextField } from "@/components/ui/text-field";
import { adminRoutes } from "@/config/admin";
import { findCategoryIn, isArticleCategory, type Category } from "@/config/categories";
import {
  articlePath,
  articleState,
  articleStateLabelKeys,
  articleStates,
  isArticleState,
  publicStatuses,
  type ArticleState,
} from "@/lib/articles/status";
import { requireStaff } from "@/lib/auth/staff";
import { getCategories } from "@/lib/categories/queries";
import { formatDateTime } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { ArticleRowActions } from "./article-row-actions";
import { RefreshSiteButton } from "./refresh-site-button";

export const metadata: Metadata = { title: t("admin.articles.title") };

const PAGE_SIZE = 20;

interface ArticleFilters {
  state: ArticleState | null;
  category: string | null;
  query: string;
  page: number;
}

function readFilters(
  params: Record<string, string | string[] | undefined>,
  categories: Category[],
): ArticleFilters {
  const value = (key: string) => {
    const param = params[key];
    return typeof param === "string" ? param : "";
  };
  const status = value("status");
  const category = value("category");
  const page = Number.parseInt(value("page"), 10);
  return {
    state: isArticleState(status) ? status : null,
    category: findCategoryIn(categories, category) ? category : null,
    query: value("q").trim().slice(0, 100),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

function filtersToSearch(filters: ArticleFilters, page: number): string {
  const search = new URLSearchParams();
  if (filters.state) search.set("status", filters.state);
  if (filters.category) search.set("category", filters.category);
  if (filters.query) search.set("q", filters.query);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** LIKE wildcards in the search text are matched literally. */
function likePattern(text: string): string {
  return `%${text.replace(/[\\%_*]/g, (char) => (char === "*" ? "" : `\\${char}`))}%`;
}

async function getArticles(filters: ArticleFilters) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  let query = supabase
    .from("articles")
    .select(
      "id, title, slug, category_slug, status, publish_at, is_featured, is_good_to_know, is_breaking, is_special",
      { count: "exact" },
    );

  if (filters.state === "draft") query = query.eq("status", "draft");
  if (filters.state === "scheduled")
    query = query.in("status", publicStatuses).gt("publish_at", now);
  if (filters.state === "published")
    query = query.in("status", publicStatuses).lte("publish_at", now);
  // Main or secondary, as on the public category page.
  if (filters.category) query = query.contains("category_slugs", [filters.category]);
  if (filters.query) query = query.ilike("title", likePattern(filters.query));

  const from = (filters.page - 1) * PAGE_SIZE;
  const { data, count } = await query
    .order("updated_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  return { articles: data ?? [], total: count ?? 0 };
}

const cellClasses = "px-4 py-4 align-top";

export default async function AdminArticlesPage({ searchParams }: PageProps<"/admin/articles">) {
  await requireStaff();
  const categories = await getCategories();
  const filters = readFilters(await searchParams, categories);
  const { articles, total } = await getArticles(filters);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const now = new Date();

  return (
    <>
      <AdminPageHeader
        title={t("admin.articles.title")}
        actions={
          <div className="flex flex-wrap items-start gap-3">
            <RefreshSiteButton />
            <Link href={`${adminRoutes.articles}/new`} className={buttonClasses({ size: "lg" })}>
              + {t("admin.articles.new")}
            </Link>
          </div>
        }
      />

      <form
        role="search"
        aria-label={t("admin.articles.filters.label")}
        className="mb-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_11rem_12rem_auto] md:items-end"
      >
        <TextField
          label={t("admin.articles.filters.search")}
          name="q"
          type="search"
          defaultValue={filters.query}
        />
        <SelectField
          label={t("admin.articles.filters.status")}
          name="status"
          defaultValue={filters.state ?? ""}
          options={[
            { value: "", label: t("admin.articles.filters.all") },
            ...articleStates.map((state) => ({
              value: state,
              label: t(articleStateLabelKeys[state]),
            })),
          ]}
        />
        <SelectField
          label={t("admin.articles.filters.category")}
          name="category"
          defaultValue={filters.category ?? ""}
          options={[
            { value: "", label: t("admin.articles.filters.all") },
            ...categories.filter(isArticleCategory).map((category) => ({
              value: category.slug,
              label: category.label,
            })),
          ]}
        />
        <div className="flex gap-2">
          <button type="submit" className={buttonClasses({ variant: "ink", size: "field" })}>
            {t("admin.articles.filters.apply")}
          </button>
          <Link
            href={adminRoutes.articles}
            className={buttonClasses({ variant: "outline", size: "field" })}
          >
            {t("admin.articles.filters.reset")}
          </Link>
        </div>
      </form>

      <p className="mb-3 font-mono text-[11px] tracking-label text-muted uppercase">
        {t("admin.articles.total")}: {total}
      </p>

      {articles.length === 0 ? (
        <p className="border border-line p-8 text-center text-muted">{t("admin.articles.empty")}</p>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-240 border-collapse text-left text-sm">
            <thead className="font-mono text-[11px] tracking-label text-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-normal">
                  {t("admin.articles.columns.title")}
                </th>
                <th scope="col" className="px-4 py-3 font-normal">
                  {t("admin.articles.columns.category")}
                </th>
                <th scope="col" className="px-4 py-3 font-normal">
                  {t("admin.articles.columns.status")}
                </th>
                <th scope="col" className="px-4 py-3 font-normal">
                  {t("admin.articles.columns.date")}
                </th>
                <th scope="col" className="px-4 py-3 font-normal">
                  {t("admin.articles.columns.flags")}
                </th>
                <th scope="col" className="px-4 py-3 font-normal">
                  {t("admin.articles.columns.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => {
                const state = articleState(article.status, article.publish_at, now);
                return (
                  <tr key={article.id} className="border-t border-line">
                    <td className={`${cellClasses} max-w-80`}>
                      <Link
                        href={`${adminRoutes.articles}/${article.id}`}
                        className="text-[15px] font-semibold hover:underline"
                      >
                        {article.title}
                      </Link>
                      <p className="mt-1 truncate font-mono text-[11px] text-muted">
                        {article.slug}
                      </p>
                    </td>
                    <td className={cellClasses}>
                      {findCategoryIn(categories, article.category_slug)?.label}
                    </td>
                    <td className={cellClasses}>
                      <ArticleStateBadge state={state} />
                    </td>
                    <td className={`${cellClasses} whitespace-nowrap`}>
                      {article.publish_at ? formatDateTime(article.publish_at) : "—"}
                    </td>
                    <td className={cellClasses}>
                      <div className="flex flex-wrap gap-1">
                        {article.is_featured && <Tag>{t("admin.articles.flags.featured")}</Tag>}
                        {article.is_good_to_know && (
                          <Tag>{t("admin.articles.flags.goodToKnow")}</Tag>
                        )}
                        {article.is_breaking && (
                          <Tag variant="lime">{t("admin.articles.flags.breakingShort")}</Tag>
                        )}
                        {article.is_special && (
                          <Tag variant="ink">{t("admin.articles.flags.specialShort")}</Tag>
                        )}
                      </div>
                    </td>
                    <td className={cellClasses}>
                      <ArticleRowActions
                        id={article.id}
                        title={article.title}
                        publicPath={
                          state === "published"
                            ? articlePath(article.category_slug, article.slug)
                            : null
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <nav
          aria-label={t("admin.articles.pagination.label")}
          className="mt-6 flex items-center justify-between gap-4"
        >
          {filters.page > 1 ? (
            <Link
              href={`${adminRoutes.articles}${filtersToSearch(filters, filters.page - 1)}`}
              className={buttonClasses({ variant: "outline" })}
            >
              ← {t("admin.articles.pagination.previous")}
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-xs text-muted">
            {t("admin.articles.pagination.page")} {filters.page} / {pageCount}
          </span>
          {filters.page < pageCount ? (
            <Link
              href={`${adminRoutes.articles}${filtersToSearch(filters, filters.page + 1)}`}
              className={buttonClasses({ variant: "outline" })}
            >
              {t("admin.articles.pagination.next")} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
