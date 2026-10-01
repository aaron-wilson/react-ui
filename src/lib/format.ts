const utc = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
const longDay = utc({ weekday: "long", month: "long", day: "numeric" });
const monthDay = utc({ month: "short", day: "numeric" });
const dayOnly = utc({ day: "numeric" });
const yearOnly = utc({ year: "numeric" });

/** Parses a calendar date (YYYY-MM-DD) as UTC so the day never shifts with the viewer's zone. */
function calendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "2026-10-15" becomes "Thursday, October 15"; anything else is returned unchanged. */
export function formatDay(value: string) {
  const date = calendarDate(value);
  return date ? longDay.format(date) : value;
}

/** A trip's span, such as "Oct 15 – 17, 2026" or "Oct 30 – Nov 2, 2026". */
export function formatRange(values: readonly string[]) {
  const dates = values.map(calendarDate).filter((date): date is Date => date !== null);
  const first = dates[0];
  const last = dates.at(-1);
  if (!first || !last) return null;
  const year = yearOnly.format(last);
  if (first.getTime() === last.getTime()) return `${monthDay.format(first)}, ${year}`;
  const sameMonth =
    first.getUTCMonth() === last.getUTCMonth() && first.getUTCFullYear() === last.getUTCFullYear();
  const end = sameMonth ? dayOnly.format(last) : monthDay.format(last);
  const start =
    first.getUTCFullYear() === last.getUTCFullYear()
      ? monthDay.format(first)
      : `${monthDay.format(first)}, ${yearOnly.format(first)}`;
  return `${start} – ${end}, ${year}`;
}

export function dayCount(count: number) {
  return `${count} ${count === 1 ? "day" : "days"}`;
}

/** A short relative time for recent saves, falling back to a calendar date. */
export function formatUpdated(value: string, now = Date.now()) {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return null;
  const minutes = Math.floor((now - time) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(time);
}

export const paces = [
  { value: "RELAXED", label: "Relaxed" },
  { value: "BALANCED", label: "Balanced" },
  { value: "BUSY", label: "Busy" },
] as const;
export type PaceValue = (typeof paces)[number]["value"];
export const paceLabel = (value: string) =>
  paces.find((pace) => pace.value === value)?.label ?? value;
