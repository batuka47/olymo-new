import Link from "next/link";
import { cx } from "@/lib/cx";

export interface FilterOption {
  key: string;
  label: string;
  href: string;
  active: boolean;
}

interface FilterLinksProps {
  label: string;
  options: FilterOption[];
  /** end: beside a page title on desktop (the site's lists); start: above a table (admin). */
  align?: "start" | "end";
}

/** A row of links that switch a list (?subject=, ?when=, …); the current one is ink. */
export function FilterLinks({ label, options, align = "end" }: FilterLinksProps) {
  return (
    <nav aria-label={label}>
      <ul className={cx("flex flex-wrap gap-1.5", align === "end" && "lg:justify-end")}>
        {options.map((option) => (
          <li key={option.key}>
            <Link
              href={option.href}
              aria-current={option.active ? "page" : undefined}
              className={cx(
                "inline-flex h-11 items-center px-3.5 font-mono text-xs tracking-wider uppercase transition-colors",
                option.active
                  ? "bg-ink text-paper"
                  : "border border-ink hover:bg-ink hover:text-paper",
              )}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
