import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { Ticker } from "@/components/site/ticker";
import { getBreakingArticles } from "@/lib/articles/home";
import { articlePath } from "@/lib/articles/status";
import { t } from "@/lib/i18n";

export const revalidate = 60;

const TICKER_ITEMS = 3;

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const breaking = await getBreakingArticles(TICKER_ITEMS);
  const tickerItems = breaking.map((article) => ({
    href: articlePath(article.category_slug, article.slug),
    label: article.title,
  }));

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-accent focus:px-4 focus:py-3 focus:font-mono focus:text-xs focus:text-white focus:uppercase"
      >
        {t("nav.skipToContent")}
      </a>
      <Ticker items={tickerItems} />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
