import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";

interface PaginationProps {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}

type PageItem = number | "gap";

/** First, last, and the pages around the current one, with "…" where pages are skipped. */
function pageItems(page: number, pageCount: number): PageItem[] {
  const shown = new Set([1, pageCount, page - 1, page, page + 1]);
  if (page === 1) {
    shown.add(3);
  }
  if (page === pageCount) {
    shown.add(pageCount - 2);
  }

  const pages = [...shown].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  return pages.flatMap((n, index) => (index > 0 && n - pages[index - 1] > 1 ? ["gap", n] : [n]));
}

const numberClasses = "inline-flex size-11 items-center justify-center font-mono text-[13px]";

/** Real links (?page=N), so every page can be opened, shared and crawled. Hidden for one page. */
export function Pagination({ page, pageCount, hrefFor }: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }
  const previous = (
    <>
      <span aria-hidden="true">←</span> {t("pagination.previous")}
    </>
  );
  const next = (
    <>
      {t("pagination.next")} <span aria-hidden="true">→</span>
    </>
  );

  return (
    <nav
      aria-label={t("pagination.label")}
      className="flex items-center justify-between gap-3 border-t border-line py-5 lg:px-8"
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={buttonClasses({ variant: "outline" })}>
          {previous}
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={buttonClasses({
            variant: "outline",
            className: "pointer-events-none opacity-40",
          })}
        >
          {previous}
        </span>
      )}

      <ol className="hidden gap-1.5 sm:flex">
        {pageItems(page, pageCount).map((item, index) => (
          <li key={item === "gap" ? `gap-${index}` : item}>
            {item === "gap" ? (
              <span className={numberClasses}>…</span>
            ) : item === page ? (
              <span aria-current="page" className={cx(numberClasses, "bg-ink text-paper")}>
                <span className="sr-only">{t("pagination.page", { page: item })}: </span>
                {item}
              </span>
            ) : (
              <Link
                href={hrefFor(item)}
                aria-label={t("pagination.page", { page: item })}
                className={cx(numberClasses, "border border-line hover:border-ink")}
              >
                {item}
              </Link>
            )}
          </li>
        ))}
      </ol>
      <span className="font-mono text-[13px] sm:hidden">
        {t("pagination.status", { page, pages: pageCount })}
      </span>

      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} rel="next" className={buttonClasses({})}>
          {next}
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={buttonClasses({ className: "pointer-events-none opacity-40" })}
        >
          {next}
        </span>
      )}
    </nav>
  );
}
