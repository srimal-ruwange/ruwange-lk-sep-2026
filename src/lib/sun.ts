/** Sunrise / sunset for a lat/lon (NOAA-style sunrise equation, ±2 min).
 *  Pass an instant near local noon of the day you want, e.g. from `localNoon()`. */
const D2R = Math.PI / 180;

function toJulian(ms: number) {
  return ms / 86400000 + 2440587.5;
}
function fromJulian(j: number) {
  return new Date((j - 2440587.5) * 86400000);
}

export function solarTimes(nearNoon: Date, lat: number, lon: number) {
  const J = toJulian(nearNoon.getTime());
  const n = Math.ceil(J - 2451545.0 + 0.0008);
  const jStar = n - lon / 360;
  const M = ((357.5291 + 0.98560028 * jStar) % 360) * D2R;
  const C = 1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M);
  const lambda = ((M / D2R + C + 180 + 102.9372) % 360) * D2R;
  const jTransit = 2451545.0 + jStar + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * lambda);
  const decl = Math.asin(Math.sin(lambda) * Math.sin(23.4397 * D2R));
  const cosOmega =
    (Math.sin(-0.833 * D2R) - Math.sin(lat * D2R) * Math.sin(decl)) / (Math.cos(lat * D2R) * Math.cos(decl));
  const omega = Math.acos(Math.min(1, Math.max(-1, cosOmega))) / D2R;
  return { sunrise: fromJulian(jTransit - omega / 360), sunset: fromJulian(jTransit + omega / 360), noon: fromJulian(jTransit) };
}

/** The instant of 12:00 on `now`'s calendar date in the given IANA zone, shifted by `dayOffset` days. */
export function localNoon(now: Date, timeZone: string, dayOffset = 0) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  // build noon UTC of that date, then correct by the zone's offset at that moment
  const guess = new Date(Date.UTC(get("year"), get("month") - 1, get("day") + dayOffset, 12));
  const offsetMin = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(guess)
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = offsetMin.match(/([+-])(\d{2}):?(\d{2})?/);
  const off = m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
  return new Date(guess.getTime() - off * 60000);
}

/** "2h 14m" style countdown. */
export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}
