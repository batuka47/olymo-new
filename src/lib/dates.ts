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

const dateFormat = new Intl.DateTimeFormat("mn-MN", {
  timeZone: "Asia/Ulaanbaatar",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDateTime(value: string | Date): string {
  return dateTimeFormat.format(new Date(value));
}

export function formatDate(value: string | Date): string {
  return dateFormat.format(new Date(value));
}

/** An instant as the value of an <input type="datetime-local"> in Ulaanbaatar time. */
export function toUlaanbaatarInputValue(value: string | Date): string {
  return new Date(new Date(value).getTime() + ULAANBAATAR_OFFSET_MS).toISOString().slice(0, 16);
}

/** Reads an <input type="datetime-local"> value ("2026-10-05T09:00") as Ulaanbaatar time. */
export function fromUlaanbaatarInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const [, year, month, day, hour, minute] = match.map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - ULAANBAATAR_OFFSET_MS);
}
