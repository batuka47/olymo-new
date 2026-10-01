import { buttonClasses } from "@/components/ui/button";
import { olympiadSubjects, type OlympiadSubject } from "@/lib/articles/olympiad";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { t, type MessageKey } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/types";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

const SOON_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function isSubject(value: string | null): value is OlympiadSubject {
  return olympiadSubjects.some((subject) => subject === value);
}

export function hasOlympiadInfo(article: ArticleRow): boolean {
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

/** Deadlines less than a week away are highlighted in lime (design system rule). */
function isDeadlineSoon(deadline: string): boolean {
  const daysLeft = (new Date(`${deadline}T23:59:59+08:00`).getTime() - Date.now()) / DAY_MS;
  return daysLeft >= 0 && daysLeft < SOON_DAYS;
}

export function OlympiadInfo({ article }: { article: ArticleRow }) {
  const rows: { labelKey: MessageKey; value: string | null; highlight?: boolean }[] = [
    {
      labelKey: "olympiad.fields.subject",
      value: isSubject(article.subject) ? t(`olympiad.subjects.${article.subject}`) : null,
    },
    { labelKey: "olympiad.fields.level", value: article.level_text },
    {
      labelKey: "olympiad.fields.deadline",
      value: article.registration_deadline && formatDate(article.registration_deadline),
      highlight: Boolean(
        article.registration_deadline && isDeadlineSoon(article.registration_deadline),
      ),
    },
    {
      labelKey: "olympiad.fields.examDate",
      value: article.exam_date && formatDate(article.exam_date),
    },
    { labelKey: "olympiad.fields.audience", value: article.audience },
    { labelKey: "olympiad.fields.location", value: article.location },
    { labelKey: "olympiad.fields.fee", value: article.fee_text },
    { labelKey: "olympiad.fields.organizer", value: article.organizer },
  ];

  return (
    <section className="border border-ink">
      <h2 className="border-b border-ink bg-ink px-5 py-3 font-mono text-xs tracking-label text-paper uppercase">
        {t("article.olympiadTitle")}
      </h2>
      <dl className="divide-y divide-line">
        {rows
          .filter((row) => row.value)
          .map((row) => (
            <div key={row.labelKey} className="flex flex-col gap-1 px-5 py-3">
              <dt className="font-mono text-[11px] tracking-label text-muted uppercase">
                {t(row.labelKey)}
              </dt>
              <dd
                className={cx(
                  "self-start text-[15px]",
                  row.highlight && "bg-lime px-2 font-mono font-bold",
                )}
              >
                {row.value}
                {row.highlight && <span className="sr-only"> ({t("olympiad.deadlineSoon")})</span>}
              </dd>
            </div>
          ))}
      </dl>
      {article.registration_url && (
        <div className="border-t border-line p-5">
          <a
            href={article.registration_url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ className: "w-full" })}
          >
            {t("olympiad.register")} →
          </a>
        </div>
      )}
    </section>
  );
}
