import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminRoutes } from "@/config/admin";
import { sitePages } from "@/config/site-pages";
import { requireStaff } from "@/lib/auth/staff";
import { formatDateTime } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { getAllSitePages } from "@/lib/site-pages/queries";

export const metadata: Metadata = { title: t("admin.nav.pages") };

const cellClasses = "px-4 py-3 align-top";

export default async function AdminSitePagesPage() {
  await requireStaff();
  const rows = await getAllSitePages();
  const columns = ["title", "address", "updated"] as const;

  return (
    <>
      <AdminPageHeader title={t("admin.nav.pages")} intro={t("admin.pages.intro")} />

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-160 border-collapse text-left text-sm">
          <thead className="font-mono text-[11px] tracking-label text-muted uppercase">
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="px-4 py-3 font-normal">
                  {t(`admin.pages.columns.${column}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sitePages.map((page) => {
              const row = rows.find((candidate) => candidate.slug === page.slug);
              return (
                <tr key={page.slug} className="border-t border-line">
                  <td className={cellClasses}>
                    <Link
                      href={`${adminRoutes.pages}/${page.slug}`}
                      className="inline-flex min-h-11 items-center text-[15px] font-semibold hover:underline"
                    >
                      {row?.title ?? page.slug}
                    </Link>
                  </td>
                  <td className={`${cellClasses} font-mono text-xs`}>
                    <a
                      href={page.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center hover:underline"
                    >
                      {page.href}
                    </a>
                  </td>
                  <td className={`${cellClasses} font-mono text-xs text-muted`}>
                    <span className="inline-flex min-h-11 items-center">
                      {row ? formatDateTime(row.updated_at) : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-6 max-w-2xl text-sm text-muted">{t("admin.pages.builtIn")}</p>
    </>
  );
}
