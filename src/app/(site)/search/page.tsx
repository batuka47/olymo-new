import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SearchForm } from "@/components/site/search-form";
import { Container } from "@/components/ui/container";
import { routes } from "@/config/navigation";
import { t } from "@/lib/i18n";
import { pageRobots, siteOpenGraph } from "@/lib/metadata";
import { getActiveCategories } from "@/lib/categories/queries";
import { hasSearch, parseSearchView, searchHref, type SearchView } from "@/lib/search/params";
import {
  getPopularTags,
  getSearchMostRead,
  getTag,
  SEARCH_PAGE_SIZE,
  searchContent,
  type TagLink,
} from "@/lib/search/queries";
import { SearchResults } from "./search-results";
import { SearchStart } from "./search-start";

// Rendered on each request because it reads ?q=, ?category=, ?tag= and ?page=. The database reads
// are cached for 60 s (see lib/search/queries.ts) and expired when an article or event is saved.

const MOST_READ_COUNT = 5;
const POPULAR_TAG_COUNT = 12;

/** The view, and the tag it filters by; null for a view that does not exist (unknown tag too). */
async function resolveView(searchParams: PageProps<"/search">["searchParams"]) {
  const categories = await getActiveCategories();
  const view = parseSearchView(
    await searchParams,
    new Set(categories.map((category) => category.slug)),
  );
  if (!view) {
    return null;
  }
  const tag = view.tag ? await getTag(view.tag) : null;
  if (view.tag && !tag) {
    return null;
  }
  return { view, tag };
}

function pageTitle(view: SearchView, tag: TagLink | null): string {
  let title = t("searchPage.title");
  if (view.q) {
    title = t("searchPage.queryTitle", { q: view.q });
  } else if (tag) {
    title = t("searchPage.tagTitle", { tag: tag.label });
  }
  return view.page > 1 ? t("categoryPage.pageTitle", { title, page: view.page }) : title;
}

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const resolved = await resolveView(searchParams);
  if (!resolved) {
    return {};
  }
  const { view, tag } = resolved;
  const title = pageTitle(view, tag);
  const description = t("searchPage.description");
  const url = searchHref(view);
  return {
    title,
    description,
    alternates: { canonical: url },
    // Result pages are endless word combinations: crawlers may follow their links, not index them.
    robots: pageRobots(url === routes.search ? undefined : { index: false, follow: true }),
    openGraph: { ...siteOpenGraph, type: "website", url, title, description },
  };
}

function ActiveTag({ view, tag }: { view: SearchView; tag: TagLink }) {
  return (
    <p className="flex flex-wrap items-center gap-3">
      <span className="font-mono text-xs tracking-label text-muted uppercase">
        {t("searchPage.activeTag")}
      </span>
      <Link
        href={searchHref({ ...view, tag: null, page: 1 })}
        aria-label={t("searchPage.removeTag", { tag: tag.label })}
        className="inline-flex min-h-11 items-center gap-2 bg-ink px-3 font-mono text-xs tracking-wider text-paper uppercase hover:bg-accent"
      >
        #{tag.label} <span aria-hidden="true">×</span>
      </Link>
    </p>
  );
}

async function Results({ view }: { view: SearchView }) {
  const [{ results, total }, categories] = await Promise.all([
    searchContent(view),
    getActiveCategories(),
  ]);
  if (view.page > 1 && results.length === 0) {
    notFound();
  }
  const popularTags = results.length === 0 ? await getPopularTags(POPULAR_TAG_COUNT) : [];
  return (
    <SearchResults
      view={view}
      categories={categories}
      results={results}
      total={total}
      pageCount={Math.ceil(total / SEARCH_PAGE_SIZE)}
      popularTags={popularTags}
    />
  );
}

async function Start() {
  const [mostRead, popularTags] = await Promise.all([
    getSearchMostRead(MOST_READ_COUNT),
    getPopularTags(POPULAR_TAG_COUNT),
  ]);
  return <SearchStart mostRead={mostRead} popularTags={popularTags} />;
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const resolved = await resolveView(searchParams);
  if (!resolved) {
    notFound();
  }
  const { view, tag } = resolved;
  const searching = hasSearch(view);

  return (
    <Container className="pb-16 lg:pb-24">
      <div className="border-b border-line lg:border-x">
        <header className="flex flex-col gap-6 py-10 lg:gap-8 lg:px-12 lg:pt-16 lg:pb-12">
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-[44px] leading-[0.95] font-extrabold tracking-[-0.04em] lg:text-8xl">
              {t("searchPage.title")}
            </h1>
            <p className="text-[17px] leading-normal text-graphite lg:text-[19px]">
              {t("searchPage.description")}
            </p>
          </div>
          <SearchForm
            id="search-input"
            label={t("searchPage.inputLabel")}
            placeholder={t("searchPage.placeholder")}
            submitLabel={t("searchPage.submit")}
            size="large"
            defaultValue={view.q}
            keep={{ category: view.category, tag: view.tag }}
            // The header's search icon lands here: ready to type. Not over results, where focus
            // would scroll phones back to the input and open the keyboard.
            autoFocus={!searching}
          />
          {tag && <ActiveTag view={view} tag={tag} />}
        </header>

        {searching ? <Results view={view} /> : <Start />}
      </div>
    </Container>
  );
}
