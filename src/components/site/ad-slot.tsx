import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";

/** rectangle: 300 × 250 in side columns; leaderboard: full width between sections. */
export type AdSlotSize = "rectangle" | "leaderboard";

const slotClasses: Record<AdSlotSize, string> = {
  rectangle: "h-62.5",
  leaderboard: "h-25 lg:h-35",
};

/** Reserved ad space with its size. Placeholder until ads are served from the ads table. */
export function AdSlot({ size, className }: { size: AdSlotSize; className?: string }) {
  return (
    <div
      className={cx(
        "flex items-center justify-center border border-dashed border-ash font-mono text-[11px] tracking-[0.08em] text-muted uppercase",
        slotClasses[size],
        className,
      )}
    >
      {/* One span: as separate flex items the parts would lose the spaces between them. */}
      <span>
        {t("ads.label")} ·{" "}
        {size === "rectangle" ? (
          "300 × 250"
        ) : (
          <>
            <span className="lg:hidden">320 × 100</span>
            <span className="hidden lg:inline">1248 × 140</span>
          </>
        )}
      </span>
    </div>
  );
}
