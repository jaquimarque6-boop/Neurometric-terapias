-- Expand the event check to cover audit event names emitted by the API.
-- This changes no rows and adds no columns. Apply only after reviewing the
-- current production constraint; this script is intentionally not run by app startup.
BEGIN;
ALTER TABLE saas_status_events
 DROP CONSTRAINT IF EXISTS saas_status_events_event_check;
ALTER TABLE saas_status_events
 ADD CONSTRAINT saas_status_events_event_check CHECK (
  event IN (
   'baseline','first_paid','cancellation','reactivation',
   'commercial_status_changed','commercial_correction','trial_started','payment_renewal'
  )
 );
COMMIT;
