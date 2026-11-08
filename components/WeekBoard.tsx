import type { PlanWeek, Run } from "@/lib/types";
import { addDays, dayNum, dowShort, fmtRange, today } from "@/lib/dates";
import { fmtKm, fmtPace } from "@/lib/format";

const TYPE_LABEL: Record<string, string> = {
  E: "Easy",
  L: "Lungo",
  T: "Soglia",
  I: "Intervalli",
  R: "Allunghi",
  M: "Ritmo gara",
  X: "Altro",
  GARA: "Gara",
};

export function WeekBoard({
  week,
  runs,
  phase,
  monday,
  isNext = false,
}: {
  week?: PlanWeek;
  runs: Run[];
  phase?: string;
  monday: string;
  isNext?: boolean;
}) {
  const t = today();
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const sunday = days[6];
  const weekRuns = runs.filter((r) => r.date >= monday && r.date <= sunday);
  const doneKm = weekRuns.filter((r) => r.type === "Run").reduce((s, r) => s + r.km, 0);
  const target = week?.targetKm ?? 0;
  const pct = target ? Math.min(100, (doneKm / target) * 100) : 0;
  const plannedKm = week?.sessions.reduce((s, x) => s + x.km, 0) ?? 0;

  return (
    <section className="section">
      <div className="section__head">
        <h2 className="section__title">{isNext ? "Prossima settimana" : "Questa settimana"}</h2>
        <span className="section__meta">
          {week ? `Settimana ${week.n} di 21 · ` : ""}
          {fmtRange(monday, sunday)}
        </span>
      </div>

      <div className="weekbar">
        <span className="weekbar__done">{fmtKm(doneKm, 1)}</span>
        <span className="weekbar__target">
          / {target ? `${target} km` : "— km"}
          {week && plannedKm && plannedKm !== target ? ` (sedute: ${plannedKm})` : ""}
        </span>
        {phase && <span className="weekbar__phase">{phase}</span>}
      </div>
      <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="days">
        {days.map((d) => {
          const planned = week?.sessions.filter((s) => s.date === d) ?? [];
          const done = weekRuns.filter((r) => r.date === d);
          const isToday = d === t;
          const isPast = d < t;
          const cls = ["day", isToday && "day--today", isPast && "day--past"].filter(Boolean).join(" ");
          return (
            <div key={d} className={cls}>
              <div className="day__date">
                <span>{dowShort(d)}</span>
                <b>{dayNum(d)}</b>
              </div>
              <div className="day__body">
                {planned.length === 0 && done.length === 0 && (
                  <span className="day__rest">{week ? "riposo" : "—"}</span>
                )}
                {planned.map((s, i) => (
                  <div className="plan" key={i}>
                    <div className="plan__row">
                      <span className={`badge badge--${s.type}`}>{s.type === "X" ? "·" : s.type}</span>
                      <span className="plan__title">{s.title || TYPE_LABEL[s.type]}</span>
                      {s.km > 0 && <span className="plan__km">{s.km} km</span>}
                    </div>
                    {s.pace && <span className="plan__pace">{s.pace} /km</span>}
                    {s.detail && <span className="plan__detail">{s.detail}</span>}
                  </div>
                ))}
                {done.map((r) => (
                  <div className="done" key={r.id} title={r.name}>
                    <span className="done__check">✓</span>
                    <span className="done__main">
                      {fmtKm(r.km, 1)} km
                      {r.type === "Run" && r.paceSecPerKm ? ` · ${fmtPace(r.paceSecPerKm)}` : ""}
                    </span>
                    {r.rpe !== null && <span className="done__rpe">RPE {r.rpe}</span>}
                    <span className="done__name">{r.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {week?.note && <p className="note note--italic">{week.note}</p>}
      {!week && (
        <p className="note">
          Nessuna settimana pianificata per queste date: aggiungila in <code>data/plan.json</code>.
        </p>
      )}
    </section>
  );
}
