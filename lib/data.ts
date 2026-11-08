import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import type { Plan, PlanWeek, Run, WeekSummary } from "./types";
import { addDays, localDay, mondayOf, today } from "./dates";
import planJson from "../data/plan.json";

const DATA_DIR = path.join(process.cwd(), "data");

export function loadPlan(): Plan {
  return planJson as unknown as Plan;
}

/* ---------- Strava archive CSV ---------- */

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/** "Nov 8, 2026, 9:52:15 AM" (UTC) -> Date */
function parseStravaDate(s: string): Date | null {
  const m = s.match(/^(\w{3}) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}):(\d{2}) (AM|PM)$/);
  if (!m) return null;
  let h = Number(m[4]);
  if (m[7] === "PM" && h < 12) h += 12;
  if (m[7] === "AM" && h === 12) h = 0;
  return new Date(Date.UTC(Number(m[3]), MONTHS[m[1]], Number(m[2]), h, Number(m[5]), Number(m[6])));
}

/** Estimate sRPE when it wasn't logged, from pace. Marked as estimated. */
function estimateRpe(paceSecPerKm: number, type: string): number {
  if (type !== "Run") return 4;
  if (!paceSecPerKm) return 4;
  if (paceSecPerKm >= 330) return 3; // >= 5:30
  if (paceSecPerKm >= 300) return 5; // 5:00–5:30
  if (paceSecPerKm >= 280) return 6; // 4:40–5:00
  return 8;
}

export function loadRuns(): Run[] {
  const csv = fs.readFileSync(path.join(DATA_DIR, "activities.csv"), "utf8");
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: true });
  const rows = parsed.data;
  if (rows.length < 2) return [];
  const header = rows[0];

  // Strava repeats some column names (Distance, Elapsed Time...). The first
  // "Distance" is km with 2 decimals, the second is metres. Take all indices.
  const idx = (name: string): number[] =>
    header.map((h, i) => (h.trim() === name ? i : -1)).filter((i) => i >= 0);
  const first = (name: string) => idx(name)[0] ?? -1;
  const distIdx = idx("Distance");
  const distMetersIdx = distIdx.length > 1 ? distIdx[1] : distIdx[0];
  const iId = first("Activity ID");
  const iDate = first("Activity Date");
  const iName = first("Activity Name");
  const iType = first("Activity Type");
  const iMoving = first("Moving Time");
  const iElev = first("Elevation Gain");
  const iRpe = first("Perceived Exertion");
  const iHr = idx("Average Heart Rate").pop() ?? -1;

  const num = (v: string | undefined): number => {
    if (v === undefined || v === "") return NaN;
    const n = Number(v);
    return isNaN(n) ? NaN : n;
  };

  const runs: Run[] = [];
  for (const r of rows.slice(1)) {
    const d = parseStravaDate(r[iDate] ?? "");
    if (!d) continue;
    let km = num(r[distMetersIdx]);
    if (!isNaN(km) && km > 1000) km = km / 1000; // metres -> km
    if (isNaN(km)) km = num(r[distIdx[0]]);
    if (isNaN(km)) continue;
    const movingSec = num(r[iMoving]);
    const pace = movingSec && km ? movingSec / km : 0;
    const type = r[iType] ?? "Run";
    const rpeRaw = num(r[iRpe]);
    const rpe = isNaN(rpeRaw) ? null : rpeRaw;
    const rpeUsed = rpe ?? estimateRpe(pace, type);
    const hr = num(r[iHr]);
    runs.push({
      id: r[iId],
      date: localDay(d),
      startISO: d.toISOString(),
      name: r[iName] ?? "",
      type,
      km,
      movingSec: isNaN(movingSec) ? 0 : movingSec,
      paceSecPerKm: pace,
      elevGain: isNaN(num(r[iElev])) ? 0 : num(r[iElev]),
      rpe,
      rpeEstimated: rpe === null,
      load: Math.round(rpeUsed * ((isNaN(movingSec) ? 0 : movingSec) / 60)),
      avgHr: isNaN(hr) ? null : hr,
    });
  }
  runs.sort((a, b) => a.startISO.localeCompare(b.startISO));
  return runs;
}

/* ---------- Aggregations ---------- */

export function onlyRuns(runs: Run[]): Run[] {
  return runs.filter((r) => r.type === "Run");
}

/**
 * Weekly summaries from `fromMonday` to the last plan week (inclusive),
 * so the chart shows history and the plan on one axis.
 */
export function weeklySummaries(runs: Run[], plan: Plan, fromMonday: string): WeekSummary[] {
  const t = today();
  const thisMonday = mondayOf(t);
  const lastPlan = plan.weeks[plan.weeks.length - 1];
  const end = lastPlan ? lastPlan.start : thisMonday;
  const planByStart = new Map<string, PlanWeek>(plan.weeks.map((w) => [w.start, w]));

  const out: WeekSummary[] = [];
  for (let m = fromMonday; m <= end; m = addDays(m, 7)) {
    const sunday = addDays(m, 6);
    const inWeek = runs.filter((r) => r.type === "Run" && r.date >= m && r.date <= sunday);
    const pw = planByStart.get(m);
    out.push({
      start: m,
      end: sunday,
      km: inWeek.reduce((s, r) => s + r.km, 0),
      runs: inWeek.length,
      longest: inWeek.reduce((s, r) => Math.max(s, r.km), 0),
      load: inWeek.reduce((s, r) => s + r.load, 0),
      planN: pw?.n,
      targetKm: pw?.targetKm,
      race: pw?.race,
      isCurrent: m === thisMonday,
      isFuture: m > thisMonday,
    });
  }
  return out;
}

export function currentPlanWeek(plan: Plan): PlanWeek | undefined {
  const m = mondayOf(today());
  return plan.weeks.find((w) => w.start === m);
}

export function nextPlanWeek(plan: Plan): PlanWeek | undefined {
  const m = mondayOf(today());
  return plan.weeks.find((w) => w.start > m);
}

export function phaseOf(plan: Plan, n: number) {
  return plan.phases.find((p) => n >= p.from && n <= p.to);
}

export interface Stats {
  kmYear: number;
  runsYear: number;
  km28: number;
  longest8w: { km: number; date: string } | null;
  weeksToRace: number;
  daysToRace: number;
  year: number;
}

export function computeStats(runs: Run[], plan: Plan): Stats {
  const t = today();
  const year = Number(t.slice(0, 4));
  const rs = onlyRuns(runs);
  const yearRuns = rs.filter((r) => r.date.startsWith(String(year)));
  const d28 = addDays(t, -27);
  const d56 = addDays(t, -55);
  const last8 = rs.filter((r) => r.date >= d56 && r.date <= t);
  const longest = last8.reduce<Run | null>((best, r) => (!best || r.km > best.km ? r : best), null);
  const daysToRace = Math.max(
    0,
    Math.round((Date.UTC(
      Number(plan.race.date.slice(0, 4)),
      Number(plan.race.date.slice(5, 7)) - 1,
      Number(plan.race.date.slice(8, 10)),
    ) - Date.UTC(Number(t.slice(0, 4)), Number(t.slice(5, 7)) - 1, Number(t.slice(8, 10)))) / 86400000),
  );
  return {
    kmYear: yearRuns.reduce((s, r) => s + r.km, 0),
    runsYear: yearRuns.length,
    km28: rs.filter((r) => r.date >= d28 && r.date <= t).reduce((s, r) => s + r.km, 0),
    longest8w: longest ? { km: longest.km, date: longest.date } : null,
    weeksToRace: Math.floor(daysToRace / 7),
    daysToRace,
    year,
  };
}
