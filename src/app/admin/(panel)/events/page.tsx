import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ArticleStateBadge } from "@/components/admin/article-state-badge";
import { Pagination } from "@/components/site/pagination";
import { buttonClasses } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { adminRoutes } from "@/config/admin";
import { eventPath, eventTypeLabel } from "@/config/events";
import { articleState } from "@/lib/articles/status";
import { requireStaff } from "@/lib/auth/staff";
import { formatDateTime } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { EventRowActions } from "./event-row-actions";

export const metadata: Metadata = { title: t("admin.events.title") };

const PAGE_SIZE = 30;
const cellClasses = "px-4 py-3 align-top";

async function getEvents(page: number) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await supabase
    .from("events")
    .select("id, title, slug, event_type, starts_at, status, publish_at, is_featured", {
      count: "exact",
    })
    .order("starts_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error && error.code !== "PGRST103") {
    throw error;
  }
  return { events: data ?? [], total: count ?? 0 };
}

export default async function AdminEventsPage({ searchParams }: PageProps<"/admin/events">) {
  await requireStaff();
  const { page: pageParam } = await searchParams;
  const parsedPage = typeof pageParam === "string" ? Number.parseInt(pageParam, 10) : 1;
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const { events, total } = await getEvents(page);
  const now = new Date();
  const columns = ["title", "type", "startsAt", "status", "actions"] as const;

  return (
    <>
      <AdminPageHeader
        title={t("admin.events.title")}
        actions={
          <Link href={`${adminRoutes.events}/new`} className={buttonClasses({ size: "lg" })}>
            + {t("admin.events.new")}
          </Link>
        }
      />

      {events.length === 0 ? (
        <p className="border border-line p-8 text-center text-muted">{t("admin.events.empty")}</p>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-200 border-collapse text-left text-sm">
            <thead className="font-mono text-[11px] tracking-label text-muted uppercase">
              <tr>
                {columns.map((column) => (
                  <th key={column} scope="col" className="px-4 py-3 font-normal">
                    {t(`admin.events.columns.${column}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const state = articleState(event.status, event.publish_at, now);
                return (
                  <tr key={event.id} className="border-t border-line">
                    <td className={`${cellClasses} max-w-80`}>
                      <Link
                        href={`${adminRoutes.events}/${event.id}`}
                        className="text-[15px] font-semibold hover:underline"
                      >
                        {event.title}
                      </Link>
                      <p className="mt-1 truncate font-mono text-[11px] text-muted">{event.slug}</p>
                    </td>
                    <td className={cellClasses}>
                      <div className="flex flex-wrap gap-1">
                        <Tag>{eventTypeLabel(event.event_type)}</Tag>
                        {event.is_featured && (
                          <Tag variant="accent">{t("admin.events.editor.featured")}</Tag>
                        )}
                      </div>
                    </td>
                    <td className={`${cellClasses} whitespace-nowrap`}>
                      {formatDateTime(event.starts_at)}
                    </td>
                    <td className={cellClasses}>
                      <ArticleStateBadge state={state} />
                    </td>
                    <td className={cellClasses}>
                      <EventRowActions
                        id={event.id}
                        title={event.title}
                        publicPath={state === "published" ? eventPath(event.slug) : null}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        pageCount={Math.ceil(total / PAGE_SIZE)}
        hrefFor={(target) => `${adminRoutes.events}?page=${target}`}
      />
    </>
  );
}
