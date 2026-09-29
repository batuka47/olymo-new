import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { Ticker } from "@/components/site/ticker";
import { categoryPath } from "@/config/categories";
import type { NavLink } from "@/config/navigation";
import { t } from "@/lib/i18n";

export const revalidate = 60;

// Sample headlines until the ticker reads the latest olympiad articles from the database.
const tickerItems: NavLink[] = [
  {
    href: categoryPath("olympiad"),
    label: "Математикийн олимпиадын I шатны бүртгэл 10.20 хүртэл",
  },
  { href: categoryPath("education"), label: "ЭЕШ 2027 — бүртгэлийн журам гарлаа" },
  { href: categoryPath("olympiad"), label: "Програмчлалын олимпиадын сонгон шалгаруулалт" },
];

export default function SiteLayout({ children }: LayoutProps<"/">) {
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
