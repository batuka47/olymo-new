import Link from "next/link";
import { ShareButtons } from "@/components/site/share-buttons";
import { categoryPath, getCategory } from "@/config/categories";
import { siteConfig } from "@/config/site";
import { isOlympiadSubject } from "@/lib/articles/olympiad";
import type { Article } from "@/lib/articles/public";
import { readingMinutes } from "@/lib/articles/reading-time";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { t } from "@/lib/i18n";

// py-3.5 on inline links widens the tap target to 44 px without changing the line height.
const crumbLinkClasses = "py-3.5 hover:underline";

function Separator() {
  return (
    <span aria-hidden="true" className="opacity-50">
      {" / "}
    </span>
  );
}

function Breadcrumb({ article }: { article: Article }) {
  const category = getCategory(article.category_slug);
  return (
    <nav
      aria-label={t("article.breadcrumb")}
      className="font-mono text-xs tracking-label text-muted uppercase"
    >
      <Link href="/" className={crumbLinkClasses}>
        {t("article.home")}
      </Link>
      {category && (
        <>
          <Separator />
          <Link href={categoryPath(category.slug)} className={cx(crumbLinkClasses, "text-accent")}>
            {category.label}
          </Link>
        </>
      )}
      {isOlympiadSubject(article.subject) && (
        <>
          <Separator />
          {t(`olympiad.subjects.${article.subject}`)}
        </>
      )}
    </nav>
  );
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
      <Breadcrumb article={article} />
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
