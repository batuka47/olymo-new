// Asia/Ulaanbaatar is UTC+8 all year (no daylight saving time).
const ULAANBAATAR_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Monday 00:00 of the current week in Ulaanbaatar, as an absolute instant. */
export function startOfWeekInUlaanbaatar(now: Date): Date {
  const local = new Date(now.getTime() + ULAANBAATAR_OFFSET_MS);
  const daysSinceMonday = (local.getUTCDay() + 6) % 7;
  const mondayLocal = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() - daysSinceMonday,
  );
  return new Date(mondayLocal - ULAANBAATAR_OFFSET_MS);
}

const dateTimeFormat = new Intl.DateTimeFormat("mn-MN", {
  timeZone: "Asia/Ulaanbaatar",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(value: string | Date): string {
  return dateTimeFormat.format(new Date(value));
}
