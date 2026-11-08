const TZ = "Europe/Rome";

/** YYYY-MM-DD of a Date instant, in Europe/Rome. */
export function localDay(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function today(): string {
  return localDay(new Date());
}

/** Parse YYYY-MM-DD as a UTC-midnight Date (safe for day arithmetic). */
export function toDate(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function fromDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  const d = toDate(day);
  d.setUTCDate(d.getUTCDate() + n);
  return fromDate(d);
}

/** Monday of the ISO week containing `day`. */
export function mondayOf(day: string): string {
  const d = toDate(day);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = Monday
  d.setUTCDate(d.getUTCDate() - dow);
  return fromDate(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86400000);
}

const DOW_IT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MONTH_IT = [
  "gen", "feb", "mar", "apr", "mag", "giu",
  "lug", "ago", "set", "ott", "nov", "dic",
];
const MONTH_IT_LONG = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

export function dowShort(day: string): string {
  return DOW_IT[(toDate(day).getUTCDay() + 6) % 7];
}

export function dayNum(day: string): number {
  return toDate(day).getUTCDate();
}

export function monthShort(day: string): string {
  return MONTH_IT[toDate(day).getUTCMonth()];
}

export function fmtDay(day: string): string {
  const d = toDate(day);
  return `${d.getUTCDate()} ${MONTH_IT[d.getUTCMonth()]}`;
}

export function fmtDayLong(day: string): string {
  const d = toDate(day);
  return `${DOW_IT[(d.getUTCDay() + 6) % 7]} ${d.getUTCDate()} ${MONTH_IT_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function fmtRange(start: string, end: string): string {
  const a = toDate(start);
  const b = toDate(end);
  if (a.getUTCMonth() === b.getUTCMonth()) {
    return `${a.getUTCDate()}–${b.getUTCDate()} ${MONTH_IT[a.getUTCMonth()]}`;
  }
  return `${a.getUTCDate()} ${MONTH_IT[a.getUTCMonth()]} – ${b.getUTCDate()} ${MONTH_IT[b.getUTCMonth()]}`;
}
