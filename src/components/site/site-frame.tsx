import type { ReactNode } from "react";
import { SkipLink } from "@/components/skip-link";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { Ticker } from "@/components/site/ticker";
import { getBreakingArticles } from "@/lib/articles/home";
import { articlePath } from "@/lib/articles/status";
import { getNavLinks } from "@/lib/categories/queries";

const TICKER_ITEMS = 3;

/**
 * Everything around a public page: skip link, ticker, header, footer. Used by the (site) layout and
 * by the 404 page for addresses that match no route (it renders outside that layout).
 */
export async function SiteFrame({ children }: { children: ReactNode }) {
  const [breaking, categoryLinks] = await Promise.all([
    getBreakingArticles(TICKER_ITEMS),
    getNavLinks(),
  ]);
  const tickerItems = breaking.map((article) => ({
    href: articlePath(article.category_slug, article.slug),
    label: article.title,
  }));

  return (
    <>
      <SkipLink />
      <Ticker items={tickerItems} />
      <Header categoryLinks={categoryLinks} />
      {/* tabIndex lets the skip link move keyboard focus here, not just scroll. */}
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer categoryLinks={categoryLinks} />
    </>
  );
}
