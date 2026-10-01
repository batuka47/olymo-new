import { ArticleGrid } from "@/components/site/article-grid";
import type { ArticleSummary } from "@/lib/articles/public";
import { t } from "@/lib/i18n";

export function RelatedArticles({ articles }: { articles: ArticleSummary[] }) {
  return (
    <section aria-labelledby="related-title" className="border-t border-line">
      <h2
        id="related-title"
        className="py-6 font-display text-[22px] font-bold lg:px-8 lg:pt-8 lg:text-2xl"
      >
        {t("article.related")}
      </h2>
      <ArticleGrid articles={articles} />
    </section>
  );
}
