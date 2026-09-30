"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "@/config/navigation";
import { cx } from "@/lib/cx";
import { isActivePath } from "@/lib/is-active-path";

interface AdminNavProps {
  label: string;
  links: NavLink[];
  /** The dashboard link is active only on its exact path, not for every /admin/* page. */
  exactHref: string;
}

export function AdminNav({ label, links, exactHref }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={label}>
      <ul className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 py-3 lg:flex-col lg:gap-0 lg:px-0 lg:py-4">
        {links.map((link) => {
          const active =
            link.href === exactHref ? pathname === exactHref : isActivePath(pathname, link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center border px-3 text-sm whitespace-nowrap lg:border-0 lg:border-l-2 lg:px-6 lg:text-[15px]",
                  active
                    ? "border-ink bg-ink text-paper lg:border-accent lg:bg-transparent lg:font-semibold lg:text-ink"
                    : "border-line text-ink hover:bg-stone lg:border-transparent",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
