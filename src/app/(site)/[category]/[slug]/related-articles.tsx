import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { getCategory } from "@/config/categories";
import type { ArticleCard } from "@/lib/articles/public";
import { articlePath } from "@/lib/articles/status";
import { t } from "@/lib/i18n";

export function RelatedArticles({ articles }: { articles: ArticleCard[] }) {
  return (
    <section aria-labelledby="related-title" className="border-t border-line">
      <h2
        id="related-title"
        className="py-6 font-display text-[22px] font-bold lg:px-8 lg:pt-8 lg:text-2xl"
      >
        {t("article.related")}
      </h2>
      <ul className="grid border-t border-line md:grid-cols-3">
        {articles.map((article) => (
          <li
            key={article.id}
            className="border-line not-last:border-b md:not-last:border-r md:not-last:border-b-0"
          >
            <Link
              href={articlePath(article.category_slug, article.slug)}
              className="group flex flex-col gap-3.5 py-6 md:px-6"
            >
              {article.cover_path ? (
                <ResponsiveImage
                  path={article.cover_path}
                  version={article.updated_at}
                  alt={article.cover_alt ?? ""}
                  sizes="(min-width: 1440px) 390px, (min-width: 768px) 33vw, 100vw"
                  className="h-45 w-full"
                />
              ) : (
                <ImagePlaceholder className="h-45" />
              )}
              <span className="font-mono text-[11px] tracking-label text-accent uppercase">
                {getCategory(article.category_slug)?.label}
              </span>
              <span className="text-lg leading-[1.35] font-semibold group-hover:underline">
                {article.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
