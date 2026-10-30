-- Allow the primary administrator to attribute an existing professional.
-- This changes attribution provenance constraints only; it does not touch
-- users, referral rows, subscription receipts, or commission snapshots.
BEGIN;

ALTER TABLE referral_attributions
  DROP CONSTRAINT IF EXISTS referral_attributions_source_check;
ALTER TABLE referral_attributions
  ADD CONSTRAINT referral_attributions_source_check
  CHECK (source IN ('public_register', 'admin_user_create', 'admin_manual_assignment'));

ALTER TABLE referral_attributions
  DROP CONSTRAINT IF EXISTS attribution_source_actor;
ALTER TABLE referral_attributions
  ADD CONSTRAINT attribution_source_actor
  CHECK (
    (source = 'public_register' AND created_by_user_id IS NULL)
    OR (source IN ('admin_user_create', 'admin_manual_assignment') AND created_by_user_id IS NOT NULL)
  );

COMMIT;
