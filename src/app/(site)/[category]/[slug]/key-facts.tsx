import type { ReactNode } from "react";
import { buttonClasses } from "@/components/ui/button";
import type { Article } from "@/lib/articles/public";
import { deadlineStatus, isOlympiadSubject } from "@/lib/articles/olympiad";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { t, type MessageKey } from "@/lib/i18n";

export function hasKeyFacts(article: Article): boolean {
  return [
    article.subject,
    article.level_text,
    article.registration_deadline,
    article.exam_date,
    article.audience,
    article.location,
    article.fee_text,
    article.organizer,
    article.registration_url,
  ].some(Boolean);
}

function Deadline({ date }: { date: string }) {
  const status = deadlineStatus(date);
  if (status === "closed") {
    return (
      <>
        <span className="block">{t("article.facts.deadlinePassed")}</span>
        <span className="block font-mono text-xs font-normal text-muted">{formatDate(date)}</span>
      </>
    );
  }
  return (
    <>
      <span className={cx(status === "soon" && "bg-lime px-1.5")}>{formatDate(date)}</span>
      {status === "soon" && <span className="sr-only"> ({t("olympiad.deadlineSoon")})</span>}
    </>
  );
}

/** "Гол мэдээлэл": olympiad details in a box next to (desktop) or above (mobile) the body. */
export function KeyFacts({ article }: { article: Article }) {
  const rows: { labelKey: MessageKey; value: ReactNode }[] = [
    {
      labelKey: "article.facts.subject",
      value: isOlympiadSubject(article.subject) && t(`olympiad.subjects.${article.subject}`),
    },
    { labelKey: "article.facts.level", value: article.level_text },
    {
      labelKey: "article.facts.deadline",
      value: article.registration_deadline && <Deadline date={article.registration_deadline} />,
    },
    {
      labelKey: "article.facts.examDate",
      value: article.exam_date && formatDate(article.exam_date),
    },
    { labelKey: "article.facts.audience", value: article.audience },
    { labelKey: "article.facts.location", value: article.location },
    { labelKey: "article.facts.fee", value: article.fee_text },
    { labelKey: "article.facts.organizer", value: article.organizer },
  ];
  const shownRows = rows.filter((row) => row.value);

  return (
    <section aria-labelledby="key-facts-title" className="border border-ink bg-white">
      <h2
        id="key-facts-title"
        className="bg-ink px-5 py-3.5 font-mono text-xs tracking-[0.08em] text-paper uppercase"
      >
        {t("article.facts.title")}
      </h2>
      {shownRows.length > 0 && (
        <dl>
          {shownRows.map((row, index) => (
            <div
              key={row.labelKey}
              className={cx(
                "flex justify-between gap-4 px-5 py-3.5",
                index > 0 && "border-t border-line",
              )}
            >
              <dt className="pt-0.75 font-mono text-[11px] tracking-label text-muted uppercase">
                {t(row.labelKey)}
              </dt>
              <dd className="text-right text-[15px] font-semibold">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {article.registration_url && (
        <div className="border-t border-line px-5 pt-4 pb-5">
          <a
            href={article.registration_url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ size: "field", className: "w-full" })}
          >
            {t("article.facts.register")} <span aria-hidden="true">→</span>
          </a>
        </div>
      )}
    </section>
  );
}
