import { ArticleCard } from "@/components/site/article-card";
import { TagLinks } from "@/components/site/tag-links";
import { SectionHeader } from "@/components/ui/section-header";
import type { ArticleSummary } from "@/lib/articles/public";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import type { TagLink } from "@/lib/search/queries";

interface SearchStartProps {
  mostRead: ArticleSummary[];
  popularTags: TagLink[];
}

/** Before anything is typed: the most read articles and the popular tags, side by side on desktop. */
export function SearchStart({ mostRead, popularTags }: SearchStartProps) {
  if (mostRead.length === 0 && popularTags.length === 0) {
    return null;
  }
  return (
    <div className="grid border-t border-line lg:grid-cols-12">
      {mostRead.length > 0 && (
        <section className="flex flex-col gap-4 pt-8 pb-4 lg:col-span-8 lg:border-r lg:border-line lg:px-8 lg:pt-10">
          <SectionHeader index={1} title={t("searchPage.mostRead")} />
          <ol>
            {mostRead.map((article) => (
              <li key={article.id} className="border-t border-line">
                <ArticleCard article={article} variant="row" />
              </li>
            ))}
          </ol>
        </section>
      )}
      {popularTags.length > 0 && (
        <section
          className={cx(
            "flex flex-col gap-6 py-8 lg:px-8 lg:pt-10",
            mostRead.length > 0
              ? "border-t border-line lg:col-span-4 lg:border-t-0"
              : "lg:col-span-12",
          )}
        >
          <SectionHeader index={mostRead.length > 0 ? 2 : 1} title={t("searchPage.popularTags")} />
          <TagLinks
            tags={popularTags}
            label={t("searchPage.popularTags")}
            className="flex flex-wrap gap-2"
          />
        </section>
      )}
    </div>
  );
}
