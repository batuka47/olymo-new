import type { AdPlacement } from "@/config/ads";
import { ulaanbaatarDate, ulaanbaatarDayStart } from "@/lib/dates";
import type { Database } from "@/lib/supabase/types";

type AdRow = Database["public"]["Tables"]["ads"]["Row"];

/** Everything the ad form edits. Dates are calendar days in Ulaanbaatar ("2026-10-05"). */
export interface AdFormValues {
  title: string;
  linkUrl: string;
  placement: AdPlacement;
  imagePath: string | null;
  imagePathMobile: string | null;
  startDate: string;
  /** Last day shown, inclusive; "" for no end. */
  endDate: string;
  isActive: boolean;
}

export function emptyAdValues(now = new Date()): AdFormValues {
  return {
    title: "",
    linkUrl: "",
    placement: "home_1",
    imagePath: null,
    imagePathMobile: null,
    startDate: ulaanbaatarDate(now),
    endDate: "",
    isActive: true,
  };
}

export function adRowToValues(row: AdRow): AdFormValues {
  return {
    title: row.title,
    linkUrl: row.link_url,
    placement: row.placement as AdPlacement,
    imagePath: row.image_path,
    imagePathMobile: row.image_path_mobile,
    startDate: ulaanbaatarDate(row.starts_at),
    endDate: row.ends_at ? lastDay(row.ends_at) : "",
    isActive: row.is_active,
  };
}

/** ends_at is exclusive (the next midnight); the last day shown is the day before it. */
export function lastDay(endsAt: string): string {
  return ulaanbaatarDate(new Date(Date.parse(endsAt) - 1));
}

/** The stored instants: start of the first day, and midnight after the last day. */
export function adDatesToInstants(startDate: string, endDate: string | null) {
  return {
    starts_at: ulaanbaatarDayStart(startDate),
    ends_at: endDate ? ulaanbaatarDayStart(endDate, 1) : null,
  };
}
