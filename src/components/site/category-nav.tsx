"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "@/config/navigation";
import { cx } from "@/lib/cx";
import { isActivePath } from "@/lib/is-active-path";

interface CategoryNavProps {
  label: string;
  links: NavLink[];
}

export function CategoryNav({ label, links }: CategoryNavProps) {
  const pathname = usePathname();

  return (
    // Admins choose how many categories are in the menu: when they do not fit between the logo and
    // the buttons, the list scrolls sideways instead of pushing the page wider. Centred when it fits.
    <nav aria-label={label} className="hidden min-w-0 flex-1 lg:block">
      <ul className="mx-auto flex w-max max-w-full [scrollbar-width:none] items-center gap-5 overflow-x-auto xl:gap-7">
        {links.map((link) => {
          const active = isActivePath(pathname, link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className="group flex h-11 items-center font-mono text-xs tracking-label whitespace-nowrap uppercase"
              >
                <span
                  className={cx(
                    "border-b-2 pb-1",
                    active ? "border-accent" : "border-transparent group-hover:border-line",
                  )}
                >
                  {link.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
