import { t } from "@/lib/i18n";

/** First thing a keyboard reaches: jumps past the navigation to <main id="main">. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-accent focus:px-4 focus:py-3 focus:font-mono focus:text-xs focus:text-white focus:uppercase"
    >
      {t("nav.skipToContent")}
    </a>
  );
}
