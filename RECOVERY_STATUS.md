# Recovery Status — Neurometric Terapias

**Date:** 2025-05-12
**Branch:** `main`
**Head commit:** `0d93cb6` + session 4 changes (uncommitted)

---

## Stack Overview

```
Browser
  └── Netlify (production frontend)
        └── VITE_API_URL → https://neurometric-terapias-backend.onrender.com
               └── Render (production backend)
                     └── Supabase PostgreSQL (aws-1-us-east-2.pooler.supabase.com:6543)
                           └── DATABASE_URL set on Render dashboard only — NOT in repo

Replit (this environment — dev/backup)
  ├── Frontend: Vite dev server → port 20008
  ├── Backend: Express/tsx dev server → port 8080
  └── Dev DB: Replit built-in PostgreSQL (helium) — separate from production data
```

---

## Validation Results (run 2025-05-12)

### Build / Typecheck
- **New errors introduced by this session: 0**
- Pre-existing errors (not blocking, present before this work):
  - `TS6305` — `lib/api-client-react` not built from source (affects ~10 pages)
  - `TS7006` / `TS18046` — implicit `any` in `goals.tsx`, `patients.tsx`, `professionals.tsx`
  - `TS2322` — i18n `en.ts` English strings typed as Spanish literals
  - `TS2322` — Lucide `title` prop in `goal-code-preview.tsx`

### Frontend
- HTTP 200 on `localhost:20008` — Vite running, HMR active

### Backend
- API server running on `localhost:8080`
- Confirmed read: `[GET /api/patients] userId=1 role=admin → devolviendo 30 pacientes`
- Dev DB seeded: 444 goal library entries present

### Recovered Features — All Verified

| Feature | File | Status |
|---|---|---|
| 13 psicoped diagnosis options | `src/utils/profession-map.ts` | OK |
| Diagnosis area routing (13 entries) | `src/utils/diagnosis-map.ts` | OK |
| 4 new clinical content groups | `src/config/goal-clinical-content.ts` | OK |
| 3 new eval guides + keyword routing | `src/components/eval-sugerida.tsx` | OK |
| Structured activity bank (5 activities) | `src/config/psicoped-activity-bank.ts` | OK |
| Línea de Tiempo tab | `src/pages/patient-profile.tsx` | OK |
| 35 new PP-* goals (dev DB) | `src/seeds/goal-library-seed.ts` | Seeded |
| `actividadesClinicasPorFranja` for all 7 BLOQUES_PSICOPED | `src/pages/nueva-sesion.tsx` | OK |
| `paraLaFamiliaPorFranja` for all 7 BLOQUES_PSICOPED | `src/pages/nueva-sesion.tsx` | OK |
| Banco foco textarea wired to `focoTerapeutico` state | `src/pages/nueva-sesion.tsx` | OK |
| Last session resumen fetched and shown in "Sesión anterior" | `src/pages/nueva-sesion.tsx` | OK |

---

## What Works

- Full frontend loads and navigates without errors
- Backend reads patients, goals, sessions, and professionals from the dev database
- Nueva sesión shows all 13 psychopedagogy diagnoses for psicopedagogía profession
- Evaluación sugerida shows clinical guides for: Memoria, Producción escrita, Estrategias de aprendizaje (new), plus all existing areas
- Goal clinical content panel resolves for all new taxonomy groups (Comprensión lectora, Producción escrita, Matemática, Estrategias de aprendizaje)
- Línea de Tiempo tab renders in patient profiles
- Structured activity bank config is ready for UI wiring
- **All 7 BLOQUES_PSICOPED now have "Actividades clínicas" (6 age bands × 3 activities each)**
- **All 7 BLOQUES_PSICOPED now have "Para la familia" (6 age bands × 2 tips each)**
- **Banco de objetivos "Foco terapéutico" textarea is now wired to the shared state** — prefills from clinical guides and saves with the session
- **"Sesión anterior" in Guía de la sesión now shows the actual resumen text** from the previous recorded session, above the last goal's status badge

---

## What Still Needs Testing

- [ ] Activity bank UI — `PSICOPED_ACTIVITY_BANK` config exists but no UI component renders it yet (next step)
- [ ] `lib/api-client-react` — needs a build (`pnpm --filter @workspace/lib/api-client-react build`) to clear TS6305 cascade
- [ ] Goals/patients implicit `any` typing — cleanup task, not blocking runtime
- [ ] PP-* goals in production Supabase — the 35 new goals exist in dev DB but have NOT been applied to the production Supabase database

---

## How to Deploy This Version as a Fallback

If the current production app (Netlify + Render) fails, follow these steps:

### Option A — Redeploy frontend to Netlify from this repo

1. Push `main` branch to GitHub (already synced via `origin/main`)
2. In Netlify dashboard: trigger a new deploy from the `main` branch
3. Build command: `pnpm --filter @workspace/neurometric-lab build`
4. Publish directory: `artifacts/neurometric-lab/dist`
5. Env var: `VITE_API_URL=https://neurometric-terapias-backend.onrender.com`

### Option B — Redeploy backend to Render from this repo

1. In Render dashboard: trigger a manual deploy from the `main` branch
2. Build command: `pnpm install && pnpm --filter @workspace/api-server build`
3. Start command: `node artifacts/api-server/dist/index.js`
4. Env vars (set in Render dashboard, do NOT add to repo):
   - `DATABASE_URL` — existing Supabase connection string
   - `SESSION_SECRET`
   - `NODE_ENV=production`

### Option C — Run fully in Replit (dev mode fallback)

1. Start both workflows: `API Server` and `neurometric-lab: web`
2. Share the Replit preview URL
3. Note: uses dev database (Replit PostgreSQL), not production data

---

## WARNINGS — Read Before Any Deployment

> **DO NOT run seeds or migrations against the production Supabase database.**
> The dev seed (`goal-library-seed.ts`) contains 444 goals and will conflict with or duplicate production data.
> The production database schema and data are managed exclusively via the Render/Supabase stack.

> **DATABASE_URL is not stored in this repository.**
> It exists only in the Render environment variables dashboard.
> Never commit it to the repo.

> **The 35 new PP-* psychopedagogy goals are in the dev database only.**
> They have not been applied to production Supabase.
> A separate, reviewed migration will be needed before going to production.

---

## Commit History (recent)

```
0d93cb6  Add attention difficulties to the diagnosis options
cc6542a  Add new psychopedagogical content and activity bank
b51534c  Add new learning and cognitive diagnostic options for patients
99c4527  Add a timeline tab to patient profiles
04c41d0  Update preview image for the web application
```
