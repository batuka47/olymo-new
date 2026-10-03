import Link from "next/link";
import { Fragment } from "react";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";

export interface Crumb {
  label: string;
  /** Without a link the crumb is plain text (the current page's place). */
  href?: string;
}

// py-3.5 on inline links widens the tap target to 44 px without changing the line height.
const linkClasses = "py-3.5 hover:underline";

/** "Нүүр / Олимпиад / Физик": the first link plain, later links in the accent colour. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label={t("article.breadcrumb")}
      className="font-mono text-xs tracking-label text-muted uppercase"
    >
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          {index > 0 && (
            <span aria-hidden="true" className="opacity-50">
              {" / "}
            </span>
          )}
          {item.href ? (
            <Link href={item.href} className={cx(linkClasses, index > 0 && "text-accent")}>
              {item.label}
            </Link>
          ) : (
            item.label
          )}
        </Fragment>
      ))}
    </nav>
  );
}
