import Link from "next/link";
import type { CategorySlug } from "@/config/categories";
import type { CategorySort } from "@/lib/articles/category";
import { cx } from "@/lib/cx";
import { t, type MessageKey } from "@/lib/i18n";
import { listViewHref, type ListView } from "./list-view";

const sorts: { value: CategorySort; labelKey: MessageKey }[] = [
  { value: "newest", labelKey: "categoryPage.sort.newest" },
  { value: "deadline", labelKey: "categoryPage.sort.deadline" },
];

export function SortToggle({ category, view }: { category: CategorySlug; view: ListView }) {
  return (
    <nav aria-label={t("categoryPage.sort.label")}>
      <ul className="flex gap-5 font-mono text-xs tracking-label uppercase">
        {sorts.map(({ value, labelKey }) => {
          const active = view.sort === value;
          return (
            <li key={value}>
              <Link
                href={listViewHref(category, { ...view, sort: value, page: 1 })}
                aria-current={active ? "page" : undefined}
                className="inline-flex min-h-11 items-center"
              >
                <span
                  className={cx(
                    "border-b-2 pb-0.75",
                    active ? "border-accent" : "border-transparent text-muted hover:text-ink",
                  )}
                >
                  {t(labelKey)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
