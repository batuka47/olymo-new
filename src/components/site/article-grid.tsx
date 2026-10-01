import { ArticleCard } from "@/components/site/article-card";
import type { ArticleSummary } from "@/lib/articles/public";

/**
 * Cards in 1 (phones, as rows), 2 (md) or 3 (lg) columns with 1 px lines between them. Every cell
 * draws its right and bottom line; the list is 1 px wider and taller than its clipping box, so the
 * lines on the outer edges are cut off whatever the column count.
 */
export function ArticleGrid({ articles }: { articles: ArticleSummary[] }) {
  return (
    <div className="overflow-hidden border-t border-line">
      <ul className="-mr-px -mb-px grid md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <li key={article.id} className="border-r border-b border-line">
            <ArticleCard article={article} variant="grid" />
          </li>
        ))}
      </ul>
    </div>
  );
}
