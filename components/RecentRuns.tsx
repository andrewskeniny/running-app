import type { Run } from "@/lib/types";
import { fmtDay, dowShort } from "@/lib/dates";
import { fmtDuration, fmtKm, fmtPace } from "@/lib/format";

export function RecentRuns({ runs, limit = 10 }: { runs: Run[]; limit?: number }) {
  const recent = [...runs].reverse().slice(0, limit);
  return (
    <section className="section">
      <div className="section__head">
        <h2 className="section__title">Ultime uscite</h2>
        <span className="section__meta">dall&apos;archivio Strava</span>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Nome</th>
            <th className="num">Km</th>
            <th className="num">Ritmo</th>
            <th className="num hide-sm">Tempo</th>
            <th className="num hide-sm">D+</th>
            <th className="num">RPE</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((r) => (
            <tr key={r.id}>
              <td className="mono" style={{ whiteSpace: "nowrap" }}>
                <span className="muted">{dowShort(r.date)}</span> {fmtDay(r.date)}
              </td>
              <td className="name" title={r.name}>
                {r.name}
                {r.type !== "Run" && <span className="muted"> · {r.type}</span>}
              </td>
              <td className="num">{fmtKm(r.km, 1)}</td>
              <td className="num">{r.type === "Run" ? fmtPace(r.paceSecPerKm) : "–"}</td>
              <td className="num hide-sm">{fmtDuration(r.movingSec)}</td>
              <td className="num hide-sm muted">{Math.round(r.elevGain)}</td>
              <td className={`num${r.rpe === null ? " muted" : ""}`}>{r.rpe ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
