import Link from "next/link";
import type { Category, CategorySlug } from "@/config/categories";
import { olympiadSubjects, type OlympiadSubject } from "@/lib/articles/olympiad";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import { hasOlympiadFilters, listViewHref, type ListView } from "./list-view";

/** "Бусад" has no button; ?subject=other still works for links. */
const filterSubjects = olympiadSubjects.filter((subject) => subject !== "other");

function SubjectFilter({ category, view }: { category: CategorySlug; view: ListView }) {
  const options: (OlympiadSubject | null)[] = [null, ...filterSubjects];
  return (
    <nav aria-label={t("categoryPage.subjectFilter")}>
      <ul className="flex flex-wrap gap-1.5 lg:justify-end">
        {options.map((subject) => {
          const active = view.subject === subject;
          return (
            <li key={subject ?? "all"}>
              <Link
                href={listViewHref(category, { ...view, subject, page: 1 })}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "inline-flex h-11 items-center px-3.5 font-mono text-xs tracking-wider uppercase transition-colors",
                  active ? "bg-ink text-paper" : "border border-ink hover:bg-ink hover:text-paper",
                )}
              >
                {subject ? t(`olympiad.subjects.${subject}`) : t("categoryPage.allSubjects")}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface CategoryHeaderProps {
  category: Category & { slug: CategorySlug };
  view: ListView;
}

export function CategoryHeader({ category, view }: CategoryHeaderProps) {
  // The row wraps instead of shrinking the title, so a word is never split: the filters move below.
  return (
    <header className="flex flex-col gap-8 py-10 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between lg:gap-x-6 lg:gap-y-6 lg:px-12 lg:pt-16 lg:pb-10">
      <div className="flex flex-col gap-4">
        <p className="font-mono text-xs tracking-[0.08em] text-muted uppercase">
          [ {t("categoryPage.label")} ]
        </p>
        <h1 className="font-display text-[44px] leading-[0.95] font-extrabold tracking-[-0.04em] lg:text-8xl">
          {category.label}
        </h1>
        <p className="text-[17px] leading-normal text-graphite lg:text-[19px]">
          {category.description}
        </p>
      </div>
      {hasOlympiadFilters(category.slug) && <SubjectFilter category={category.slug} view={view} />}
    </header>
  );
}
