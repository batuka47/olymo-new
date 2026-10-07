import Link from "next/link";
import type { ReactNode } from "react";
import { ArticleBodyHtml } from "@/components/site/article-body-html";
import { Container } from "@/components/ui/container";
import { getPageGroups } from "@/config/navigation";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import { fillHtmlTokens } from "@/lib/site-pages/text";

interface InfoPageLayoutProps {
  /** This page's address (routes in config/navigation.ts); marks it in the side nav. */
  href: string;
  title: string;
  lead?: string;
  children: ReactNode;
}

function SideNav({ href }: { href: string }) {
  return (
    <nav aria-label={t("infoPages.nav")} className="sticky top-24 flex flex-col gap-8">
      {getPageGroups().map((group) => (
        <div key={group.title}>
          <h2 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
            {group.title}
          </h2>
          <ul>
            {group.links.map((link) => {
              const current = link.href === href;
              return (
                <li key={link.href} className="border-t border-line">
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={cx(
                      "flex min-h-11 items-center justify-between gap-3 text-[15px] hover:underline",
                      current && "font-semibold text-accent",
                    )}
                  >
                    {link.label}
                    {current && <span aria-hidden="true">←</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/**
 * The info pages (/about, /faq, /privacy, /contact, …): mono eyebrow, display title and lead, an
 * 8-column body, and the info pages beside it on desktop (the footer lists them on phones).
 */
export function InfoPageLayout({ href, title, lead, children }: InfoPageLayoutProps) {
  const eyebrow =
    getPageGroups().find((group) => group.links.some((link) => link.href === href))?.title ??
    t("nav.info");

  return (
    <Container className="pb-16 lg:pb-24">
      <div className="border-b border-line lg:border-x">
        <header className="flex flex-col gap-4 py-10 lg:px-12 lg:pt-16 lg:pb-12">
          <p className="font-mono text-xs tracking-[0.08em] text-muted uppercase">[ {eyebrow} ]</p>
          <h1 className="font-display text-[32px] leading-[1.05] font-extrabold tracking-[-0.04em] sm:text-5xl lg:text-7xl">
            {title}
          </h1>
          {lead && (
            <p className="max-w-3xl text-[17px] leading-normal text-graphite lg:text-[19px]">
              {lead}
            </p>
          )}
        </header>
        <div className="grid border-t border-line lg:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-12 py-8 lg:col-span-8 lg:border-r lg:border-line lg:px-12 lg:py-12">
            {children}
          </div>
          <aside className="hidden lg:col-span-4 lg:block lg:px-8 lg:py-12">
            <SideNav href={href} />
          </aside>
        </div>
      </div>
    </Container>
  );
}

/** Text written in the editor (sanitized when saved) with the site name filled in. */
export function InfoPageBody({ html }: { html: string | null }) {
  if (!html) {
    return null;
  }
  return <ArticleBodyHtml html={fillHtmlTokens(html)} />;
}
