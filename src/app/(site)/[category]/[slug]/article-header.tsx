import { Breadcrumb, type Crumb } from "@/components/site/breadcrumb";
import { ShareButtons } from "@/components/site/share-buttons";
import { categoryPath, getCategory } from "@/config/categories";
import { siteConfig } from "@/config/site";
import { toCoverPosition } from "@/lib/articles/cover";
import { isOlympiadSubject } from "@/lib/articles/olympiad";
import type { Article } from "@/lib/articles/public";
import { readingMinutes } from "@/lib/articles/reading-time";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { ArticleCover } from "./article-cover";

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

/**
 * Breadcrumb, title, excerpt and byline. The cover goes over the title, beside it (stacked under
 * the excerpt on phones) or, by default, under the header at the top of the text (ArticleBody).
 */
export function ArticleHeader({ article, path }: { article: Article; path: string }) {
  const position = toCoverPosition(article.cover_position);
  const beside = Boolean(article.cover_path) && position === "beside";

  return (
    <header
      className={cx(
        "grid gap-6 py-8 lg:px-12 lg:pt-14 lg:pb-10",
        beside && "lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-12",
      )}
    >
      <div className={cx("flex flex-col gap-6", beside && "lg:self-center")}>
        <ArticleBreadcrumb article={article} />
        {position === "above" && (
          <ArticleCover
            article={article}
            sizes="(min-width: 1440px) 1214px, (min-width: 1024px) calc(100vw - 226px), 100vw"
            imageClassName="lg:aspect-[2/1]"
          />
        )}
        <h1 className="max-w-260 font-display text-[30px] leading-[1.1] font-bold tracking-display lg:text-[54px] lg:leading-[1.08]">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="max-w-205 text-lg leading-normal text-graphite lg:text-[21px]">
            {article.excerpt}
          </p>
        )}
      </div>
      {beside && (
        <ArticleCover
          article={article}
          sizes="(min-width: 1024px) 490px, 100vw"
          className="lg:self-center"
        />
      )}
      <div
        className={cx(
          "flex flex-col gap-5 border-t border-line pt-5 lg:flex-row lg:items-center lg:justify-between",
          beside && "lg:col-span-2",
        )}
      >
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
