import { WeekBoard } from "@/components/WeekBoard";
import { StatTiles } from "@/components/StatTiles";
import { WeeklyChart } from "@/components/WeeklyChart";
import { RecentRuns } from "@/components/RecentRuns";
import { PlanTable } from "@/components/PlanTable";
import { Paces } from "@/components/Paces";
import { computeStats, currentPlanWeek, loadPlan, loadRuns, nextPlanWeek, phaseOf, weeklySummaries } from "@/lib/data";
import { fmtDayLong, mondayOf, today } from "@/lib/dates";

// "Today" matters (current week, countdown), so render per request.
export const dynamic = "force-dynamic";

const HISTORY_FROM = "2026-08-31"; // first Monday of the September restart

export default async function Page() {
  const plan = loadPlan();
  const runs = await loadRuns();
  const stats = computeStats(runs, plan);
  const t = today();
  const monday = mondayOf(t);
  // Current plan week; if this week has no plan yet (e.g. the plan starts
  // tomorrow), show the next planned week instead.
  const cur = currentPlanWeek(plan);
  const week = cur ?? nextPlanWeek(plan);
  const showingNext = !cur && !!week;
  const boardMonday = showingNext && week ? week.start : monday;
  const phase = week ? phaseOf(plan, week.n)?.name : undefined;
  const weeks = weeklySummaries(runs, plan, HISTORY_FROM);
  const [ry, , rd] = plan.race.date.split("-");

  return (
    <main className="page">
      <header className="mast">
        <div>
          <p className="mast__kicker">Diario di corsa · {fmtDayLong(t)}</p>
          <h1 className="mast__title">Running</h1>
          <p className="mast__sub">
            <span className="mast__goal">Obiettivo</span> {plan.race.name}, <em>{Number(rd)} aprile {ry}</em> · sub 3h40
          </p>
        </div>
        <div className="countdown" aria-label="tempo alla gara">
          <div className="countdown__item">
            <span className="countdown__n">{stats.weeksToRace}</span>
            <span className="countdown__l">settimane</span>
          </div>
          <div className="countdown__item">
            <span className="countdown__n">{stats.daysToRace % 7}</span>
            <span className="countdown__l">giorni</span>
          </div>
        </div>
      </header>

      <WeekBoard week={week} runs={runs} phase={phase} monday={boardMonday} isNext={showingNext} />

      <StatTiles stats={stats} vdot={plan.athlete.vdot} />

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Chilometri a settimana</h2>
          <span className="section__meta">da settembre alla gara</span>
        </div>
        <WeeklyChart weeks={weeks} />
      </section>

      <RecentRuns runs={runs} limit={10} />

      <PlanTable plan={plan} weeks={weeks} />

      <Paces plan={plan} />

      <footer className="foot">
        <span>{runs.length} attività · ultima {fmtDayLong(runs[runs.length - 1]?.date ?? t)}</span>
        <span>aggiorna <code>data/activities.csv</code> con l&apos;archivio Strava, il piano in <code>data/plan.json</code></span>
      </footer>
    </main>
  );
}
