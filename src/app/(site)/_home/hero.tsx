import { ArticleCard } from "@/components/site/article-card";
import { routes } from "@/config/navigation";
import type { LeadArticle } from "@/lib/articles/home";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";

function SearchForm() {
  return (
    <form
      action={routes.search}
      role="search"
      className="flex max-w-140 border border-ink bg-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent"
    >
      <label htmlFor="home-search" className="sr-only">
        {t("home.hero.searchLabel")}
      </label>
      <input
        id="home-search"
        name="q"
        type="search"
        placeholder={t("home.hero.searchPlaceholder")}
        className="h-12 min-w-0 flex-1 bg-transparent px-4 text-base outline-none lg:h-14 lg:px-5"
      />
      <button
        type="submit"
        className="h-12 shrink-0 cursor-pointer bg-accent px-5 font-mono text-xs tracking-label text-white uppercase hover:bg-ink lg:h-14 lg:px-6"
      >
        {t("home.hero.searchButton")}
      </button>
    </form>
  );
}

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
        <SearchForm />
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
