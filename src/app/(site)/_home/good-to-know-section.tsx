import Link from "next/link";
import { ArticleCard } from "@/components/site/article-card";
import { SectionHeader } from "@/components/ui/section-header";
import type { ArticleSummary } from "@/lib/articles/public";
import { articlePath } from "@/lib/articles/status";
import { cx } from "@/lib/cx";
import { formatShortDate } from "@/lib/dates";
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
        {articles.length > 0 && (
          <ol>
            {articles.map((article, position) => (
              <li key={article.id} className="border-t border-line">
                <Link
                  href={articlePath(article.category_slug, article.slug)}
                  className="group grid grid-cols-[32px_1fr] gap-2.5 py-4 lg:grid-cols-[56px_1fr_90px] lg:items-center lg:gap-4 lg:py-5.5"
                >
                  <span
                    aria-hidden="true"
                    className="pt-0.5 font-mono text-xs text-muted lg:pt-0 lg:text-[13px]"
                  >
                    {String(position + 1).padStart(2, "0")}
                  </span>
                  <span className="flex flex-col gap-1 lg:contents">
                    <span className="text-base leading-[1.35] font-semibold group-hover:underline lg:text-[19px]">
                      {article.title}
                    </span>
                    {article.publish_at && (
                      <span className="font-mono text-[11px] text-muted lg:text-right lg:text-xs">
                        {formatShortDate(article.publish_at)}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
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
