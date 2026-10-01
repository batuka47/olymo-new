import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";

/** The ads.placement values (see the ads table). */
export type AdPlacement =
  | "home_1"
  | "home_2"
  | "home_3"
  | "home_4"
  | "category_1"
  | "category_2"
  | "category_3"
  | "article_side";

/** article_side is a 300 × 250 rectangle; every other placement is a full-width leaderboard. */
function isRectangle(placement: AdPlacement): boolean {
  return placement === "article_side";
}

/** Reserved ad space with its size. Placeholder until ads are served from the ads table. */
export function AdSlot({ placement, className }: { placement: AdPlacement; className?: string }) {
  const rectangle = isRectangle(placement);
  return (
    <div
      data-placement={placement}
      className={cx(
        "flex items-center justify-center border border-dashed border-ash font-mono text-[11px] tracking-[0.08em] text-muted uppercase",
        rectangle ? "h-62.5" : "h-25 lg:h-35",
        className,
      )}
    >
      {/* One span: as separate flex items the parts would lose the spaces between them. */}
      <span>
        {t("ads.label")} ·{" "}
        {rectangle ? (
          "300 × 250"
        ) : (
          <>
            <span className="lg:hidden">358 × 100</span>
            <span className="hidden lg:inline">1248 × 140</span>
          </>
        )}
      </span>
    </div>
  );
}
