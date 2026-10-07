import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryHeader } from "@/components/site/category-header";
import { EventCard } from "@/components/site/event-card";
import { FilterLinks } from "@/components/site/filter-links";
import { Pagination } from "@/components/site/pagination";
import { Container } from "@/components/ui/container";
import type { Category } from "@/config/categories";
import { getEventsSection } from "@/lib/categories/queries";
import { EVENTS_PAGE_SIZE, getEventList, type EventListQuery } from "@/lib/events/queries";
import { t } from "@/lib/i18n";
import { siteOpenGraph } from "@/lib/metadata";
import { eventListHref } from "./list-view";

function pageTitle(section: Category, view: EventListQuery): string {
  const parts: string[] = [section.label];
  if (view.when === "past") {
    parts.push(t("eventsPage.past"));
  }
  if (view.featuredOnly) {
    parts.push(t("eventsPage.featured"));
  }
  const title = parts.join(" · ");
  return view.page > 1 ? t("categoryPage.pageTitle", { title, page: view.page }) : title;
}

export async function eventListMetadata(view: EventListQuery): Promise<Metadata> {
  const section = await getEventsSection();
  const title = pageTitle(section, view);
  const url = eventListHref(view);
  return {
    title,
    description: section.description,
    alternates: { canonical: url },
    openGraph: { ...siteOpenGraph, type: "website", url, title, description: section.description },
  };
}

/**
 * The events page for `view`. The plain /events is static (./page.tsx); filtered and later pages
 * render on request (../list-views/events/page.tsx). The database reads are cached for 60 s (see
 * lib/events/queries.ts) and expired when an event is saved.
 */
export async function EventList({ view }: { view: EventListQuery }) {
  const [section, { events, total }] = await Promise.all([getEventsSection(), getEventList(view)]);
  const pageCount = Math.ceil(total / EVENTS_PAGE_SIZE);
  if (view.page > Math.max(pageCount, 1)) {
    notFound();
  }
  const listTitle =
    view.when === "past" ? t("eventsPage.pastTitle") : t("eventsPage.upcomingTitle");

  return (
    <Container className="pb-16 lg:pb-24">
      <div className="border-b border-line lg:border-x">
        <CategoryHeader title={section.label} description={section.description}>
          <div className="flex flex-col gap-2 lg:items-end">
            <FilterLinks
              label={t("eventsPage.whenFilter")}
              options={(["upcoming", "past"] as const).map((when) => ({
                key: when,
                label: t(when === "past" ? "eventsPage.past" : "eventsPage.upcoming"),
                href: eventListHref({ ...view, when, page: 1 }),
                active: view.when === when,
              }))}
            />
            <FilterLinks
              label={t("eventsPage.featuredFilter")}
              options={[true, false].map((featuredOnly) => ({
                key: featuredOnly ? "featured" : "all",
                label: t(featuredOnly ? "eventsPage.featured" : "eventsPage.all"),
                href: eventListHref({ ...view, featuredOnly, page: 1 }),
                active: view.featuredOnly === featuredOnly,
              }))}
            />
          </div>
        </CategoryHeader>

        <section aria-labelledby="events-list-title" className="border-t border-line">
          <h2
            id="events-list-title"
            className="pt-8 pb-4 font-display text-2xl font-bold tracking-[-0.02em] lg:px-8 lg:pt-10 lg:pb-6 lg:text-[32px]"
          >
            {listTitle}
          </h2>

          {events.length > 0 ? (
            <ul className="flex flex-col gap-4 pb-6 lg:gap-0 lg:pb-0">
              {events.map((event) => (
                <li key={event.id} className="lg:border-t lg:border-line">
                  <EventCard event={event} variant="list" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-4 border-t border-line px-4 py-16 text-center lg:py-24">
              <p className="font-display text-xl font-bold lg:text-2xl">{t("eventsPage.empty")}</p>
              {view.featuredOnly && (
                <Link
                  href={eventListHref({ ...view, featuredOnly: false, page: 1 })}
                  className="inline-flex min-h-11 items-center font-mono text-xs tracking-label uppercase underline underline-offset-4"
                >
                  {t("eventsPage.showAll")}
                </Link>
              )}
            </div>
          )}

          <Pagination
            page={view.page}
            pageCount={pageCount}
            hrefFor={(page) => eventListHref({ ...view, page })}
          />
        </section>
      </div>
    </Container>
  );
}
