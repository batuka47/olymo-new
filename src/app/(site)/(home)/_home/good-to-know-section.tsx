import { ArticleCard } from "@/components/site/article-card";
import { NumberedArticleList } from "@/components/site/numbered-article-list";
import { SectionHeader } from "@/components/ui/section-header";
import type { ArticleSummary } from "@/lib/articles/public";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";

interface GoodToKnowSectionProps {
  index: number;
  articles: ArticleSummary[];
  special: ArticleSummary | null;
}

/**
 * Numbered "Мэдүүштэй" list (7 columns) beside the special article (5 columns). Either may be
 * missing: a marked special article shows even when no good-to-know article is left.
 */
export function GoodToKnowSection({ index, articles, special }: GoodToKnowSectionProps) {
  return (
    <section className="grid border-t border-line lg:grid-cols-12">
      <div
        className={cx(
          "pt-10 pb-2 lg:py-14 lg:pr-12 lg:pl-8",
          special ? "lg:col-span-7 lg:border-r lg:border-line" : "lg:col-span-12",
        )}
      >
        <SectionHeader index={index} title={t("home.goodToKnow.title")} className="pb-3 lg:pb-5" />
        {articles.length > 0 && <NumberedArticleList articles={articles} />}
      </div>
      {special && (
        <div className="pt-6 pb-10 lg:col-span-5 lg:px-8 lg:py-14">
          <div className="border border-line lg:border-0">
            <ArticleCard
              article={special}
              variant="lead"
              kicker={t("home.goodToKnow.special")}
              titleLevel="h3"
            />
          </div>
        </div>
      )}
    </section>
  );
}
