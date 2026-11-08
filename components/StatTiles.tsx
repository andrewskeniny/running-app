import type { Stats } from "@/lib/data";
import { fmtDay } from "@/lib/dates";
import { fmtInt, fmtKm } from "@/lib/format";

export function StatTiles({ stats, vdot }: { stats: Stats; vdot: number }) {
  return (
    <section className="section">
      <div className="section__head">
        <h2 className="section__title">In numeri</h2>
        <span className="section__meta">solo corse, escursioni escluse</span>
      </div>
      <div className="tiles">
        <div className="tile">
          <span className="tile__label">Km nel {stats.year}</span>
          <span className="tile__value">{fmtInt(stats.kmYear)}<small>km</small></span>
          <span className="tile__sub">{stats.runsYear} uscite</span>
        </div>
        <div className="tile">
          <span className="tile__label">Ultimi 28 giorni</span>
          <span className="tile__value">{fmtInt(stats.km28)}<small>km</small></span>
          <span className="tile__sub">{fmtKm(stats.km28 / 4, 0)} km a settimana</span>
        </div>
        <div className="tile">
          <span className="tile__label">Lungo più lungo · 8 sett.</span>
          <span className="tile__value">
            {stats.longest8w ? fmtKm(stats.longest8w.km, 1) : "–"}<small>km</small>
          </span>
          <span className="tile__sub">{stats.longest8w ? fmtDay(stats.longest8w.date) : ""}</span>
        </div>
        <div className="tile">
          <span className="tile__label">VDOT stimato</span>
          <span className="tile__value">{vdot}</span>
          <span className="tile__sub">da 10 km in 46:04, non al limite</span>
        </div>
      </div>
    </section>
  );
}
