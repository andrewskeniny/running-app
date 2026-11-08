"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PW_KEY = "running-app-password";

export function AddRun({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(defaultDate);
  const [km, setKm] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const pw = localStorage.getItem(PW_KEY);
      if (pw) setPassword(pw);
    } catch {
      /* private mode etc. */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/corse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, date, km, time, name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Errore");
      try {
        localStorage.setItem(PW_KEY, password);
      } catch {
        /* ignore */
      }
      setSavedMsg(`${json.run.km} km del ${date.split("-").reverse().join("/")} salvati`);
      setKm("");
      setTime("");
      setName("");
      setOpen(false);
      router.refresh();
      setTimeout(() => setSavedMsg(null), 4000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="addbtn" onClick={() => setOpen(true)} aria-label="Aggiungi corsa" title="Aggiungi corsa">
        +
      </button>
      {savedMsg && <span className="saved">{savedMsg}</span>}

      {open && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Aggiungi corsa" onClick={() => setOpen(false)}>
          <form className="modal__card" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
            <h3 className="modal__title">Aggiungi corsa</h3>
            <label className="field">
              <span>Data</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Km</span>
                <input type="text" inputMode="decimal" placeholder="10,0" value={km} onChange={(e) => setKm(e.target.value)} required />
              </label>
              <label className="field">
                <span>Tempo</span>
                <input type="text" inputMode="numeric" placeholder="52:30" value={time} onChange={(e) => setTime(e.target.value)} required />
              </label>
            </div>
            <label className="field">
              <span>Nome <em>facoltativo</em></span>
              <input type="text" placeholder="Easy, Lungo, Tempo…" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </label>
            {error && <p className="field-error">{error}</p>}
            <div className="modal__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>Annulla</button>
              <button type="submit" className="btn" disabled={busy}>{busy ? "Salvo…" : "Salva"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
