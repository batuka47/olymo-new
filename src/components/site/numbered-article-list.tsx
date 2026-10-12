import Link from "next/link";
import type { ArticleSummary } from "@/lib/articles/public";
import { articlePath } from "@/lib/articles/status";
import { formatShortDate } from "@/lib/dates";

type ListedArticle = Pick<ArticleSummary, "id" | "slug" | "title" | "category_slug" | "publish_at">;

/** "01 Title … 09.27" rows with lines between them, as in "Мэдүүштэй" on the home page. */
export function NumberedArticleList({ articles }: { articles: ListedArticle[] }) {
  return (
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
  );
}
