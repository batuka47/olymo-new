import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/logo";
import { SkipLink } from "@/components/skip-link";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { adminNavItems, adminRoutes } from "@/config/admin";
import { requireStaff } from "@/lib/auth/staff";
import { t } from "@/lib/i18n";
import { getNewSubmissionCount } from "@/lib/submissions/queries";
import { signOut } from "./actions";

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const staff = await requireStaff();
  const newSubmissions = staff.role === "admin" ? await getNewSubmissionCount() : 0;
  const navLinks = adminNavItems
    .filter((item) => !item.adminOnly || staff.role === "admin")
    .map((item) => ({
      href: item.href,
      label: t(item.labelKey),
      badge: item.newSubmissionsBadge ? newSubmissions : undefined,
    }));

  return (
    // Phone: brand + user bar on top, nav scrolls sideways below. Desktop: nav becomes a sidebar.
    <>
      <SkipLink />
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto_1fr] [grid-template-areas:'brand_user'_'nav_nav'_'main_main'] lg:grid-cols-[15rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:[grid-template-areas:'brand_user'_'nav_main']">
        <div className="flex h-15 items-center gap-3 border-b border-line px-4 [grid-area:brand] lg:border-r lg:px-6">
          <Link href={adminRoutes.dashboard} className="flex min-h-11 items-center">
            <Logo />
          </Link>
          <Tag variant="ink" className="hidden sm:inline-flex">
            {t("admin.title")}
          </Tag>
        </div>

        <div className="flex h-15 items-center justify-end gap-3 border-b border-line px-4 [grid-area:user] lg:px-8">
          <p className="hidden min-w-0 flex-col items-end text-right sm:flex">
            <span className="max-w-64 truncate text-sm">{staff.email}</span>
            <span className="font-mono text-[11px] tracking-label text-muted uppercase">
              {t(`admin.roles.${staff.role}`)}
            </span>
          </p>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              {t("admin.signOut")}
            </Button>
          </form>
        </div>

        <aside className="border-b border-line [grid-area:nav] lg:border-r lg:border-b-0">
          <div className="lg:sticky lg:top-0">
            <AdminNav
              label={t("admin.nav.label")}
              links={navLinks}
              exactHref={adminRoutes.dashboard}
              badgeLabel={t("admin.nav.newBadge")}
            />
          </div>
        </aside>

        <main
          id="main"
          tabIndex={-1}
          className="min-w-0 px-4 py-8 outline-none [grid-area:main] lg:px-8 lg:py-10"
        >
          {children}
        </main>
      </div>
    </>
  );
}
