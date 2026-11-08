import { NextResponse } from "next/server";
import {
  githubConfigured,
  readManualRunsFromGitHub,
  writeManualRunsToGitHub,
  type ManualRun,
} from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** "52:30" | "1:02:15" | "52" (minuti) -> secondi */
function parseTime(s: string): number | null {
  const t = s.trim().replace(/[.,]/g, ":");
  if (!t) return null;
  const parts = t.split(":").map((p) => Number(p));
  if (parts.some((p) => isNaN(p) || p < 0)) return null;
  if (parts.length === 1) return Math.round(parts[0] * 60);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

export async function POST(req: Request) {
  let body: { password?: string; date?: string; km?: string | number; time?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  if (body.password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "Password sbagliata." }, { status: 401 });
  }

  if (!process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "APP_PASSWORD non impostata su Vercel." }, { status: 500 });
  }
  if (!githubConfigured()) {
    return NextResponse.json({ error: "GITHUB_TOKEN o GITHUB_REPO non impostati su Vercel." }, { status: 500 });
  }

  const date = String(body.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Data non valida." }, { status: 400 });
  }
  const km = Number(String(body.km ?? "").replace(",", "."));
  if (!isFinite(km) || km <= 0 || km > 100) {
    return NextResponse.json({ error: "Chilometri non validi." }, { status: 400 });
  }
  const movingSec = parseTime(String(body.time ?? ""));
  if (!movingSec || movingSec <= 0 || movingSec > 12 * 3600) {
    return NextResponse.json({ error: "Tempo non valido: usa mm:ss oppure h:mm:ss." }, { status: 400 });
  }
  const name = String(body.name ?? "").trim().slice(0, 80);

  const run: ManualRun = {
    id: `m-${Date.now()}`,
    date,
    name,
    km: Math.round(km * 100) / 100,
    movingSec,
    addedAt: new Date().toISOString(),
  };

  try {
    const { runs, sha } = await readManualRunsFromGitHub();
    runs.push(run);
    runs.sort((a, b) => a.date.localeCompare(b.date));
    await writeManualRunsToGitHub(runs, sha, `Corsa ${date}: ${run.km} km${name ? ` – ${name}` : ""}`);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, run });
}
