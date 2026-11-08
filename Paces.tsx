import type { Plan } from "@/lib/types";

export function Paces({ plan }: { plan: Plan }) {
  return (
    <section className="section">
      <div className="section__head">
        <h2 className="section__title">Ritmi di riferimento</h2>
        <span className="section__meta">VDOT {plan.athlete.vdot} · Daniels</span>
      </div>
      <div className="paces">
        {plan.athlete.paces.map((p) => (
          <div className="pace" key={p.code}>
            <span className="pace__code">{p.code}</span>
            <span className="pace__val">{p.pace}</span>
            <span className="pace__label">{p.label}</span>
          </div>
        ))}
      </div>
      <p className="note">{plan.athlete.vdotNote}. Si aggiorna a ogni test o gara.</p>
    </section>
  );
}
