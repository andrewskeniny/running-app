/**
 * Minimal GitHub Contents API client, used to read and write
 * data/corse-manuali.json in the repo itself (no database).
 *
 * Env: GITHUB_TOKEN (fine-grained, Contents read/write on this repo),
 *      GITHUB_REPO ("utente/repo"), GITHUB_BRANCH (default "main").
 */

export const MANUAL_PATH = "data/corse-manuali.json";

export interface ManualRun {
  id: string;
  date: string; // YYYY-MM-DD, local
  name: string;
  km: number;
  movingSec: number;
  addedAt: string;
}

export function githubConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "running-app",
  };
}

function url() {
  const branch = process.env.GITHUB_BRANCH || "main";
  return `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${MANUAL_PATH}?ref=${branch}`;
}

export async function readManualRunsFromGitHub(): Promise<{ runs: ManualRun[]; sha: string | null }> {
  const res = await fetch(url(), { headers: headers(), cache: "no-store" });
  if (res.status === 404) return { runs: [], sha: null };
  if (!res.ok) throw new Error(`GitHub GET ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { content: string; sha: string };
  const text = Buffer.from(json.content.replace(/\n/g, ""), "base64").toString("utf8");
  const runs = text.trim() ? (JSON.parse(text) as ManualRun[]) : [];
  return { runs, sha: json.sha };
}

export async function writeManualRunsToGitHub(runs: ManualRun[], sha: string | null, message: string): Promise<void> {
  const branch = process.env.GITHUB_BRANCH || "main";
  const body: Record<string, string> = {
    message,
    content: Buffer.from(JSON.stringify(runs, null, 2) + "\n", "utf8").toString("base64"),
    branch,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url().split("?")[0], {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub PUT ${res.status}: ${await res.text()}`);
}
