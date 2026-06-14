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

## Supabase Storage (patient files)
- `SUPABASE_URL` / `SUPABASE_FILES_BUCKET` are **shared** env vars and `SUPABASE_SERVICE_KEY` is a secret, so dev and prod hit the **same Supabase Storage project**. Creating the private bucket once (done: `patient-files`, private, 25MB limit) serves both environments — no per-env bucket needed.
- BUT the `patient_files` **table** still follows the topology above: `db push` only touches the dev/Replit DB; the same idempotent CREATE TABLE SQL must be run by the user on the Render/prod Postgres. Storage bucket ≠ DB table; don't conflate them.
- Storage REST (raw fetch, no SDK) requires the **`service_role`** JWT (`"role":"service_role"` claim). The `anon` key hits `new row violates row-level security policy`; a Postgres connection string isn't a JWT at all. Endpoint shapes: upload sign returns `{url}` (PUT bytes to `/storage/v1{url}`), download sign returns `{signedURL}`, existence check = GET object with `Range: bytes=0-0`.
