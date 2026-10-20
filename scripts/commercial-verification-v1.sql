-- Stage 1 only: no enforcement, date backfill, status changes, or clinical writes.
-- Apply explicitly to the intended database. Never run this from application startup.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_start_pending boolean NOT NULL DEFAULT false;
ALTER TABLE saas_status_events ADD COLUMN IF NOT EXISTS details jsonb;
COMMIT;
