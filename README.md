# Corsa · Milano Marathon 2027

Dashboard personale di allenamento. Next.js, nessun database: i dati stanno in due file nella cartella `data/`.

- `data/activities.csv` — il file `activities.csv` dell'archivio Strava, così com'è.
- `data/plan.json` — gara, ritmi di riferimento, fasi e le 21 settimane con le sedute.

## Pubblicare

1. Crea un repo vuoto su GitHub (privato va benissimo) e carica questa cartella.
   Da terminale, dentro la cartella:
   ```
   git init
   git add .
   git commit -m "Dashboard corsa"
   git branch -M main
   git remote add origin https://github.com/TUO-UTENTE/corsa.git
   git push -u origin main
   ```
   Oppure dal sito GitHub: "Add file → Upload files" e trascini tutto tranne `node_modules`.
2. Su Vercel: "Add New → Project", scegli il repo, lascia tutto di default, Deploy.
   Nessuna variabile d'ambiente da impostare.

## Aggiornare le corse

Ogni una o due settimane: Strava (sito) → foto profilo → Settings → My Account →
"Download or Delete Your Account" → Get Started → Request Your Archive.
Arriva uno zip via email: prendi `activities.csv` e sostituisci `data/activities.csv`
nel repo (su GitHub: apri il file → icona matita o "Upload files" nella cartella `data`).
Vercel ricostruisce il sito da solo.

Le date Strava sono in UTC: il sito le converte in ora italiana per assegnare le corse al giorno giusto.

## Aggiornare il piano

`data/plan.json`, una settimana per oggetto:

```json
{
  "n": 2,
  "start": "2026-11-16",
  "targetKm": 40,
  "note": "facoltativa",
  "sessions": [
    { "date": "2026-11-17", "type": "E", "title": "Easy", "km": 10, "pace": "5:35–5:50", "detail": "…" }
  ]
}
```

Tipi di seduta: `E` easy, `L` lungo, `T` soglia, `I` intervalli, `R` allunghi/ripetute brevi,
`M` ritmo maratona, `X` altro (calcetto, riposo attivo), `GARA`.

Il carico settimanale usa il metodo di Foster: sforzo percepito (quello che annoti su Strava, 1–10)
per i minuti corsi. Dove manca, viene stimato dal ritmo.

## In locale

```
npm install
npm run dev
```
