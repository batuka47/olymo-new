import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/site/ad-slot";
import { ArticleCard } from "@/components/site/article-card";
import { ArticleGrid } from "@/components/site/article-grid";
import { Pagination } from "@/components/site/pagination";
import { StubPage } from "@/components/site/stub-page";
import { Container } from "@/components/ui/container";
import { getCategory, isCategorySlug } from "@/config/categories";
import {
  CATEGORY_PAGE_SIZE,
  getCategoryArticles,
  getFeaturedArticle,
} from "@/lib/articles/category";
import { t } from "@/lib/i18n";
import { siteOpenGraph } from "@/lib/metadata";
import { CategoryHeader } from "./category-header";
import { hasOlympiadFilters, listViewHref, parseListView, type ListView } from "./list-view";
import { SortToggle } from "./sort-toggle";

// Rendered on each request because it reads ?subject=, ?sort= and ?page=. The database reads are
// cached for 60 s (see lib/articles/category.ts) and expired when an article is saved.

async function resolveCategory(params: PageProps<"/[category]">["params"]) {
  const { category: slug } = await params;
  return isCategorySlug(slug) ? getCategory(slug) : undefined;
}

function pageTitle(label: string, view: ListView): string {
  const title = view.subject ? `${label}: ${t(`olympiad.subjects.${view.subject}`)}` : label;
  return view.page > 1 ? t("categoryPage.pageTitle", { title, page: view.page }) : title;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[category]">): Promise<Metadata> {
  const category = await resolveCategory(params);
  const view = category && parseListView(category.slug, await searchParams);
  if (!category || !view) {
    return {};
  }
  const title = pageTitle(category.label, view);
  // The sort order is a reading preference, not a different page.
  const url = listViewHref(category.slug, { ...view, sort: "newest" });
  return {
    title,
    description: category.description,
    alternates: { canonical: url },
    openGraph: {
      ...siteOpenGraph,
      type: "website",
      url,
      title,
      description: category.description,
    },
  };
}

function EmptyState({ filteredHref }: { filteredHref: string | null }) {
  return (
    <div className="flex flex-col items-center gap-4 border-t border-line px-4 py-16 text-center lg:py-24">
      <p className="font-display text-xl font-bold lg:text-2xl">{t("categoryPage.empty")}</p>
      {filteredHref && (
        <Link
          href={filteredHref}
          className="inline-flex min-h-11 items-center font-mono text-xs tracking-label uppercase underline underline-offset-4"
        >
          {t("categoryPage.showAll")}
        </Link>
      )}
    </div>
  );
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/[category]">) {
  const category = await resolveCategory(params);
  if (!category) {
    notFound();
  }
  // Events get their own page (from the events table) in a later step.
  if (category.slug === "events") {
    return <StubPage title={category.label} />;
  }
  const view = parseListView(category.slug, await searchParams);
  if (!view) {
    notFound();
  }

  const featured = await getFeaturedArticle(category.slug);
  const { articles, total } = await getCategoryArticles({
    category: category.slug,
    subject: view.subject,
    sort: view.sort,
    page: view.page,
    excludeId: featured?.id ?? null,
  });
  const pageCount = Math.ceil(total / CATEGORY_PAGE_SIZE);
  if (view.page > Math.max(pageCount, 1)) {
    notFound();
  }
  // When the only article is in the banner, "no news yet" under it would contradict it.
  const showList = articles.length > 0 || !featured || view.subject !== null;

  return (
    <Container className="pb-16 lg:pb-24">
      <div className="border-b border-line lg:border-x">
        <CategoryHeader category={category} view={view} />

        {featured && (
          <section aria-label={t("categoryPage.featured")} className="border-t border-line">
            <ArticleCard article={featured} variant="banner" preload />
          </section>
        )}

        <div className="border-t border-line py-6 lg:p-8">
          <AdSlot size="leaderboard" />
        </div>

        {showList && (
          <section aria-labelledby="all-news-title" className="border-t border-line">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-8 pb-4 lg:px-8 lg:pt-10 lg:pb-6">
              <h2
                id="all-news-title"
                className="font-display text-2xl font-bold tracking-[-0.02em] lg:text-[32px]"
              >
                {t("categoryPage.allNews")}
              </h2>
              {hasOlympiadFilters(category.slug) && (
                <SortToggle category={category.slug} view={view} />
              )}
            </div>

            {articles.length > 0 ? (
              <ArticleGrid articles={articles} />
            ) : (
              <EmptyState
                filteredHref={
                  view.subject
                    ? listViewHref(category.slug, { ...view, subject: null, page: 1 })
                    : null
                }
              />
            )}

            <Pagination
              page={view.page}
              pageCount={pageCount}
              hrefFor={(page) => listViewHref(category.slug, { ...view, page })}
            />
          </section>
        )}
      </div>
    </Container>
  );
}
