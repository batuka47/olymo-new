import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";

/** Reserved ad space (300 × 250). Placeholder until ads are served from the ads table. */
export function AdSlot({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "flex h-62.5 items-center justify-center border border-dashed border-ash font-mono text-[11px] tracking-[0.08em] text-muted uppercase",
        className,
      )}
    >
      {t("ads.label")}
    </div>
  );
}
