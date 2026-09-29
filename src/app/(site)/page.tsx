import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { SectionHeader } from "@/components/ui/section-header";
import { Tag } from "@/components/ui/tag";
import { categoryPath } from "@/config/categories";
import { routes } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { absolute: siteConfig.name },
  description: siteConfig.tagline,
};

export default function HomePage() {
  return (
    <Container className="flex flex-col gap-16 py-12 lg:gap-24 lg:py-20">
      <section>
        <p className="font-mono text-xs tracking-label text-muted uppercase">
          <span className="text-accent">00</span> · {t("tokenPreview.label")}
        </p>
        <h1 className="mt-6 max-w-5xl font-display text-3xl leading-[1.1] font-bold tracking-display lg:text-6xl lg:leading-[1.04]">
          {siteConfig.tagline}
        </h1>
        <p className="mt-6 max-w-xl text-base leading-normal lg:text-lg lg:leading-relaxed">
          {t("tokenPreview.intro")}
        </p>
      </section>

      <section className="flex flex-col gap-6 border-t border-line pt-6">
        <SectionHeader index={1} title={t("tokenPreview.buttonsTitle")} href={routes.submit} />
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="accent">{t("tokenPreview.buttonAccent")}</Button>
          <Button variant="ink" href={categoryPath("olympiad")}>
            {t("tokenPreview.buttonInk")}
            <span aria-hidden="true">→</span>
          </Button>
          <Button variant="outline">{t("tokenPreview.buttonOutline")}</Button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="accent" size="lg">
            {t("tokenPreview.buttonAccent")}
          </Button>
          <Button variant="ink" size="lg">
            {t("tokenPreview.buttonInk")}
          </Button>
          <Button variant="outline" size="lg">
            {t("tokenPreview.buttonOutline")}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-6 border-t border-line pt-6">
        <SectionHeader index={2} title={t("tokenPreview.tagsTitle")} />
        <div className="flex flex-wrap gap-2">
          <Tag variant="outline">{t("tokenPreview.tagOutline")}</Tag>
          <Tag variant="ink">{t("tokenPreview.tagInk")}</Tag>
          <Tag variant="lime">{t("tokenPreview.tagLime")}</Tag>
          <Tag variant="accent">{t("tokenPreview.tagAccent")}</Tag>
        </div>
      </section>

      <section className="flex flex-col gap-6 border-t border-line pt-6">
        <SectionHeader index={3} title={t("tokenPreview.placeholderTitle")} />
        <ImagePlaceholder
          label={t("tokenPreview.placeholderLabel")}
          className="aspect-video max-w-xl"
        />
      </section>
    </Container>
  );
}
