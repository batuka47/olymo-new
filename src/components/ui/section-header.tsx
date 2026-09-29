import Link from "next/link";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";

interface SectionHeaderProps {
  index: number;
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}

export function SectionHeader({ index, title, href, linkLabel, className }: SectionHeaderProps) {
  return (
    <div className={cx("flex items-baseline justify-between gap-4", className)}>
      <div className="flex items-baseline gap-2.5 lg:gap-5">
        <span className="font-mono text-[11px] text-accent lg:text-xs">
          {String(index).padStart(2, "0")}
        </span>
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] lg:text-[32px]">
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
