import Link from "next/link";
import { Highlight } from "@/components/ui/highlight";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { Tag } from "@/components/ui/tag";
import { eventPath, eventTypeLabel } from "@/config/events";
import { cx } from "@/lib/cx";
import { ulaanbaatarDate } from "@/lib/dates";
import type { EventSummary } from "@/lib/events/queries";
import { t } from "@/lib/i18n";

/**
 * Both are the home design's row from lg up: big day and month, type badge (accent when
 * featured), title, place and a price chip.
 * row: a compact row with a 64 px date box on phones (home page).
 * list: a card with the cover on phones (/events).
 */
export type EventCardVariant = "row" | "list";

interface EventCardProps {
  event: EventSummary;
  variant: EventCardVariant;
  /** Words to mark in the title (search results). */
  highlight?: readonly string[];
}

export function EventCard({ event, variant, highlight }: EventCardProps) {
  const card = variant === "list";
  const [, month, day] = ulaanbaatarDate(event.starts_at).split("-");
  const details = [event.location, event.price_text].filter(Boolean);

  return (
    <Link
      href={eventPath(event.slug)}
      className={cx(
        "group grid lg:grid-cols-[140px_1fr_220px_160px] lg:items-center lg:gap-6 lg:px-8 lg:py-6",
        card && "border border-line bg-paper lg:border-0",
      )}
    >
      {card && event.cover_path && (
        <ResponsiveImage
          path={event.cover_path}
          alt=""
          sizes="100vw"
          className="aspect-video w-full lg:hidden"
        />
      )}
      {/* One row on phones; from lg its children become cells of the grid above. */}
      <span className={cx("flex items-center gap-4 lg:contents", card ? "p-4" : "py-4")}>
        <span className="flex w-16 shrink-0 flex-col items-center border border-ink py-2 lg:w-auto lg:items-start lg:gap-0.5 lg:border-0 lg:py-0">
          <span className="font-display text-2xl leading-none font-bold lg:text-[40px]">{day}</span>
          <span className="mt-1 font-mono text-[9px] uppercase lg:mt-0 lg:text-[11px] lg:tracking-[0.08em] lg:text-muted">
            {t("events.month", { month: Number(month) })}
          </span>
        </span>
        <span className="flex min-w-0 flex-col gap-1 lg:gap-2">
          {/* Tag sets its own display, so hiding it on home-page phones sits on a wrapper. */}
          <span className={cx(!card && "hidden lg:block")}>
            <Tag variant={event.is_featured ? "accent" : "ink"}>
              {eventTypeLabel(event.event_type)}
            </Tag>
          </span>
          <span className="text-base font-semibold group-hover:underline lg:text-xl">
            <Highlight text={event.title} terms={highlight} />
          </span>
          {details.length > 0 && (
            <span className="text-[13px] text-muted lg:hidden">{details.join(" · ")}</span>
          )}
        </span>
      </span>
      <span className="hidden text-[15px] text-graphite lg:block">{event.location}</span>
      {event.price_text && (
        <span className="hidden justify-self-end border border-ink px-3 py-2 font-mono text-[13px] lg:block">
          {event.price_text}
        </span>
      )}
    </Link>
  );
}
