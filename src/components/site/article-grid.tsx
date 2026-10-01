import { ArticleCard } from "@/components/site/article-card";
import type { ArticleSummary } from "@/lib/articles/public";
import { cx } from "@/lib/cx";

/**
 * Cards in 1 (phones, as rows), 2 (md) or 3–4 (lg) columns with 1 px lines between them. Every cell
 * draws its right and bottom line; the list is 1 px wider and taller than its clipping box, so the
 * lines on the outer edges are cut off whatever the column count.
 */
interface ArticleGridProps {
  articles: ArticleSummary[];
  /** Columns from lg up; md always has 2. */
  columns?: 3 | 4;
}

export function ArticleGrid({ articles, columns = 3 }: ArticleGridProps) {
  return (
    <div className="overflow-hidden border-t border-line">
      <ul
        className={cx(
          "-mr-px -mb-px grid md:grid-cols-2",
          columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        {articles.map((article) => (
          <li key={article.id} className="border-r border-b border-line">
            <ArticleCard article={article} variant="grid" />
          </li>
        ))}
      </ul>
    </div>
  );
}
