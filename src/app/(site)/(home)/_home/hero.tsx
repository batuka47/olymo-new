import { ArticleCard } from "@/components/site/article-card";
import { SearchForm } from "@/components/site/search-form";
import type { LeadArticle } from "@/lib/articles/home";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";

export function HomeHero({ lead }: { lead: LeadArticle | null }) {
  return (
    <section className="grid gap-y-7 pb-8 lg:grid-cols-12 lg:pb-0">
      <div
        className={cx(
          "flex flex-col gap-4 pt-8 lg:gap-7 lg:pt-22 lg:pr-14 lg:pb-18 lg:pl-12",
          lead ? "lg:col-span-7 lg:border-r lg:border-line" : "lg:col-span-12",
        )}
      >
        <p className="font-mono text-[10px] tracking-[0.08em] text-muted uppercase lg:text-xs">
          [ {t("home.hero.eyebrow")} ]
        </p>
        <h1 className="font-display text-[31px] leading-[1.1] font-bold tracking-display lg:text-[64px] lg:leading-[1.04]">
          {t("home.hero.titleBefore")}{" "}
          <span className="bg-lime box-decoration-clone px-1 lg:px-2">
            {t("home.hero.titleHighlight")}
          </span>
          {t("home.hero.titleAfter")}
        </h1>
        <p className="max-w-140 text-base leading-normal text-graphite lg:text-[19px] lg:leading-[1.55]">
          {t("home.hero.lead")}
        </p>
        <SearchForm
          id="home-search"
          label={t("home.hero.searchLabel")}
          placeholder={t("home.hero.searchPlaceholder")}
          submitLabel={t("home.hero.searchButton")}
          className="max-w-140"
        />
      </div>
      {lead && (
        <div className="border border-line lg:col-span-5 lg:border-0">
          <ArticleCard
            article={lead}
            variant="lead"
            kicker={t("home.leadKicker")}
            readingMinutes={lead.readingMinutes}
            preload
          />
        </div>
      )}
    </section>
  );
}
