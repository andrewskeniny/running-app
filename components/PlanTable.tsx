import type { Plan, WeekSummary } from "@/lib/types";
import { fmtRange } from "@/lib/dates";
import { fmtKm } from "@/lib/format";
import { phaseOf } from "@/lib/data";

export function PlanTable({ plan, weeks }: { plan: Plan; weeks: WeekSummary[] }) {
  const byStart = new Map(weeks.map((w) => [w.start, w]));
  const maxKm = Math.max(...plan.weeks.map((w) => w.targetKm), 1);
  let lastPhase = "";
  return (
    <section className="section">
      <div className="section__head">
        <h2 className="section__title">Le 21 settimane</h2>
        <span className="section__meta">
          picco {Math.max(...plan.weeks.map((w) => w.targetKm))} km · gara {plan.race.date.split("-").reverse().join("/")}
        </span>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Settimana</th>
            <th className="hide-sm">Fase</th>
            <th className="num">Piano</th>
            <th className="num">Fatto</th>
            <th className="hide-sm" style={{ width: "28%" }}></th>
          </tr>
        </thead>
        <tbody>
          {plan.weeks.map((w) => {
            const s = byStart.get(w.start);
            const phase = phaseOf(plan, w.n)?.name ?? "";
            const showPhase = phase !== lastPhase;
            lastPhase = phase;
            const cls = s?.isCurrent ? "row--current" : s && !s.isFuture ? "row--past" : "";
            const done = s?.km ?? 0;
            return (
              <tr key={w.n} className={cls}>
                <td className="mono muted">{w.n}</td>
                <td>
                  <span className="mono">{fmtRange(w.start, s?.end ?? w.start)}</span>
                  {w.race && <span className="phase-tag"> · gara</span>}
                  {w.note && !w.race && <span className="phase-tag hide-sm"> · {w.note.split(":")[0].split(".")[0]}</span>}
                </td>
                <td className="hide-sm">{showPhase ? <span className="phase-tag">{phase}</span> : ""}</td>
                <td className="num">{w.targetKm}</td>
                <td className={`num${done === 0 ? " muted" : ""}`}>{done > 0 ? fmtKm(done, 0) : "–"}</td>
                <td className="hide-sm">
                  <span className="minibar minibar--plan" style={{ width: `${(w.targetKm / maxKm) * 100}%` }} />
                  {done > 0 && (
                    <>
                      <br />
                      <span className="minibar" style={{ width: `${Math.min(100, (done / maxKm) * 100)}%` }} />
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="note">
        {plan.phases.map((p) => (
          <div key={p.name}>
            <span className="phase-tag">{p.name} · sett. {p.from}–{p.to}</span> — {p.note}
          </div>
        ))}
      </div>
    </section>
  );
}
