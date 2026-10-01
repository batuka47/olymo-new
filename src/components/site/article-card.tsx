import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { Tag } from "@/components/ui/tag";
import { getCategory } from "@/config/categories";
import { deadlineStatus, isOlympiadSubject, subjectGlyphs } from "@/lib/articles/olympiad";
import type { ArticleSummary } from "@/lib/articles/public";
import { articlePath } from "@/lib/articles/status";
import { cx } from "@/lib/cx";
import { formatShortDate } from "@/lib/dates";
import { t } from "@/lib/i18n";

/**
 * grid: a card from md up and a compact row on phones (lists of cards).
 * row: always the compact row (side lists).
 * banner: the featured split, image left and ink panel right, stacked on phones.
 * lead: big image, kicker chip and a display title (the home hero and its special article).
 * olympiad: ink card with the subject glyph and registration deadline (dark scrollers).
 */
export type ArticleCardVariant = "grid" | "row" | "banner" | "lead" | "olympiad";

interface ArticleCardProps {
  article: ArticleSummary;
  variant: ArticleCardVariant;
  /** For the LCP image of a page (a banner at the top). Other images load lazily. */
  preload?: boolean;
  /** lead only: the chip before the category, e.g. "Гол мэдээ". */
  kicker?: string;
  /** lead only: shown after the date when known. */
  readingMinutes?: number;
  /** lead only: h3 when the card sits inside a section that has its own h2. */
  titleLevel?: "h2" | "h3";
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

interface LeadCardProps {
  article: ArticleSummary;
  kicker?: string;
  readingMinutes?: number;
  titleLevel?: "h2" | "h3";
  preload?: boolean;
}

function LeadCard({ article, kicker, readingMinutes, titleLevel = "h2", preload }: LeadCardProps) {
  const Title = titleLevel;
  const meta = [
    article.author_name,
    article.publish_at && formatShortDate(article.publish_at),
    readingMinutes && t("articleCard.minutes", { minutes: readingMinutes }),
  ].filter(Boolean);

  return (
    <Link href={articlePath(article.category_slug, article.slug)} className="group flex flex-col">
      <Cover
        article={article}
        sizes="(min-width: 1440px) 550px, (min-width: 1024px) 40vw, 100vw"
        preload={preload}
        className="aspect-[16/10] w-full"
      />
      <div className="flex flex-col gap-2.5 px-4 pt-4.5 pb-5 lg:gap-3.5 lg:px-8 lg:pt-7 lg:pb-8">
        <div className="flex flex-wrap gap-2">
          {kicker && <Tag variant="ink">{kicker}</Tag>}
          <Tag>{cardLabel(article)}</Tag>
        </div>
        <Title className="font-display text-[19px] leading-[1.25] font-bold tracking-[-0.02em] group-hover:underline lg:text-[26px] lg:leading-[1.2]">
          {article.title}
        </Title>
        {meta.length > 0 && (
          <p className="font-mono text-[11px] text-muted lg:text-xs">{meta.join(" · ")}</p>
        )}
      </div>
    </Link>
  );
}

function OlympiadCard({ article }: { article: ArticleSummary }) {
  const subject = isOlympiadSubject(article.subject) ? article.subject : null;
  const deadline = article.registration_deadline;
  return (
    <Link
      href={articlePath(article.category_slug, article.slug)}
      className="group flex h-full flex-col gap-3.5 border border-ink-line p-4.5 text-paper transition-colors hover:border-paper lg:gap-4.5 lg:p-6"
    >
      <div className="flex justify-between gap-3 font-mono text-[10px] tracking-[0.08em] uppercase lg:text-[11px]">
        <span className="text-lime">{cardLabel(article)}</span>
        {article.level_text && <span className="text-right text-ash">{article.level_text}</span>}
      </div>
      <div
        aria-hidden="true"
        className="hidden h-30 items-center justify-center bg-coal dot-pattern lg:flex"
      >
        <span className="font-display text-[44px] font-extrabold opacity-90">
          {subjectGlyphs[subject ?? "other"]}
        </span>
      </div>
      <h3 className="min-h-[2.7em] text-[17px] leading-[1.35] font-semibold group-hover:underline lg:text-[19px]">
        {article.title}
      </h3>
      {deadline && (
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink-line pt-3 lg:pt-4">
          <span className="font-mono text-[10px] tracking-label text-ash uppercase lg:text-[11px]">
            {t("articleCard.deadline")}
          </span>
          <span
            className={cx(
              "px-1.5 py-0.75 font-mono text-xs font-bold lg:px-2 lg:py-1 lg:text-[13px]",
              deadlineStatus(deadline) === "soon" && "bg-lime text-ink",
            )}
          >
            {formatShortDate(deadline)}
            {deadlineStatus(deadline) === "soon" && (
              <span className="sr-only"> ({t("olympiad.deadlineSoon")})</span>
            )}
          </span>
        </div>
      )}
    </Link>
  );
}

export function ArticleCard({
  article,
  variant,
  preload,
  kicker,
  readingMinutes,
  titleLevel,
}: ArticleCardProps) {
  switch (variant) {
    case "banner":
      return <BannerCard article={article} preload={preload} />;
    case "lead":
      return (
        <LeadCard
          article={article}
          kicker={kicker}
          readingMinutes={readingMinutes}
          titleLevel={titleLevel}
          preload={preload}
        />
      );
    case "olympiad":
      return <OlympiadCard article={article} />;
    default:
      return <StackCard article={article} responsive={variant === "grid"} />;
  }
}
