import { EventCard } from "@/components/site/event-card";
import { SectionHeader } from "@/components/ui/section-header";
import { categoryPath } from "@/config/categories";
import type { EventSummary } from "@/lib/events/queries";
import { t } from "@/lib/i18n";

export function EventsSection({ index, events }: { index: number; events: EventSummary[] }) {
  return (
    <section className="border-t border-line">
      <SectionHeader
        index={index}
        title={t("home.events.title")}
        href={categoryPath("events")}
        linkLabel={t("home.events.all")}
        className="pt-10 pb-3 lg:px-8 lg:pt-12 lg:pb-7"
      />
      <ul>
        {events.map((event) => (
          <li key={event.id} className="border-t border-line">
            <EventCard event={event} variant="row" />
          </li>
        ))}
      </ul>
    </section>
  );
}
