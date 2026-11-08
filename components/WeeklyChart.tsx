"use client";

import { useEffect, useRef, useState } from "react";
import type { WeekSummary } from "@/lib/types";
import { fmtRange, monthShort, toDate } from "@/lib/dates";
import { fmtInt, fmtKm } from "@/lib/format";

type Mode = "km" | "load";

interface Props {
  weeks: WeekSummary[];
  mode: Mode;
}

function niceStep(max: number): number {
  const candidates = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  for (const c of candidates) if (max / c <= 5) return c;
  return 1000;
}

export function WeeklyChart({ weeks, mode }: Props) {
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

  const H = 240;
  const padL = 34;
  const padR = 8;
  const padT = 12;
  const padB = 26;
  const innerW = width - padL - padR;
  const innerH = H - padT - padB;
  const n = weeks.length;
  const slot = innerW / n;
  const barW = Math.min(24, Math.max(4, slot - 2)); // 2px surface gap, ≤24px

  // 4-week rolling average of load (past/current weeks only)
  const rolling: (number | null)[] = weeks.map((w, i) => {
    if (w.isFuture) return null;
    const win = weeks.slice(Math.max(0, i - 3), i + 1).filter((x) => !x.isFuture);
    if (win.length < 2) return null;
    return win.reduce((s, x) => s + x.load, 0) / win.length;
  });

  const values = weeks.map((w) => (mode === "km" ? w.km : w.load));
  const targets = weeks.map((w) => (mode === "km" ? w.targetKm ?? 0 : 0));
  const maxV = Math.max(10, ...values, ...targets, ...(mode === "load" ? rolling.map((r) => r ?? 0) : []));
  const step = niceStep(maxV);
  const yMax = Math.ceil(maxV / step) * step;
  const y = (v: number) => padT + innerH - (v / yMax) * innerH;
  const x = (i: number) => padL + i * slot + (slot - barW) / 2;

  const ticks: number[] = [];
  for (let v = 0; v <= yMax; v += step) ticks.push(v);

  // month labels where the month changes
  const monthLabels: { i: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((w, i) => {
    const m = toDate(w.start).getUTCMonth();
    const endM = toDate(w.end).getUTCMonth();
    const monthHere = m === endM ? m : endM;
    if (monthHere !== lastMonth) {
      // label the first week that is mostly in the new month
      monthLabels.push({ i, label: monthShort(w.end) });
      lastMonth = monthHere;
    }
  });

  const todayIdx = weeks.findIndex((w) => w.isCurrent);
  const linePath = rolling
    .map((v, i) => (v === null ? null : `${x(i) + barW / 2},${y(v)}`))
    .filter(Boolean) as string[];

  const hw = hover !== null ? weeks[hover] : null;

  return (
    <div className="chart" ref={ref}>
      <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img"
        aria-label={mode === "km" ? "Chilometri a settimana, piano e fatto" : "Carico settimanale"}>
        {ticks.map((v) => (
          <g key={v}>
            <line className="grid" x1={padL} x2={width - padR} y1={y(v)} y2={y(v)} />
            <text x={padL - 6} y={y(v) + 4} textAnchor="end">{fmtInt(v)}</text>
          </g>
        ))}
        <line className="axis" x1={padL} x2={width - padR} y1={y(0)} y2={y(0)} />

        {weeks.map((w, i) => {
          const v = values[i];
          const t = targets[i];
          const bx = x(i);
          const bh = Math.max(0, y(0) - y(v));
          const r = Math.min(4, barW / 2);
          return (
            <g key={w.start}>
              {t > 0 && (
                <rect
                  className={`plan-bar${w.race ? " plan-bar--race" : ""}`}
                  x={bx + 0.75}
                  y={y(t)}
                  width={Math.max(1, barW - 1.5)}
                  height={Math.max(0, y(0) - y(t))}
                  rx={r}
                  ry={r}
                />
              )}
              {v > 0 && (
                <path
                  className={`bar${w.isCurrent ? " bar--muted" : ""}`}
                  d={`M${bx},${y(0)} v${-(bh - r)} a${r},${r} 0 0 1 ${r},${-r} h${barW - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${bh - r} z`}
                />
              )}
              <rect
                className="hit"
                x={padL + i * slot}
                y={padT}
                width={slot}
                height={innerH}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onTouchStart={() => setHover(i)}
              />
            </g>
          );
        })}

        {mode === "load" && linePath.length > 1 && (
          <path className="line" d={`M${linePath.join(" L")}`} />
        )}

        {todayIdx >= 0 && (
          <line
            className="today-line"
            x1={padL + (todayIdx + 1) * slot}
            x2={padL + (todayIdx + 1) * slot}
            y1={padT}
            y2={y(0)}
          />
        )}

        {monthLabels.map((m) => (
          <text key={m.i} x={padL + m.i * slot + 1} y={H - 8}>{m.label}</text>
        ))}
        {weeks.map((w, i) =>
          w.race ? (
            <text key="race" x={x(i) + barW / 2} y={padT + 2} textAnchor="end" className="label-today">
              gara
            </text>
          ) : null,
        )}
      </svg>

      {hw && hover !== null && (
        <div
          className="tooltip"
          style={{
            left: padL + hover * slot + slot / 2,
            top: y(Math.max(values[hover], targets[hover])) + 14,
          }}
        >
          <div>{hw.planN ? `Sett. ${hw.planN} · ` : ""}{fmtRange(hw.start, hw.end)}</div>
          {mode === "km" ? (
            <>
              <div><b>{fmtKm(hw.km, 1)} km</b>{hw.targetKm ? ` · piano ${hw.targetKm}` : ""}</div>
              {hw.runs > 0 && (
                <div>{hw.runs} uscite · lungo {fmtKm(hw.longest, 1)}</div>
              )}
            </>
          ) : (
            <>
              <div><b>{fmtInt(hw.load)}</b> RPE×min</div>
              {rolling[hover] !== null && <div>media 4 sett. {fmtInt(rolling[hover]!)}</div>}
            </>
          )}
        </div>
      )}

      <div className="legend">
        {mode === "km" ? (
          <>
            <span className="legend__item"><span className="legend__swatch" />fatto</span>
            <span className="legend__item"><span className="legend__swatch legend__swatch--plan" />piano</span>
          </>
        ) : (
          <>
            <span className="legend__item"><span className="legend__swatch" />carico settimanale</span>
            <span className="legend__item"><span className="legend__swatch legend__swatch--line" />media 4 settimane</span>
          </>
        )}
      </div>
    </div>
  );
}
