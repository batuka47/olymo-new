import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { ArticleBodyHtml } from "@/components/site/article-body-html";
import { Breadcrumb } from "@/components/site/breadcrumb";
import { EventCard } from "@/components/site/event-card";
import { PreviewBanner } from "@/components/site/preview-banner";
import { ShareButtons } from "@/components/site/share-buttons";
import { Container } from "@/components/ui/container";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { Tag } from "@/components/ui/tag";
import { categoryPath, requireCategory } from "@/config/categories";
import { eventPath, eventTypeLabel } from "@/config/events";
import { routes } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { formatEventTime } from "@/lib/events/format";
import { eventJsonLd } from "@/lib/events/json-ld";
import { getEvent, getLatestEventSlugs, getRelatedEvents } from "@/lib/events/queries";
import { t } from "@/lib/i18n";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { EventFacts } from "./event-facts";
import { eventMetadata } from "./event-metadata";

export const revalidate = 60;

const PRERENDERED_EVENTS = 50;

export async function generateStaticParams() {
  const slugs = await getLatestEventSlugs(PRERENDERED_EVENTS);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { isEnabled: preview } = await draftMode();
  const event = await getEvent(slug, preview);
  return event ? eventMetadata(event, preview) : {};
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const { isEnabled: preview } = await draftMode();
  const event = await getEvent(slug, preview);
  if (!event) {
    notFound();
  }

  const path = eventPath(event.slug);
  const pageUrl = `${siteConfig.url}${path}`;
  const related = await getRelatedEvents(event);
  const section = requireCategory("events");

  return (
    <>
      {preview && <PreviewBanner path={path} />}
      <JsonLd data={eventJsonLd(event, pageUrl)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t("article.home"), path: routes.home },
          { name: section.label, path: categoryPath("events") },
          { name: event.title },
        ])}
      />

      <Container className="pb-16 lg:pb-24">
        <div className="border-b border-line lg:border-x">
          <article>
            <header className="flex flex-col gap-6 py-8 lg:px-12 lg:pt-14 lg:pb-10">
              <Breadcrumb
                items={[
                  { label: t("article.home"), href: routes.home },
                  { label: section.label, href: categoryPath("events") },
                  { label: eventTypeLabel(event.event_type) },
                ]}
              />
              <div className="flex flex-wrap gap-2">
                <Tag variant={event.is_featured ? "accent" : "ink"}>
                  {eventTypeLabel(event.event_type)}
                </Tag>
                {event.is_featured && <Tag variant="lime">{t("eventsPage.featured")}</Tag>}
              </div>
              <h1 className="max-w-260 font-display text-[30px] leading-[1.1] font-bold tracking-display lg:text-[54px] lg:leading-[1.08]">
                {event.title}
              </h1>
              {event.excerpt && (
                <p className="max-w-205 text-lg leading-normal text-graphite lg:text-[21px]">
                  {event.excerpt}
                </p>
              )}
              <div className="flex flex-col gap-5 border-t border-line pt-5 lg:flex-row lg:items-center lg:justify-between">
                <p className="font-mono text-xs text-muted">
                  {formatEventTime(event.starts_at, event.ends_at)}
                  {event.location && ` · ${event.location}`}
                </p>
                <ShareButtons
                  url={pageUrl}
                  title={event.title}
                  facebookAppId={siteConfig.facebookAppId}
                />
              </div>
            </header>

            {/* One column on phones (facts, then the text); 8 + 4 columns from lg. */}
            <div className="grid border-t border-line lg:grid-cols-12">
              <aside
                aria-labelledby="event-facts-title"
                className="pt-8 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:px-8 lg:py-10"
              >
                <EventFacts event={event} />
              </aside>
              <div className="min-w-0 py-8 lg:col-span-8 lg:row-start-1 lg:border-r lg:border-line lg:px-12 lg:pt-10 lg:pb-14">
                {event.cover_path && (
                  <ResponsiveImage
                    path={event.cover_path}
                    alt={event.cover_alt ?? ""}
                    sizes="(min-width: 1024px) 780px, 100vw"
                    preload
                    className="mb-8 aspect-video w-full"
                  />
                )}
                <ArticleBodyHtml html={event.body_html ?? ""} />
              </div>
            </div>
          </article>

          {related.length > 0 && (
            <section aria-labelledby="related-events-title" className="border-t border-line">
              <h2
                id="related-events-title"
                className="py-6 font-display text-[22px] font-bold lg:px-8 lg:pt-8 lg:text-2xl"
              >
                {t("eventPage.related")}
              </h2>
              <ul className="flex flex-col gap-4 pb-6 lg:gap-0 lg:pb-0">
                {related.map((relatedEvent) => (
                  <li key={relatedEvent.id} className="lg:border-t lg:border-line">
                    <EventCard event={relatedEvent} variant="list" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </Container>
    </>
  );
}
