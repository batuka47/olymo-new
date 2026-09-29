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
    <nav aria-label={label} className="hidden lg:block">
      <ul className="flex items-center gap-5 xl:gap-7">
        {links.map((link) => {
          const active = isActivePath(pathname, link.href);
          return (
            <li key={link.href}>
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
