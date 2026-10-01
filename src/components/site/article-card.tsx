import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { Tag } from "@/components/ui/tag";
import { getCategory } from "@/config/categories";
import { deadlineStatus, isOlympiadSubject } from "@/lib/articles/olympiad";
import type { ArticleSummary } from "@/lib/articles/public";
import { articlePath } from "@/lib/articles/status";
import { cx } from "@/lib/cx";
import { formatShortDate } from "@/lib/dates";
import { t } from "@/lib/i18n";

/**
 * grid: a card from md up and a compact row on phones (lists of cards).
 * row: always the compact row (side lists).
 * banner: the featured split, image left and ink panel right, stacked on phones.
 */
export type ArticleCardVariant = "grid" | "row" | "banner";

interface ArticleCardProps {
  article: ArticleSummary;
  variant: ArticleCardVariant;
  /** For the LCP image of a page (a banner at the top). Other images load lazily. */
  preload?: boolean;
}

/** Olympiad articles are labelled with their subject, the rest with their category. */
function cardLabel(article: ArticleSummary): string {
  if (isOlympiadSubject(article.subject)) {
    return t(`olympiad.subjects.${article.subject}`);
  }
  return getCategory(article.category_slug)?.label ?? "";
}

interface CoverProps {
  article: ArticleSummary;
  sizes: string;
  preload?: boolean;
  className: string;
}

function Cover({ article, sizes, preload, className }: CoverProps) {
  if (!article.cover_path) {
    return <ImagePlaceholder className={className} />;
  }
  return (
    <ResponsiveImage
      path={article.cover_path}
      version={article.updated_at}
      // The title next to it already names the link; describing the image again adds noise.
      alt=""
      sizes={sizes}
      preload={preload}
      className={className}
    />
  );
}

/** Open registrations only; lime when fewer than 7 days are left. */
function OpenDeadline({ date, className }: { date: string; className?: string }) {
  const status = deadlineStatus(date);
  if (status === "closed") {
    return null;
  }
  return (
    <span className={cx("font-mono text-[11px] text-muted", className)}>
      {t("articleCard.deadline")} ·{" "}
      <span className={cx("text-ink", status === "soon" && "bg-lime px-1")}>
        {formatShortDate(date)}
      </span>
      {status === "soon" && <span className="sr-only"> ({t("olympiad.deadlineSoon")})</span>}
    </span>
  );
}

function StackCard({ article, responsive }: { article: ArticleSummary; responsive: boolean }) {
  return (
    <Link
      href={articlePath(article.category_slug, article.slug)}
      className={cx("group flex h-full gap-3.5 py-3.5", responsive && "md:flex-col md:p-6")}
    >
      <Cover
        article={article}
        sizes={responsive ? "(min-width: 1024px) 400px, (min-width: 768px) 50vw, 92px" : "92px"}
        className={cx("size-23 shrink-0", responsive && "md:h-50 md:w-full")}
      />
      <div
        className={cx(
          "grid min-w-0 flex-1 content-center gap-1.5",
          responsive && "md:grid-cols-[1fr_auto] md:content-start md:gap-x-4 md:gap-y-3.5",
        )}
      >
        <span
          className={cx(
            "font-mono text-[10px] tracking-label text-accent uppercase",
            responsive && "md:text-[11px]",
          )}
        >
          {cardLabel(article)}
        </span>
        <h3
          className={cx(
            "text-base leading-[1.3] font-semibold group-hover:underline",
            responsive && "md:col-span-2 md:row-start-2 md:text-[19px] md:leading-[1.35]",
          )}
        >
          {article.title}
        </h3>
        {article.publish_at && (
          <span
            className={cx(
              "font-mono text-[11px] text-muted",
              responsive && "md:col-start-2 md:row-start-1 md:tracking-label md:uppercase",
            )}
          >
            {formatShortDate(article.publish_at)}
          </span>
        )}
        {article.registration_deadline && (
          <OpenDeadline
            date={article.registration_deadline}
            className={cx(responsive && "md:col-span-2")}
          />
        )}
      </div>
    </Link>
  );
}

function BannerDeadline({ date }: { date: string }) {
  if (deadlineStatus(date) === "closed") {
    return <span className="font-mono text-xs text-ash">{t("articleCard.deadlinePassed")}</span>;
  }
  return (
    <span className="font-mono text-xs text-ash">
      {t("articleCard.deadline")} · <span className="text-lime">{formatShortDate(date)}</span>
    </span>
  );
}

function BannerCard({ article, preload }: { article: ArticleSummary; preload?: boolean }) {
  return (
    <Link
      href={articlePath(article.category_slug, article.slug)}
      className="group grid bg-ink text-paper lg:grid-cols-12"
    >
      <Cover
        article={article}
        sizes="(min-width: 1440px) 770px, (min-width: 1024px) 55vw, 100vw"
        preload={preload}
        className="aspect-video w-full lg:col-span-7 lg:aspect-auto lg:min-h-110"
      />
      <div className="flex flex-col justify-between gap-8 p-6 lg:col-span-5 lg:px-10 lg:py-12">
        <div className="flex flex-col gap-4.5">
          <Tag variant="lime" className="self-start">
            {t("articleCard.featured")}
          </Tag>
          <h2 className="font-display text-2xl leading-[1.18] font-bold tracking-[-0.02em] group-hover:underline lg:text-[32px]">
            {article.title}
          </h2>
          {article.excerpt && (
            <p className="text-base leading-[1.55] text-fog lg:text-[17px]">{article.excerpt}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink-line pt-5">
          {article.registration_deadline ? (
            <BannerDeadline date={article.registration_deadline} />
          ) : (
            <span />
          )}
          <span className="inline-flex h-11 items-center gap-2 border border-paper px-4.5 font-mono text-xs tracking-label uppercase transition-colors group-hover:bg-paper group-hover:text-ink">
            {t("articleCard.more")} <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ArticleCard({ article, variant, preload }: ArticleCardProps) {
  if (variant === "banner") {
    return <BannerCard article={article} preload={preload} />;
  }
  return <StackCard article={article} responsive={variant === "grid"} />;
}
