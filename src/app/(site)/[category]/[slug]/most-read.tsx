import Link from "next/link";
import { articlePath } from "@/lib/articles/status";
import type { ArticleCard } from "@/lib/articles/public";
import { t } from "@/lib/i18n";

export function MostRead({ articles }: { articles: ArticleCard[] }) {
  return (
    <section aria-labelledby="most-read-title">
      <h2 id="most-read-title" className="pb-3 font-mono text-xs tracking-[0.08em] uppercase">
        {t("article.mostRead")}
      </h2>
      <ol>
        {articles.map((article, index) => (
          <li key={article.id} className="border-t border-line">
            <Link
              href={articlePath(article.category_slug, article.slug)}
              className="grid grid-cols-[32px_1fr] gap-2 py-3.5 hover:underline"
            >
              <span aria-hidden="true" className="font-mono text-xs text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[15px] leading-[1.4] font-semibold">{article.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
