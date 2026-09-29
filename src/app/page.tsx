import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { t } from "@/lib/i18n";

export default function HomePage() {
  return (
    <main className="container flex-1 py-16 lg:py-24">
      <p className="font-mono text-xs tracking-label text-muted uppercase">
        <span className="text-accent">01</span> · {t("tokenPreview.label")}
      </p>

      <h1 className="mt-6 max-w-5xl font-display text-3xl leading-[1.1] font-bold tracking-display lg:text-6xl lg:leading-[1.04]">
        {siteConfig.tagline}
      </h1>

      <p className="mt-6 max-w-xl text-base leading-normal lg:text-lg lg:leading-relaxed">
        {t("tokenPreview.intro")}
      </p>

      <div className="mt-12 flex flex-wrap gap-4 border-t border-line pt-12">
        <Button variant="accent">{t("tokenPreview.buttonAccent")}</Button>
        <Button variant="ink">{t("tokenPreview.buttonInk")}</Button>
        <Button variant="outline">{t("tokenPreview.buttonOutline")}</Button>
      </div>
    </main>
  );
}
