import { ArticleCard } from "@/components/site/article-card";
import { HorizontalScroller } from "@/components/site/horizontal-scroller";
import { SectionHeader } from "@/components/ui/section-header";
import type { ArticleSummary } from "@/lib/articles/public";
import { t } from "@/lib/i18n";

interface OlympiadsSectionProps {
  index: number;
  articles: ArticleSummary[];
}

/** The dark band: open olympiads, closing soonest first, in a sideways scroller. */
export function OlympiadsSection({ index, articles }: OlympiadsSectionProps) {
  return (
    <section className="bg-ink py-10 text-paper lg:pt-18 lg:pb-20">
      <HorizontalScroller
        header={
          <>
            <SectionHeader index={index} title={t("home.olympiads.title")} onInk />
            <p className="mt-2 text-sm text-fog lg:mt-3.5 lg:text-[17px]">
              {t("home.olympiads.description")}
            </p>
          </>
        }
      >
        {articles.map((article) => (
          <li key={article.id} className="w-65 shrink-0 snap-start lg:w-75">
            <ArticleCard article={article} variant="olympiad" />
          </li>
        ))}
      </HorizontalScroller>
    </section>
  );
}
