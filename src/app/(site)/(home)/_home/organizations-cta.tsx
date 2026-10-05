import { Button } from "@/components/ui/button";
import { routes } from "@/config/navigation";
import { t } from "@/lib/i18n";

export function OrganizationsCta() {
  return (
    <section className="flex flex-col gap-6 border-t border-line py-7 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-12 lg:py-16">
      <div className="flex max-w-180 flex-col gap-3.5 lg:gap-4">
        <p className="font-mono text-[10px] tracking-[0.08em] text-muted uppercase lg:text-xs">
          [ {t("home.cta.eyebrow")} ]
        </p>
        <h2 className="font-display text-[21px] leading-[1.2] font-bold tracking-[-0.02em] lg:text-[40px] lg:leading-[1.12]">
          {t("home.cta.title")}
        </h2>
        <p className="text-base leading-[1.55] text-graphite lg:text-lg">{t("home.cta.text")}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
        <Button href={routes.advertise} size="lg">
          {t("home.cta.advertise")}
        </Button>
        <Button href={routes.contact} variant="outline" size="lg">
          {t("home.cta.contact")}
        </Button>
      </div>
    </section>
  );
}
