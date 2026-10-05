import type { ComponentType, ReactNode, SVGProps } from "react";
import { BuildingIcon, CalendarIcon, MapPinIcon, PhoneIcon, TicketIcon } from "@/components/icons";
import { buttonClasses } from "@/components/ui/button";
import { eventPath } from "@/config/events";
import { cx } from "@/lib/cx";
import { formatEventTime } from "@/lib/events/format";
import type { EventDetail } from "@/lib/events/queries";
import { t, type MessageKey } from "@/lib/i18n";
import { telHref } from "@/lib/phone";
import { mapsHref } from "@/lib/url";

interface FactRow {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  labelKey: MessageKey;
  value: ReactNode;
}

/** "Гол мэдээлэл" for an event: who, when, where, price, phone; then register and calendar. */
export function EventFacts({ event }: { event: EventDetail }) {
  const phoneHref = event.contact_phone && telHref(event.contact_phone);
  const rows: FactRow[] = [
    {
      icon: CalendarIcon,
      labelKey: "eventPage.facts.when",
      value: formatEventTime(event.starts_at, event.ends_at),
    },
    {
      icon: MapPinIcon,
      labelKey: "eventPage.facts.where",
      value: event.location && (
        <>
          <span className="block">{event.location}</span>
          <a
            href={mapsHref(event.location)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center font-mono text-xs tracking-label text-accent uppercase underline underline-offset-4"
          >
            {t("eventPage.facts.map")} <span aria-hidden="true">↗</span>
          </a>
        </>
      ),
    },
    { icon: BuildingIcon, labelKey: "eventPage.facts.organizer", value: event.organizer },
    { icon: TicketIcon, labelKey: "eventPage.facts.price", value: event.price_text },
    {
      icon: PhoneIcon,
      labelKey: "eventPage.facts.phone",
      value: phoneHref ? (
        <a
          href={phoneHref}
          className="inline-flex min-h-11 items-center underline underline-offset-4"
        >
          {event.contact_phone}
        </a>
      ) : (
        event.contact_phone
      ),
    },
  ];

  return (
    <section aria-labelledby="event-facts-title" className="border border-ink bg-white">
      <h2
        id="event-facts-title"
        className="bg-ink px-5 py-3.5 font-mono text-xs tracking-[0.08em] text-paper uppercase"
      >
        {t("eventPage.facts.title")}
      </h2>
      <dl>
        {rows
          .filter((row) => row.value)
          .map((row, index) => (
            // A <dl> row may only hold <dt> and <dd>, so the icon sits in the <dt>, placed left.
            <div
              key={row.labelKey}
              className={cx(
                "relative flex flex-col gap-1 py-3.5 pr-5 pl-13.5",
                index > 0 && "border-t border-line",
              )}
            >
              <dt className="font-mono text-[11px] tracking-label text-muted uppercase">
                <row.icon className="absolute top-4 left-5 size-5 text-muted" />
                {t(row.labelKey)}
              </dt>
              <dd className="min-w-0 text-[15px] font-semibold">{row.value}</dd>
            </div>
          ))}
      </dl>
      <div className="flex flex-col gap-2 border-t border-line px-5 pt-4 pb-5">
        {event.registration_url && (
          <a
            href={event.registration_url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ size: "field", className: "w-full" })}
          >
            {t("eventPage.register")} <span aria-hidden="true">→</span>
          </a>
        )}
        <a
          href={`${eventPath(event.slug)}/calendar`}
          download={`${event.slug}.ics`}
          className={buttonClasses({ variant: "outline", size: "field", className: "w-full" })}
        >
          <CalendarIcon className="size-4" /> {t("eventPage.addToCalendar")}
        </a>
      </div>
    </section>
  );
}
