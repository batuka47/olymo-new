import type { Metadata } from "next";
import { InfoPageBody, InfoPageLayout } from "@/components/site/info-page-layout";
import { NumberedBlocks } from "@/components/site/numbered-blocks";
import { SectionHeader } from "@/components/ui/section-header";
import { routes } from "@/config/navigation";
import { t } from "@/lib/i18n";
import { filledBlocks } from "@/lib/site-pages/blocks";
import { sitePageMetadata } from "@/lib/site-pages/metadata";
import { getTeamMembers, requireSitePage } from "@/lib/site-pages/queries";
import { fillTokens } from "@/lib/site-pages/text";
import { TeamGrid, visibleTeam } from "./team-grid";
import { VisionMission } from "./vision-mission";

// Text, blocks and team come from /admin/pages, which revalidates this page on save.
export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return sitePageMetadata("about");
}

export default async function AboutPage() {
  const [page, members] = await Promise.all([requireSitePage("about"), getTeamMembers()]);
  const { rationale, vision, mission } = page.blocks;
  const team = visibleTeam(members);
  // Sections without content are left out and the numbers close up.
  const sections = [
    filledBlocks(rationale).length > 0
      ? { title: t("aboutPage.rationale"), content: <NumberedBlocks blocks={rationale} /> }
      : null,
    vision || mission
      ? {
          title: t("aboutPage.visionMission"),
          content: <VisionMission vision={vision} mission={mission} />,
        }
      : null,
    team.length > 0 ? { title: t("aboutPage.team"), content: <TeamGrid members={team} /> } : null,
  ].filter((section) => section !== null);

  return (
    <InfoPageLayout
      href={routes.about}
      title={fillTokens(page.title)}
      lead={fillTokens(page.description)}
    >
      <InfoPageBody html={page.body_html} />
      {sections.map((section, index) => (
        <section key={section.title} className="flex flex-col gap-6">
          <SectionHeader index={index + 1} title={section.title} />
          {section.content}
        </section>
      ))}
    </InfoPageLayout>
  );
}
