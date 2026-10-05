import { eventTypeLabel } from "@/config/events";
import { formatDate } from "@/lib/dates";
import { getEvent } from "@/lib/events/queries";
import { contentShareImage } from "@/lib/og/share-card";

/** Share image of a published event without a cover (see shareImageUrl). */
export async function GET(_request: Request, { params }: RouteContext<"/og/events/[slug]">) {
  const { slug } = await params;
  const event = await getEvent(slug, false);
  if (!event) {
    return new Response(null, { status: 404 });
  }
  return contentShareImage({
    title: event.title,
    label: eventTypeLabel(event.event_type),
    date: formatDate(event.starts_at),
  });
}
