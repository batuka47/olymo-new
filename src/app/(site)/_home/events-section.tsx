import Link from "next/link";
import { SectionHeader } from "@/components/ui/section-header";
import { Tag } from "@/components/ui/tag";
import { categoryPath } from "@/config/categories";
import { ulaanbaatarDate } from "@/lib/dates";
import { eventPath, type EventSummary } from "@/lib/events";
import { t } from "@/lib/i18n";

function EventRow({ event }: { event: EventSummary }) {
  const [, month, day] = ulaanbaatarDate(event.starts_at).split("-");
  const details = [event.location, event.price_text].filter(Boolean);
  return (
    <li className="border-t border-line">
      <Link
        href={eventPath(event.slug)}
        className="group flex items-center gap-4 py-4 lg:grid lg:grid-cols-[140px_1fr_220px_160px] lg:gap-6 lg:px-8 lg:py-6"
      >
        <span className="flex w-16 shrink-0 flex-col items-center border border-ink py-2 lg:w-auto lg:items-start lg:gap-0.5 lg:border-0 lg:py-0">
          <span className="font-display text-2xl leading-none font-bold lg:text-[40px]">{day}</span>
          <span className="mt-1 font-mono text-[9px] uppercase lg:mt-0 lg:text-[11px] lg:tracking-[0.08em] lg:text-muted">
            {t("home.events.month", { month: Number(month) })}
          </span>
        </span>
        <span className="flex min-w-0 flex-col gap-1 lg:gap-2">
          {event.event_type && (
            // Tag sets its own display, so the phone-only hiding sits on a wrapper.
            <span className="hidden lg:block">
              <Tag variant={event.is_featured ? "accent" : "ink"}>{event.event_type}</Tag>
            </span>
          )}
          <span className="text-base font-semibold group-hover:underline lg:text-xl">
            {event.title}
          </span>
          {details.length > 0 && (
            <span className="text-[13px] text-muted lg:hidden">{details.join(" · ")}</span>
          )}
        </span>
        <span className="hidden text-[15px] text-graphite lg:block">{event.location}</span>
        {event.price_text && (
          <span className="hidden justify-self-end border border-ink px-3 py-2 font-mono text-[13px] lg:block">
            {event.price_text}
          </span>
        )}
      </Link>
    </li>
  );
}

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
          <EventRow key={event.id} event={event} />
        ))}
      </ul>
    </section>
  );
}
