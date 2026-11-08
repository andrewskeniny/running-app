export type SessionType = "E" | "L" | "T" | "I" | "R" | "M" | "X" | "GARA";

export interface PlannedSession {
  date: string; // YYYY-MM-DD (Europe/Rome)
  type: SessionType;
  title: string;
  km: number;
  pace?: string;
  detail?: string;
}

export interface PlanWeek {
  n: number;
  start: string; // Monday, YYYY-MM-DD
  targetKm: number;
  note?: string;
  race?: boolean;
  sessions: PlannedSession[];
}

export interface Plan {
  race: {
    name: string;
    date: string;
    goalA: string;
    goalB: string;
    goalAPace: string;
    goalBPace: string;
  };
  athlete: {
    vdot: number;
    vdotNote: string;
    paces: { code: string; label: string; pace: string }[];
  };
  phases: { name: string; from: number; to: number; note: string }[];
  weeks: PlanWeek[];
}

export interface Run {
  id: string;
  date: string; // local day YYYY-MM-DD
  startISO: string;
  name: string;
  type: string; // Run, Hike, ...
  km: number;
  movingSec: number;
  paceSecPerKm: number; // 0 if unknown
  elevGain: number;
  rpe: number | null; // 1-10 as logged on Strava
  rpeEstimated: boolean;
  load: number; // session RPE × minutes
  avgHr: number | null;
}

export interface WeekSummary {
  start: string; // Monday
  end: string; // Sunday
  km: number;
  runs: number;
  longest: number;
  load: number;
  planN?: number;
  targetKm?: number;
  race?: boolean;
  isCurrent: boolean;
  isFuture: boolean;
}
