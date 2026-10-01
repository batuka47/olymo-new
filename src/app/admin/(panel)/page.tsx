import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminRoutes } from "@/config/admin";
import { publicStatuses } from "@/lib/articles/status";
import { requireStaff } from "@/lib/auth/staff";
import { startOfWeekInUlaanbaatar } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { CleanImagesForm } from "./clean-images-form";

export const metadata: Metadata = { title: t("admin.dashboard.title") };

async function getArticleCounts() {
  const supabase = await createClient();
  const now = new Date();
  const count = () => supabase.from("articles").select("id", { count: "exact", head: true });

  const [drafts, scheduled, publishedThisWeek] = await Promise.all([
    count().eq("status", "draft"),
    count().in("status", publicStatuses).gt("publish_at", now.toISOString()),
    count()
      .in("status", publicStatuses)
      .gte("publish_at", startOfWeekInUlaanbaatar(now).toISOString())
      .lte("publish_at", now.toISOString()),
  ]);

  return {
    drafts: drafts.count ?? 0,
    scheduled: scheduled.count ?? 0,
    publishedThisWeek: publishedThisWeek.count ?? 0,
  };
}

async function getNewSubmissionCount() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  return count ?? 0;
}

interface StatCardProps {
  label: string;
  value: number;
  href: string;
}

function StatCard({ label, value, href }: StatCardProps) {
  return (
    <Link href={href} className="flex flex-col gap-3 border border-ink p-5 hover:bg-stone">
      <span className="font-mono text-[11px] tracking-label text-muted uppercase">{label}</span>
      <span className="font-display text-4xl font-bold">{value}</span>
    </Link>
  );
}

function PlaceholderPanel({ title }: { title: string }) {
  return (
    <section className="border border-line p-5">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted">{t("admin.comingSoon")}</p>
    </section>
  );
}

export default async function AdminDashboardPage() {
  const staff = await requireStaff();
  const isAdmin = staff.role === "admin";
  const [articles, newSubmissions] = await Promise.all([
    getArticleCounts(),
    isAdmin ? getNewSubmissionCount() : null,
  ]);

  return (
    <>
      <AdminPageHeader title={t("admin.dashboard.title")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("admin.dashboard.drafts")}
          value={articles.drafts}
          href={`${adminRoutes.articles}?status=draft`}
        />
        <StatCard
          label={t("admin.dashboard.scheduled")}
          value={articles.scheduled}
          href={`${adminRoutes.articles}?status=scheduled`}
        />
        <StatCard
          label={t("admin.dashboard.publishedThisWeek")}
          value={articles.publishedThisWeek}
          href={`${adminRoutes.articles}?status=published`}
        />
        {newSubmissions !== null && (
          <StatCard
            label={t("admin.dashboard.newSubmissions")}
            value={newSubmissions}
            href={adminRoutes.submissions}
          />
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlaceholderPanel title={t("admin.dashboard.recentTitle")} />
        <PlaceholderPanel title={t("admin.dashboard.activityTitle")} />
      </div>

      {isAdmin && (
        <section className="mt-8 border border-line p-5">
          <h2 className="font-display text-lg font-bold">{t("admin.cleanup.title")}</h2>
          <p className="mt-2 mb-4 max-w-2xl text-sm text-muted">{t("admin.cleanup.description")}</p>
          <CleanImagesForm />
        </section>
      )}
    </>
  );
}
