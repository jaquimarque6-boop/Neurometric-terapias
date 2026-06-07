---
name: Production topology (Neurometric)
description: Where production actually runs and what that means for schema/backend changes.
---

# Production topology

Production for Neurometric is **three separate systems**, not the Replit deployment:

- **Frontend:** Netlify, served at `neurometricterapias.com`. Netlify builds `artifacts/neurometric-lab` from this repo (`netlify.toml`), and injects `VITE_API_URL=https://neurometric-terapias-backend.onrender.com`.
- **Backend:** Render service `neurometric-terapias-backend.onrender.com`. The user confirmed Render deploys from **this same repo** (`artifacts/api-server`), so backend code changes here DO reach production once Render redeploys.
- **Database:** the Postgres the Render backend connects to (the project's Supabase/prod DB). Not Replit's managed DB.

**Why this matters:**
- The Replit Publish flow only manages Replit's own managed Postgres + Replit deploy. It does **not** touch the Render/Supabase production DB. So "re-publish" on Replit never fixes a missing prod column/index.
- Any production **schema** change (new columns, indexes) must be applied by the user directly against the Render/Supabase DB (Supabase SQL Editor, or `psql` with Render's `DATABASE_URL`). The agent cannot reach that DB and must not run prod DDL; provide the exact idempotent SQL instead.
- Frontend perf/code changes reach prod automatically via the Netlify build; backend changes need a Render redeploy.

**How to apply:** when the user reports a prod-only bug ("column does not exist", slowness in prod), first decide which of the three systems is responsible before recommending fixes.
