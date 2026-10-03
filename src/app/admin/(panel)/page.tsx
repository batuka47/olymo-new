import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminRoutes } from "@/config/admin";
import { adPlacementLabelKeys, type AdPlacement } from "@/config/ads";
import { lastDay } from "@/lib/ads/form";
import { publicStatuses } from "@/lib/articles/status";
import { requireStaff } from "@/lib/auth/staff";
import { formatShortDate, startOfWeekInUlaanbaatar } from "@/lib/dates";
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

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRING_DAYS = 3;

/** Active ads whose last moment falls within the next 3 days, soonest first. */
async function getExpiringAds(now: Date) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ads")
    .select("id, title, placement, ends_at")
    .eq("is_active", true)
    .gt("ends_at", now.toISOString())
    .lte("ends_at", new Date(now.getTime() + EXPIRING_DAYS * DAY_MS).toISOString())
    .order("ends_at", { ascending: true });
  return data ?? [];
}

type ExpiringAd = Awaited<ReturnType<typeof getExpiringAds>>[number];

function ExpiringAds({ ads }: { ads: ExpiringAd[] }) {
  return (
    <section className="border border-line p-5">
      <h2 className="font-display text-lg font-bold">{t("admin.ads.expiring.title")}</h2>
      {ads.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{t("admin.ads.expiring.empty")}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {ads.map((ad) => (
            <li key={ad.id} className="flex flex-wrap items-center justify-between gap-x-4">
              <Link
                href={`${adminRoutes.ads}/${ad.id}`}
                className="inline-flex min-h-11 items-center font-semibold hover:underline"
              >
                {ad.title}
              </Link>
              <span className="font-mono text-xs text-muted">
                {t(adPlacementLabelKeys[ad.placement as AdPlacement])} ·{" "}
                <span className="bg-lime px-1 text-ink">
                  {ad.ends_at &&
                    t("admin.ads.expiring.until", { date: formatShortDate(lastDay(ad.ends_at)) })}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
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
  const [articles, newSubmissions, expiringAds] = await Promise.all([
    getArticleCounts(),
    isAdmin ? getNewSubmissionCount() : null,
    getExpiringAds(new Date()),
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

      <div className="mt-8">
        <ExpiringAds ads={expiringAds} />
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
