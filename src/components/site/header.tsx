import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { AccountMenuLoader } from "@/components/site/account-menu-loader";
import { CategoryChips } from "@/components/site/category-chips";
import { CategoryNav } from "@/components/site/category-nav";
import { HideOnScroll } from "@/components/site/hide-on-scroll";
import { MobileMenu } from "@/components/site/mobile-menu";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getPageGroups, routes, type NavLink } from "@/config/navigation";
import { t } from "@/lib/i18n";

/** categoryLinks: the categories shown in the menu (lib/categories/queries.ts, getNavLinks). */
export function Header({ categoryLinks }: { categoryLinks: NavLink[] }) {
  const categoriesLabel = t("nav.categories");

  return (
    <HideOnScroll>
      <header className="border-b border-line">
        <Container className="flex h-15 items-center justify-between gap-6 lg:h-19">
          <MobileMenu
            logo={<Logo />}
            groups={[{ title: categoriesLabel, links: categoryLinks }, ...getPageGroups()]}
            submitLink={{ href: routes.submit, label: t("nav.submit") }}
            labels={{ title: t("nav.menu"), open: t("nav.openMenu"), close: t("nav.closeMenu") }}
          />

          <Link href={routes.home} className="flex min-h-11 items-center">
            <Logo />
          </Link>

          <CategoryNav label={categoriesLabel} links={categoryLinks} />

          <div className="flex items-center gap-3">
            <Link
              href={routes.search}
              aria-label={t("nav.search")}
              className="-mr-2 flex size-11 items-center justify-center border border-transparent lg:mr-0 lg:border-ink"
            >
              <SearchIcon className="size-5 lg:size-4.5" />
            </Link>
            <AccountMenuLoader />
            <div className="hidden lg:block">
              <Button href={routes.submit} variant="ink">
                {t("nav.submit")}
                <span aria-hidden="true">→</span>
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <CategoryChips
        label={categoriesLabel}
        links={[{ href: routes.home, label: t("nav.featured") }, ...categoryLinks]}
      />
    </HideOnScroll>
  );
}
