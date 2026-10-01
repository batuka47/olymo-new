import type { Metadata } from "next";
import { AdSlot, type AdPlacement } from "@/components/site/ad-slot";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import {
  arrangeHomeSections,
  getFeaturedArticles,
  getGoodToKnowArticles,
  getLatestInCategory,
  getOpenOlympiads,
  getSpecialArticles,
  HOME_FETCH,
  SECTOR_CATEGORIES,
  type HomeSections,
} from "@/lib/articles/home";
import { getUpcomingEvents } from "@/lib/events";
import { t } from "@/lib/i18n";
import { siteOpenGraph } from "@/lib/metadata";
import { CardGridSection } from "./_home/card-grid-section";
import { EventsSection } from "./_home/events-section";
import { GoodToKnowSection } from "./_home/good-to-know-section";
import { HomeHero } from "./_home/hero";
import { OlympiadsSection } from "./_home/olympiads-section";
import { OrganizationsCta } from "./_home/organizations-cta";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: siteConfig.name },
  description: siteConfig.tagline,
  alternates: { canonical: "/" },
  openGraph: {
    ...siteOpenGraph,
    type: "website",
    url: "/",
    title: siteConfig.name,
    description: siteConfig.tagline,
  },
};

type NumberedSection = "featured" | "olympiads" | "goodToKnow" | "sectors" | "events";

/** A section with nothing to show is left out. */
function visibleSections(sections: HomeSections): Record<NumberedSection, boolean> {
  return {
    featured: sections.featured.length > 0,
    olympiads: sections.olympiads.length > 0,
    goodToKnow: sections.goodToKnow.length > 0 || sections.special !== null,
    sectors: sections.sectorTiles.length > 0,
    events: sections.events.length > 0,
  };
}

/** The numbers ("01", "02", …) count only the sections shown, in page order. */
function sectionNumbers(
  visible: Record<NumberedSection, boolean>,
): Record<NumberedSection, number> {
  const shown = (Object.keys(visible) as NumberedSection[]).filter((name) => visible[name]);
  return Object.fromEntries(shown.map((name, position) => [name, position + 1])) as Record<
    NumberedSection,
    number
  >;
}

function AdBand({ placement }: { placement: AdPlacement }) {
  return (
    <div className="border-t border-line py-6 lg:p-8">
      <AdSlot placement={placement} />
    </div>
  );
}

export default async function HomePage() {
  const [special, featured, olympiads, goodToKnow, sectors, events] = await Promise.all([
    getSpecialArticles(HOME_FETCH.special),
    getFeaturedArticles(HOME_FETCH.featured),
    getOpenOlympiads(HOME_FETCH.olympiads),
    getGoodToKnowArticles(HOME_FETCH.goodToKnow),
    Promise.all(
      SECTOR_CATEGORIES.map((category) => getLatestInCategory(category, HOME_FETCH.sector)),
    ),
    getUpcomingEvents(HOME_FETCH.events),
  ]);
  const sections = arrangeHomeSections({
    special,
    featured,
    olympiads,
    goodToKnow,
    sectors,
    events,
  });
  const visible = visibleSections(sections);
  const number = sectionNumbers(visible);

  // Each ad slot follows a section and hides with it, so two ads never meet.
  return (
    <>
      <Container>
        <div className="lg:border-x lg:border-line">
          <HomeHero lead={sections.lead} />
          {visible.featured && (
            <>
              <CardGridSection
                index={number.featured}
                title={t("home.featured")}
                articles={sections.featured}
              />
              <AdBand placement="home_1" />
            </>
          )}
        </div>
      </Container>

      {visible.olympiads && (
        <OlympiadsSection index={number.olympiads} articles={sections.olympiads} />
      )}

      <Container className="pb-16 lg:pb-24">
        <div className="border-b border-line lg:border-x">
          {visible.goodToKnow && (
            <>
              <GoodToKnowSection
                index={number.goodToKnow}
                articles={sections.goodToKnow}
                special={sections.special}
              />
              <AdBand placement="home_2" />
            </>
          )}
          {visible.sectors && (
            <>
              <CardGridSection
                index={number.sectors}
                title={t("home.sectors")}
                articles={sections.sectorTiles}
              />
              <AdBand placement="home_3" />
            </>
          )}
          {visible.events && (
            <>
              <EventsSection index={number.events} events={sections.events} />
              <AdBand placement="home_4" />
            </>
          )}
          <OrganizationsCta />
        </div>
      </Container>
    </>
  );
}
