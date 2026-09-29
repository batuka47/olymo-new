"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { NavLink } from "@/config/navigation";
import { cx } from "@/lib/cx";
import { isActivePath } from "@/lib/is-active-path";

interface CategoryChipsProps {
  label: string;
  links: NavLink[];
}

export function CategoryChips({ label, links }: CategoryChipsProps) {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const activeChip = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (list && activeChip) {
      list.scrollLeft = activeChip.offsetLeft - (list.clientWidth - activeChip.offsetWidth) / 2;
    }
  }, [pathname]);

  return (
    <nav aria-label={label} className="border-b border-line lg:hidden">
      <ul
        ref={listRef}
        className="relative flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 py-3"
      >
        {links.map((link) => {
          const active = isActivePath(pathname, link.href);
          return (
            <li key={link.href} className="shrink-0">
              {/* The ::after layer stretches the 34px chip to a 44px touch target. */}
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative block border border-ink px-3 py-2 font-mono text-[11px] leading-4 tracking-label whitespace-nowrap uppercase after:absolute after:inset-x-0 after:-inset-y-1.25",
                  active ? "bg-ink text-paper" : "text-ink",
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
