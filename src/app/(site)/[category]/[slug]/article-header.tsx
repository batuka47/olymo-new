import { Breadcrumb, type Crumb } from "@/components/site/breadcrumb";
import { ShareButtons } from "@/components/site/share-buttons";
import { categoryPath, getCategory } from "@/config/categories";
import { siteConfig } from "@/config/site";
import { isOlympiadSubject } from "@/lib/articles/olympiad";
import type { Article } from "@/lib/articles/public";
import { readingMinutes } from "@/lib/articles/reading-time";
import { formatDate } from "@/lib/dates";
import { t } from "@/lib/i18n";

function ArticleBreadcrumb({ article }: { article: Article }) {
  const category = getCategory(article.category_slug);
  const items: Crumb[] = [{ label: t("article.home"), href: "/" }];
  if (category) {
    items.push({ label: category.label, href: categoryPath(category.slug) });
  }
  if (isOlympiadSubject(article.subject)) {
    items.push({ label: t(`olympiad.subjects.${article.subject}`) });
  }
  return <Breadcrumb items={items} />;
}

function Byline({ article }: { article: Article }) {
  const meta = [
    article.publish_at && formatDate(article.publish_at),
    t("article.readingTime", { minutes: readingMinutes(article.body_html) }),
  ].filter(Boolean);

  return (
    <div className="flex items-center gap-3.5">
      {article.author_name && (
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center bg-ink font-display text-sm font-bold text-paper"
        >
          {article.author_name.charAt(0)}
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        {article.author_name && (
          <span className="text-[15px] font-semibold">{article.author_name}</span>
        )}
        <span className="font-mono text-xs text-muted">{meta.join(" · ")}</span>
      </div>
    </div>
  );
}

export function ArticleHeader({ article, path }: { article: Article; path: string }) {
  return (
    <header className="flex flex-col gap-6 py-8 lg:px-12 lg:pt-14 lg:pb-10">
      <ArticleBreadcrumb article={article} />
      <h1 className="max-w-260 font-display text-[30px] leading-[1.1] font-bold tracking-display lg:text-[54px] lg:leading-[1.08]">
        {article.title}
      </h1>
      {article.excerpt && (
        <p className="max-w-205 text-lg leading-normal text-graphite lg:text-[21px]">
          {article.excerpt}
        </p>
      )}
      <div className="flex flex-col gap-5 border-t border-line pt-5 lg:flex-row lg:items-center lg:justify-between">
        <Byline article={article} />
        <ShareButtons
          url={`${siteConfig.url}${path}`}
          title={article.title}
          facebookAppId={siteConfig.facebookAppId}
        />
      </div>
    </header>
  );
}
