import { FilterLinks } from "@/components/site/filter-links";
import { olympiadSubjects, type OlympiadSubject } from "@/lib/articles/olympiad";
import { t } from "@/lib/i18n";
import { listViewHref, type ListView } from "./list-view";

/** "Бусад" has no button; ?subject=other still works for links. */
const filterSubjects = olympiadSubjects.filter((subject) => subject !== "other");

export function SubjectFilter({ category, view }: { category: string; view: ListView }) {
  const options: (OlympiadSubject | null)[] = [null, ...filterSubjects];
  return (
    <FilterLinks
      label={t("categoryPage.subjectFilter")}
      options={options.map((subject) => ({
        key: subject ?? "all",
        label: subject ? t(`olympiad.subjects.${subject}`) : t("categoryPage.allSubjects"),
        href: listViewHref(category, { ...view, subject, page: 1 }),
        active: view.subject === subject,
      }))}
    />
  );
}
