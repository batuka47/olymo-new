import type { ReactNode } from "react";
import { t } from "@/lib/i18n";

interface CategoryHeaderProps {
  title: string;
  description: string;
  /** Filters on the right (FilterLinks); below the title on narrow screens. */
  children?: ReactNode;
}

/** "[ Ангилал ]" + the big title of a category page or /events (the "Ангилал — desktop" board). */
export function CategoryHeader({ title, description, children }: CategoryHeaderProps) {
  // The row wraps instead of shrinking the title, so a word is never split: the filters move below.
  return (
    <header className="flex flex-col gap-8 py-10 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between lg:gap-x-6 lg:gap-y-6 lg:px-12 lg:pt-16 lg:pb-10">
      <div className="flex flex-col gap-4">
        <p className="font-mono text-xs tracking-[0.08em] text-muted uppercase">
          [ {t("categoryPage.label")} ]
        </p>
        <h1 className="font-display text-[44px] leading-[0.95] font-extrabold tracking-[-0.04em] lg:text-8xl">
          {title}
        </h1>
        <p className="text-[17px] leading-normal text-graphite lg:text-[19px]">{description}</p>
      </div>
      {children}
    </header>
  );
}
