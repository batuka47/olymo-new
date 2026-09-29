"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { NavGroup, NavLink } from "@/config/navigation";
import { cx } from "@/lib/cx";
import { isActivePath } from "@/lib/is-active-path";

interface MobileMenuProps {
  logo: ReactNode;
  groups: NavGroup[];
  submitLink: NavLink;
  labels: { title: string; open: string; close: string };
}

export function MobileMenu({ logo, groups, submitLink, labels }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  function closeOnBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  return (
    <>
      <button
        ref={menuButtonRef}
        type="button"
        onClick={open}
        aria-label={labels.open}
        aria-haspopup="dialog"
        className="-ml-2 flex size-11 cursor-pointer items-center justify-center lg:hidden"
      >
        <MenuIcon className="size-5.5" />
      </button>

      <dialog
        ref={dialogRef}
        aria-label={labels.title}
        onClick={closeOnBackdropClick}
        onClose={() => menuButtonRef.current?.focus()}
        className="m-0 h-dvh max-h-none w-full max-w-none -translate-x-full bg-paper p-0 text-ink transition-[translate,display,overlay] transition-discrete duration-300 ease-out backdrop:bg-ink/60 open:translate-x-0 motion-reduce:transition-none sm:max-w-sm starting:open:-translate-x-full"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-15 shrink-0 items-center justify-between border-b border-line px-4">
            {logo}
            <button
              type="button"
              onClick={close}
              aria-label={labels.close}
              className="-mr-2 flex size-11 cursor-pointer items-center justify-center"
            >
              <CloseIcon className="size-5.5" />
            </button>
          </div>

          <nav className="flex-1 divide-y divide-line overflow-y-auto">
            {groups.map((group) => (
              <section key={group.title} className="px-4 py-5">
                <h2 className="font-mono text-[11px] tracking-label text-muted uppercase">
                  {group.title}
                </h2>
                <ul className="mt-2">
                  {group.links.map((link) => {
                    const active = isActivePath(pathname, link.href);
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={close}
                          aria-current={active ? "page" : undefined}
                          className={cx(
                            "flex min-h-11 items-center text-[17px] font-semibold",
                            active && "text-accent",
                          )}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </nav>

          <div className="shrink-0 border-t border-line p-4">
            <Button href={submitLink.href} onClick={close} variant="ink" className="w-full">
              {submitLink.label}
              <span aria-hidden="true">→</span>
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
