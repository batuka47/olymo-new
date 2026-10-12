import { ArticleGrid } from "@/components/site/article-grid";
import { SectionHeader } from "@/components/ui/section-header";
import type { ArticleSummary } from "@/lib/articles/public";

interface CardGridSectionProps {
  index: number;
  title: string;
  articles: ArticleSummary[];
}

/** "Онцлох" and "Салбар бүрээс": four cards sharing 1 px lines, rows on phones. */
export function CardGridSection({ index, title, articles }: CardGridSectionProps) {
  return (
    <section className="border-t border-line">
      <SectionHeader index={index} title={title} className="pt-10 pb-3 lg:px-8 lg:py-7" />
      <ArticleGrid articles={articles} columns={4} />
    </section>
  );
}
