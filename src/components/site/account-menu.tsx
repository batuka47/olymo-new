"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { routes } from "@/config/navigation";
import { useReader } from "@/lib/auth/use-reader";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

const itemClasses =
  "flex min-h-11 w-full cursor-pointer items-center px-4 text-left text-sm hover:bg-stone";

/**
 * The signed-in reader's initial in the header, opening "Миний бүртгэл" and "Гарах". Nothing for
 * visitors: readers sign in from the comments. Staff sign in separately at /admin/login.
 */
export function AccountMenu() {
  const state = useReader();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (state.status !== "signed-in") {
    return null;
  }
  const { displayName } = state.reader;

  async function signOut() {
    setOpen(false);
    await createClient().auth.signOut();
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("account.menu", { name: displayName })}
        onClick={() => setOpen((current) => !current)}
        className="flex size-11 cursor-pointer items-center justify-center"
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center bg-ink font-display text-sm font-bold text-paper uppercase"
        >
          {displayName.charAt(0) || "?"}
        </span>
      </button>
      {open && (
        <div
          id={menuId}
          className="absolute top-full right-0 z-40 mt-1 w-60 border border-ink bg-paper"
        >
          <p className="truncate border-b border-line px-4 py-3 text-sm font-semibold">
            {displayName}
          </p>
          <ul>
            <li>
              <Link href={routes.account} onClick={() => setOpen(false)} className={itemClasses}>
                {t("account.title")}
              </Link>
            </li>
            <li>
              <button type="button" onClick={signOut} className={itemClasses}>
                {t("account.signOut")}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
