# Sahyog CRM v2 — Phase 1

React + Vite rebuild of the original single-file `index.html` CRM, per the modular
architecture spec. See `PHASE1_SUMMARY.md` for what changed vs the old app.

## Local dev
```
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```

## Deploy (Railway)
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Railway service Variables.
`railway.json` handles build (`npm run build`) and start (`npm run start`, serves the
built `dist/` via `vite preview`).

## Database
Run the SQL files in `migrations/` in order — see `migrations/README.md`.
