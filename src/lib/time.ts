export function formatTime(date: Date, tz: string, seconds = true) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    ...(seconds ? { second: "2-digit" } : {}),
    hour12: false,
  }).format(date);
}

/** Minutes a time zone is ahead of UTC at the given instant. */
export function tzOffsetMinutes(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** e.g. "−4:30" difference of tz relative to base tz. */
export function tzDiffLabel(date: Date, tz: string, base: string) {
  const diff = tzOffsetMinutes(date, tz) - tzOffsetMinutes(date, base);
  if (diff === 0) return "±0:00";
  const sign = diff > 0 ? "+" : "−";
  const abs = Math.abs(diff);
  return `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, "0")}`;
}
