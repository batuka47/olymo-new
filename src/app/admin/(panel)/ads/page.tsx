import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { buttonClasses } from "@/components/ui/button";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { Tag, type TagVariant } from "@/components/ui/tag";
import { adminRoutes } from "@/config/admin";
import { adFormat, adPlacementLabelKeys, type AdPlacement } from "@/config/ads";
import { lastDay } from "@/lib/ads/form";
import { adState, adStateLabelKeys, clickThroughRate, type AdState } from "@/lib/ads/status";
import { requireStaff } from "@/lib/auth/staff";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { AdActiveToggle } from "./ad-active-toggle";
import { AdRowActions } from "./ad-row-actions";

export const metadata: Metadata = { title: t("admin.ads.title") };

const stateTagVariants: Record<AdState, TagVariant> = {
  running: "lime",
  scheduled: "outline",
  ended: "outline",
  paused: "ink",
};

const cellClasses = "px-4 py-3 align-top";
const numberColumns = new Set(["impressions", "clicks", "ctr"]);
const numberClasses = `${cellClasses} text-right font-mono tabular-nums`;

async function getAds() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ads")
    .select(
      "id, title, link_url, placement, image_path, starts_at, ends_at, is_active, impression_count, click_count, updated_at",
    )
    .order("starts_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data;
}

function linkHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export default async function AdminAdsPage() {
  await requireStaff();
  const ads = await getAds();
  const now = new Date();
  const columns = [
    "image",
    "title",
    "placement",
    "dates",
    "active",
    "impressions",
    "clicks",
    "ctr",
    "actions",
  ] as const;

  return (
    <>
      <AdminPageHeader
        title={t("admin.ads.title")}
        actions={
          <Link href={`${adminRoutes.ads}/new`} className={buttonClasses({ size: "lg" })}>
            + {t("admin.ads.new")}
          </Link>
        }
      />

      {ads.length === 0 ? (
        <p className="border border-line p-8 text-center text-muted">{t("admin.ads.empty")}</p>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-260 border-collapse text-left text-sm">
            <thead className="font-mono text-[11px] tracking-label text-muted uppercase">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className={cx(
                      "px-4 py-3 font-normal",
                      numberColumns.has(column) && "text-right",
                    )}
                  >
                    {t(`admin.ads.columns.${column}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => {
                const placement = ad.placement as AdPlacement;
                const state = adState(ad, now);
                return (
                  <tr key={ad.id} className="border-t border-line">
                    <td className={cellClasses}>
                      <ResponsiveImage
                        path={ad.image_path}
                        version={ad.updated_at}
                        alt=""
                        sizes="160px"
                        className={
                          adFormat(placement).mobile
                            ? "aspect-1248/140 w-40"
                            : "aspect-300/250 w-20"
                        }
                      />
                    </td>
                    <td className={`${cellClasses} max-w-64`}>
                      <Link
                        href={`${adminRoutes.ads}/${ad.id}`}
                        className="text-[15px] font-semibold hover:underline"
                      >
                        {ad.title}
                      </Link>
                      <p className="mt-1 truncate font-mono text-[11px] text-muted">
                        {linkHost(ad.link_url)}
                      </p>
                    </td>
                    <td className={cellClasses}>{t(adPlacementLabelKeys[placement])}</td>
                    <td className={`${cellClasses} whitespace-nowrap`}>
                      <Tag variant={stateTagVariants[state]}>{t(adStateLabelKeys[state])}</Tag>
                      <p className="mt-1.5 font-mono text-xs">
                        {formatDate(ad.starts_at)} –{" "}
                        {ad.ends_at ? formatDate(lastDay(ad.ends_at)) : t("admin.ads.noEnd")}
                      </p>
                    </td>
                    <td className={cellClasses}>
                      <AdActiveToggle id={ad.id} active={ad.is_active} />
                    </td>
                    <td className={numberClasses}>{ad.impression_count.toLocaleString("mn-MN")}</td>
                    <td className={numberClasses}>{ad.click_count.toLocaleString("mn-MN")}</td>
                    <td className={numberClasses}>
                      {clickThroughRate(ad.click_count, ad.impression_count) ?? "—"}
                    </td>
                    <td className={cellClasses}>
                      <AdRowActions id={ad.id} title={ad.title} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
