import Link from "next/link";
import { NumberedArticleList } from "@/components/site/numbered-article-list";
import { SearchForm } from "@/components/site/search-form";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { routes } from "@/config/navigation";
import { getLatestArticles, type ArticleSummary } from "@/lib/articles/public";
import { t } from "@/lib/i18n";

// Next.js puts a not-found page into every page it can be shown on, ready for client-side
// navigation, so this stays light: text and links, no images.

const LATEST_COUNT = 4;

/** The 404 page never fails itself: without the database it just leaves the list out. */
async function latestArticles(): Promise<ArticleSummary[]> {
  try {
    return await getLatestArticles(LATEST_COUNT);
  } catch (error) {
    console.error("Loading the latest articles for the 404 page failed", error);
    return [];
  }
}

/** The huge "404", the message, a search box and the way home. */
export function NotFoundHero() {
  return (
    <section className="grid gap-6 py-10 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-20">
      <p
        aria-hidden="true"
        className="font-display text-[112px] leading-none font-extrabold tracking-display lg:col-span-5 lg:text-[200px]"
      >
        404
      </p>
      <div className="flex flex-col gap-6 lg:col-span-7 lg:justify-center">
        <h1 className="font-display text-[30px] leading-[1.1] font-bold tracking-display lg:text-[54px]">
          {t("notFound.title")}
        </h1>
        <p className="max-w-160 text-lg leading-normal text-graphite">{t("notFound.lead")}</p>
        <SearchForm
          id="not-found-search"
          label={t("notFound.searchLabel")}
          placeholder={t("notFound.searchPlaceholder")}
          submitLabel={t("notFound.searchButton")}
          className="max-w-140"
        />
        <Link
          href={routes.home}
          className="inline-flex min-h-11 items-center self-start font-mono text-xs tracking-label uppercase underline underline-offset-4"
        >
          <span aria-hidden="true">←&nbsp;</span>
          {t("notFound.home")}
        </Link>
      </div>
    </section>
  );
}

/** The site's 404: the hero, then links to the newest articles. */
export async function NotFoundContent() {
  const latest = await latestArticles();

  return (
    <Container className="pb-16 lg:pb-24">
      <div className="border-b border-line lg:border-x">
        <NotFoundHero />
        {latest.length > 0 && (
          <section aria-label={t("notFound.latest")} className="border-t border-line lg:px-8">
            <SectionHeader
              index={1}
              title={t("notFound.latest")}
              className="pt-8 pb-3 lg:pt-10 lg:pb-5"
            />
            <NumberedArticleList articles={latest} />
          </section>
        )}
      </div>
    </Container>
  );
}
