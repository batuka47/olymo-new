import Link from "next/link";
import { ArticleCard } from "@/components/site/article-card";
import { EventCard } from "@/components/site/event-card";
import { FilterLinks, type FilterOption } from "@/components/site/filter-links";
import { Pagination } from "@/components/site/pagination";
import { TagLinks } from "@/components/site/tag-links";
import { articleCategories, categories } from "@/config/categories";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import { searchHref, searchTerms, type SearchView } from "@/lib/search/params";
import type { SearchResult, TagLink } from "@/lib/search/queries";

/** "Бүгд" and every category; events have no tags, so a tag search leaves "Эвентүүд" out. */
function categoryOptions(view: SearchView): FilterOption[] {
  const searchable = view.tag ? articleCategories : categories;
  return [
    {
      key: "all",
      label: t("searchPage.allCategories"),
      href: searchHref({ ...view, category: null, page: 1 }),
      active: view.category === null,
    },
    ...searchable.map((category) => ({
      key: category.slug,
      label: category.label,
      href: searchHref({ ...view, category: category.slug, page: 1 }),
      active: view.category === category.slug,
    })),
  ];
}

const suggestionLinkClasses =
  "inline-flex min-h-11 items-center font-mono text-xs tracking-label uppercase underline underline-offset-4";

function NoResults({ view, popularTags }: { view: SearchView; popularTags: TagLink[] }) {
  return (
    <div className="flex flex-col gap-6 border-t border-line py-12 lg:px-8 lg:py-16">
      <p className="font-display text-xl font-bold lg:text-2xl">
        {view.q
          ? t("searchPage.noResults.query", { q: view.q })
          : t("searchPage.noResults.filters")}
      </p>
      <div className="flex flex-col gap-2 text-[17px] text-graphite">
        <p>{t("searchPage.noResults.tipsTitle")}</p>
        <ul className="list-disc pl-6">
          <li>{t("searchPage.noResults.spelling")}</li>
          <li>{t("searchPage.noResults.shorter")}</li>
        </ul>
      </div>
      {(view.category || (view.tag && view.q)) && (
        <div className="flex flex-wrap gap-x-6">
          {view.category && (
            <Link
              href={searchHref({ ...view, category: null, page: 1 })}
              className={suggestionLinkClasses}
            >
              {t("searchPage.noResults.allCategories")}
            </Link>
          )}
          {view.tag && view.q && (
            <Link
              href={searchHref({ ...view, tag: null, page: 1 })}
              className={suggestionLinkClasses}
            >
              {t("searchPage.noResults.withoutTag")}
            </Link>
          )}
        </div>
      )}
      {popularTags.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-mono text-xs tracking-[0.08em] text-muted uppercase">
            {t("searchPage.popularTags")}
          </h3>
          <TagLinks
            tags={popularTags}
            label={t("searchPage.popularTags")}
            className="flex flex-wrap gap-2"
          />
        </div>
      )}
    </div>
  );
}

interface SearchResultsProps {
  view: SearchView;
  results: SearchResult[];
  total: number;
  pageCount: number;
  /** Suggested when nothing matches. */
  popularTags: TagLink[];
}

/** Count, category chips, the ranked rows (articles and events mixed) and page links. */
export function SearchResults({
  view,
  results,
  total,
  pageCount,
  popularTags,
}: SearchResultsProps) {
  const terms = searchTerms(view.q);
  return (
    <section aria-labelledby="search-results-title" className="border-t border-line">
      <div className="flex flex-col gap-4 pt-8 pb-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8 lg:pt-10 lg:pb-6">
        <h2
          id="search-results-title"
          className="shrink-0 font-display text-2xl font-bold tracking-[-0.02em] lg:text-[32px]"
        >
          {t("searchPage.count", { count: total })}
        </h2>
        <FilterLinks label={t("searchPage.categoryFilter")} options={categoryOptions(view)} />
      </div>

      {results.length > 0 ? (
        <ul>
          {results.map((result) => (
            <li
              key={`${result.type}-${result.type === "article" ? result.article.id : result.event.id}`}
              className={cx("border-t border-line", result.type === "article" && "lg:px-8")}
            >
              {result.type === "article" ? (
                <ArticleCard article={result.article} variant="row" highlight={terms} />
              ) : (
                <EventCard event={result.event} variant="row" highlight={terms} />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <NoResults view={view} popularTags={popularTags} />
      )}

      <Pagination
        page={view.page}
        pageCount={pageCount}
        hrefFor={(page) => searchHref({ ...view, page })}
      />
    </section>
  );
}
