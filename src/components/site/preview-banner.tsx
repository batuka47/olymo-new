import { Container } from "@/components/ui/container";
import { adminRoutes } from "@/config/admin";
import { t } from "@/lib/i18n";

export function PreviewBanner({ path }: { path: string }) {
  return (
    <div role="status" className="bg-lime text-ink">
      <Container className="flex min-h-11 flex-wrap items-center justify-between gap-3 py-2 text-sm">
        <span>{t("article.preview.banner")}</span>
        <a
          href={`${adminRoutes.previewExit}?path=${encodeURIComponent(path)}`}
          className="inline-flex min-h-11 items-center font-mono text-xs tracking-label uppercase underline underline-offset-4"
        >
          {t("article.preview.exit")}
        </a>
      </Container>
    </div>
  );
}
