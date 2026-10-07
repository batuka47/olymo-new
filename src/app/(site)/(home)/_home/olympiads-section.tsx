import { ArticleCard } from "@/components/site/article-card";
import { HorizontalScroller } from "@/components/site/horizontal-scroller";
import { SectionHeader } from "@/components/ui/section-header";
import type { ArticleSummary } from "@/lib/articles/public";
import { t } from "@/lib/i18n";

interface OlympiadsSectionProps {
  index: number;
  /** The first category with olympiad fields (see olympiadSectionTitle). */
  title: string;
  articles: ArticleSummary[];
}

/** The dark band: open olympiads, closing soonest first, in a sideways scroller. */
export function OlympiadsSection({ index, title, articles }: OlympiadsSectionProps) {
  return (
    <section className="bg-ink py-10 text-paper lg:pt-18 lg:pb-20">
      <HorizontalScroller
        labels={{ previous: t("scroller.previous"), next: t("scroller.next") }}
        header={
          <>
            <SectionHeader index={index} title={title} onInk />
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
