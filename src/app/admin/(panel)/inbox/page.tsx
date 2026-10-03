import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FilterLinks } from "@/components/site/filter-links";
import { Pagination } from "@/components/site/pagination";
import { Tag, type TagVariant } from "@/components/ui/tag";
import { adminRoutes } from "@/config/admin";
import {
  isSubmissionKind,
  isSubmissionStatus,
  submissionKindLabelKeys,
  submissionKinds,
  submissionStatuses,
  submissionStatusLabelKeys,
  type SubmissionKind,
  type SubmissionStatus,
} from "@/config/submissions";
import { requireAdmin } from "@/lib/auth/staff";
import { cx } from "@/lib/cx";
import { formatDateTime } from "@/lib/dates";
import { t } from "@/lib/i18n";
import {
  getInbox,
  getNewSubmissionCount,
  getSubmission,
  INBOX_PAGE_SIZE,
  type InboxQuery,
  type InboxRow,
} from "@/lib/submissions/queries";
import { SubmissionDrawer } from "./submission-drawer";

export const metadata: Metadata = { title: t("admin.nav.inbox") };

interface InboxView extends InboxQuery {
  /** The submission open in the drawer. */
  id: string | null;
}

type SearchParams = Record<string, string | string[] | undefined>;

/** Unknown values fall back to the default view rather than a 404: this is a tool, not a page. */
function parseInboxView({ kind, status, page, id }: SearchParams): InboxView {
  const pageNumber = typeof page === "string" ? Number.parseInt(page, 10) : 1;
  return {
    kind: typeof kind === "string" && isSubmissionKind(kind) ? kind : null,
    status: typeof status === "string" && isSubmissionStatus(status) ? status : null,
    page: Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1,
    id: typeof id === "string" && z.uuid().safeParse(id).success ? id : null,
  };
}

function inboxHref(view: InboxView): string {
  const params = new URLSearchParams();
  if (view.kind) params.set("kind", view.kind);
  if (view.status) params.set("status", view.status);
  if (view.page > 1) params.set("page", String(view.page));
  if (view.id) params.set("id", view.id);
  const query = params.toString();
  return query ? `${adminRoutes.inbox}?${query}` : adminRoutes.inbox;
}

const statusTagVariants: Record<SubmissionStatus, TagVariant> = {
  new: "accent",
  in_progress: "ink",
  done: "outline",
  spam: "outline",
};

const cellClasses = "px-4 py-3 align-top";

function InboxTable({ rows, view }: { rows: InboxRow[]; view: InboxView }) {
  const columns = ["date", "kind", "sender", "content", "status"] as const;
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full min-w-200 border-collapse text-left text-sm">
        <thead className="font-mono text-[11px] tracking-label text-muted uppercase">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-3 font-normal">
                {t(`admin.inbox.columns.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = row.status as SubmissionStatus;
            const unread = status === "new";
            const name = [row.first_name, row.last_name].filter(Boolean).join(" ");
            return (
              <tr key={row.id} className={cx("border-t border-line", unread && "bg-white")}>
                <td className={cx(cellClasses, "font-mono text-xs whitespace-nowrap text-muted")}>
                  {formatDateTime(row.created_at)}
                </td>
                <td className={cx(cellClasses, "whitespace-nowrap")}>
                  {t(submissionKindLabelKeys[row.kind as SubmissionKind])}
                </td>
                <td className={cellClasses}>
                  <Link
                    href={inboxHref({ ...view, id: row.id })}
                    scroll={false}
                    className={cx("text-[15px] hover:underline", unread && "font-semibold")}
                  >
                    {name}
                  </Link>
                  {row.organization && <p className="text-muted">{row.organization}</p>}
                </td>
                <td className={cx(cellClasses, "max-w-md")}>
                  {row.title && <p className="font-semibold">{row.title}</p>}
                  <p className="line-clamp-2 text-graphite">{row.message}</p>
                </td>
                <td className={cellClasses}>
                  <Tag variant={statusTagVariants[status]}>
                    {t(submissionStatusLabelKeys[status])}
                  </Tag>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminInboxPage({ searchParams }: PageProps<"/admin/inbox">) {
  await requireAdmin();
  const view = parseInboxView(await searchParams);
  const [{ rows, total }, newByKind, selected] = await Promise.all([
    getInbox(view),
    Promise.all(submissionKinds.map((kind) => getNewSubmissionCount(kind))),
    view.id ? getSubmission(view.id) : null,
  ]);
  const withCount = (label: string, count: number) => (count > 0 ? `${label} (${count})` : label);

  return (
    <>
      <AdminPageHeader title={t("admin.nav.inbox")} intro={t("admin.inbox.intro")} />

      <div className="mb-6 flex flex-col gap-3">
        <FilterLinks
          label={t("admin.inbox.kindFilter")}
          align="start"
          options={[
            {
              key: "all",
              label: withCount(
                t("admin.inbox.all"),
                newByKind.reduce((sum, count) => sum + count, 0),
              ),
              href: inboxHref({ ...view, kind: null, page: 1, id: null }),
              active: view.kind === null,
            },
            ...submissionKinds.map((kind, index) => ({
              key: kind,
              label: withCount(t(submissionKindLabelKeys[kind]), newByKind[index]),
              href: inboxHref({ ...view, kind, page: 1, id: null }),
              active: view.kind === kind,
            })),
          ]}
        />
        <FilterLinks
          label={t("admin.inbox.statusFilter")}
          align="start"
          options={[
            {
              key: "all",
              label: t("admin.inbox.allButSpam"),
              href: inboxHref({ ...view, status: null, page: 1, id: null }),
              active: view.status === null,
            },
            ...submissionStatuses.map((status) => ({
              key: status,
              label: t(submissionStatusLabelKeys[status]),
              href: inboxHref({ ...view, status, page: 1, id: null }),
              active: view.status === status,
            })),
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <p className="border border-line p-8 text-center text-muted">{t("admin.inbox.empty")}</p>
      ) : (
        <InboxTable rows={rows} view={view} />
      )}

      <Pagination
        page={view.page}
        pageCount={Math.ceil(total / INBOX_PAGE_SIZE)}
        hrefFor={(page) => inboxHref({ ...view, page, id: null })}
      />

      {selected && (
        <SubmissionDrawer
          key={selected.id}
          submission={selected}
          closeHref={inboxHref({ ...view, id: null })}
        />
      )}
    </>
  );
}
