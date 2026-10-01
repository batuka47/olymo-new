import Link from "next/link";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";

interface SectionHeaderProps {
  index: number;
  title: string;
  href?: string;
  linkLabel?: string;
  /** On an ink background: the index turns lime and the title grows (the board's dark band). */
  onInk?: boolean;
  className?: string;
}

export function SectionHeader({
  index,
  title,
  href,
  linkLabel,
  onInk = false,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cx("flex items-baseline justify-between gap-4", className)}>
      <div className="flex items-baseline gap-2.5 lg:gap-5">
        <span
          className={cx("font-mono text-[11px] lg:text-xs", onInk ? "text-lime" : "text-accent")}
        >
          {String(index).padStart(2, "0")}
        </span>
        <h2
          className={cx(
            "font-display font-bold tracking-[-0.02em]",
            onInk ? "text-2xl lg:text-[40px]" : "text-[22px] lg:text-[32px]",
          )}
        >
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 font-mono text-[11px] tracking-label uppercase hover:underline lg:text-xs"
        >
          {linkLabel ?? t("section.viewAll")}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
