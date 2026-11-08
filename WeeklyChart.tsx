"use client";

import { useEffect, useRef, useState } from "react";
import type { WeekSummary } from "@/lib/types";
import { fmtRange, monthShort, toDate } from "@/lib/dates";
import { fmtInt, fmtKm } from "@/lib/format";

interface Props {
  weeks: WeekSummary[];
}

function niceStep(max: number): number {
  for (const c of [5, 10, 20, 25, 50, 100]) if (max / c <= 5) return c;
  return 100;
}

export function WeeklyChart({ weeks }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.max(280, e.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 250;
  const padL = 34;
  const padR = 14;
  const padT = 16;
  const padB = 26;
  const innerW = width - padL - padR;
  const innerH = H - padT - padB;
  const n = weeks.length;
  const slot = innerW / Math.max(1, n - 1);

  const maxV = Math.max(10, ...weeks.map((w) => Math.max(w.km, w.targetKm ?? 0)));
  const step = niceStep(maxV);
  const yMax = Math.ceil(maxV / step) * step;
  const y = (v: number) => padT + innerH - (v / yMax) * innerH;
  const x = (i: number) => padL + i * slot;

  const ticks: number[] = [];
  for (let v = 0; v <= yMax; v += step) ticks.push(v);

  // month labels where the month changes
  const monthLabels: { i: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((w, i) => {
    const m = toDate(w.end).getUTCMonth();
    if (m !== lastMonth) {
      monthLabels.push({ i, label: monthShort(w.end) });
      lastMonth = m;
    }
  });

  // actual line: past weeks + current week
  const actualIdx = weeks.map((w, i) => (w.isFuture ? -1 : i)).filter((i) => i >= 0);
  const actualPath = actualIdx.map((i, k) => `${k === 0 ? "M" : "L"}${x(i)},${y(weeks[i].km)}`).join(" ");

  // plan line: every week with a target
  const planIdx = weeks.map((w, i) => (w.targetKm ? i : -1)).filter((i) => i >= 0);
  const planPath = planIdx.map((i, k) => `${k === 0 ? "M" : "L"}${x(i)},${y(weeks[i].targetKm!)}`).join(" ");

  const todayIdx = weeks.findIndex((w) => w.isCurrent);
  const hw = hover !== null ? weeks[hover] : null;

  const pick = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = clientX - rect.left - padL;
    const i = Math.round(px / slot);
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div className="chart" ref={ref}>
      <svg
        width={width}
        height={H}
        viewBox={`0 0 ${width} ${H}`}
        role="img"
        aria-label="Chilometri a settimana, piano e fatto"
        onMouseMove={(e) => pick(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => pick(e.touches[0].clientX)}
        onTouchMove={(e) => pick(e.touches[0].clientX)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line className="grid" x1={padL} x2={width - padR} y1={y(v)} y2={y(v)} />
            <text x={padL - 8} y={y(v) + 4} textAnchor="end">{fmtInt(v)}</text>
          </g>
        ))}
        <line className="axis" x1={padL} x2={width - padR} y1={y(0)} y2={y(0)} />

        {todayIdx >= 0 && (
          <line className="today-line" x1={x(todayIdx)} x2={x(todayIdx)} y1={padT} y2={y(0)} />
        )}

        {hover !== null && (
          <line className="crosshair" x1={x(hover)} x2={x(hover)} y1={padT} y2={y(0)} />
        )}

        {planPath && <path className="line line--plan" d={planPath} />}
        {planIdx.map((i) => (
          <circle
            key={`p${i}`}
            className={`dot dot--plan${weeks[i].race ? " dot--race" : ""}${hover === i ? " dot--hover" : ""}`}
            cx={x(i)}
            cy={y(weeks[i].targetKm!)}
            r={weeks[i].race ? 5 : 3.5}
          />
        ))}

        {actualPath && <path className="line line--actual" d={actualPath} />}
        {actualIdx.map((i) => (
          <circle
            key={`a${i}`}
            className={`dot dot--actual${weeks[i].isCurrent ? " dot--current" : ""}${hover === i ? " dot--hover" : ""}`}
            cx={x(i)}
            cy={y(weeks[i].km)}
            r={4}
          />
        ))}

        {monthLabels.map((m) => (
          <text key={m.i} x={x(m.i)} y={H - 8} textAnchor={m.i === 0 ? "start" : "middle"}>{m.label}</text>
        ))}
        {weeks.map((w, i) =>
          w.race ? (
            <text key="race" x={x(i)} y={padT - 4} textAnchor="end" className="label-today">gara</text>
          ) : null,
        )}
      </svg>

      {hw && hover !== null && (
        <div
          className="tooltip"
          style={{
            left: x(hover),
            top: y(Math.max(hw.isFuture ? 0 : hw.km, hw.targetKm ?? 0)) + 14,
          }}
        >
          <div>{hw.planN ? `Sett. ${hw.planN} · ` : ""}{fmtRange(hw.start, hw.end)}</div>
          {!hw.isFuture && (
            <div>
              <b>{fmtKm(hw.km, 1)} km</b>{hw.isCurrent ? " finora" : ""}
              {hw.runs > 0 ? ` · ${hw.runs} uscite · lungo ${fmtKm(hw.longest, 1)}` : ""}
            </div>
          )}
          {hw.targetKm ? <div>piano <b>{hw.targetKm} km</b>{hw.race ? " + maratona" : ""}</div> : null}
        </div>
      )}

      <div className="legend">
        <span className="legend__item"><span className="legend__swatch legend__swatch--actual" />fatto</span>
        <span className="legend__item"><span className="legend__swatch legend__swatch--planline" />piano</span>
      </div>
    </div>
  );
}
