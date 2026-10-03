import { eventPath } from "@/config/events";
import { siteConfig } from "@/config/site";
import { buildIcs } from "@/lib/events/ics";
import { getEvent } from "@/lib/events/queries";

/** "Календарт нэмэх": the event as an .ics file that phones and calendar apps open. */
export async function GET(_request: Request, { params }: RouteContext<"/events/[slug]/calendar">) {
  const { slug } = await params;
  const event = await getEvent(slug, false);
  if (!event) {
    return new Response("Not found", { status: 404 });
  }

  const ics = buildIcs({
    uid: `${event.id}@${new URL(siteConfig.url).host}`,
    title: event.title,
    description: event.excerpt,
    location: event.location,
    url: `${siteConfig.url}${eventPath(event.slug)}`,
    start: event.starts_at,
    end: event.ends_at,
    stamp: event.updated_at,
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
      "Cache-Control": "public, max-age=60",
    },
  });
}
