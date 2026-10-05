"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { adminRoutes } from "@/config/admin";
import { routes } from "@/config/navigation";
import { t } from "@/lib/i18n";

export interface ErrorScreenProps {
  error: Error & { digest?: string };
  retry: () => void;
  /** Admin errors link back to the dashboard instead of the home page. */
  area?: "site" | "admin";
}

/**
 * What error boundaries show. Loaded only when an error happens (see LazyErrorScreen), so its
 * text does not ride along with every page.
 */
export default function ErrorScreen({ error, retry, area = "site" }: ErrorScreenProps) {
  const home =
    area === "admin"
      ? { href: adminRoutes.dashboard, label: t("notFound.dashboard") }
      : { href: routes.home, label: t("errorPage.home") };

  useEffect(() => {
    // The server logs its own errors with the same digest (src/lib/error-reporting.ts).
    console.error(error);
  }, [error]);

  return (
    <div className="flex max-w-160 flex-col items-start gap-5 py-10 lg:py-16">
      <p className="font-mono text-xs tracking-label text-accent uppercase">[ 500 ]</p>
      <h1 className="font-display text-[30px] leading-[1.1] font-bold tracking-display lg:text-[48px]">
        {t("errorPage.title")}
      </h1>
      <p role="alert" className="text-lg leading-normal text-graphite">
        {t("errorPage.lead")}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={retry}>{t("errorPage.retry")}</Button>
        <Link
          href={home.href}
          className="inline-flex min-h-11 items-center font-mono text-xs tracking-label uppercase underline underline-offset-4"
        >
          {home.label}
        </Link>
      </div>
      {error.digest && (
        <p className="font-mono text-xs text-muted">
          {t("errorPage.code")}: {error.digest}
        </p>
      )}
    </div>
  );
}
