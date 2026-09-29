-- Additive only. Do not apply to production without an approved deployment.
BEGIN;
CREATE TABLE collaborators (
 id serial PRIMARY KEY,
 user_id integer NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
 name text NOT NULL,
 country text NOT NULL,
 code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9]{2,32}$'),
 commission_percent numeric(5,2) NOT NULL CHECK (commission_percent >= 0 AND commission_percent <= 100),
 active boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE referral_attributions (
 id serial PRIMARY KEY,
 professional_user_id integer NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
 collaborator_id integer NOT NULL REFERENCES collaborators(id) ON DELETE RESTRICT,
 code_used text NOT NULL CHECK (code_used ~ '^[A-Z0-9]{2,32}$'),
 source text NOT NULL CHECK (source IN ('public_register','admin_user_create')),
 created_by_user_id integer REFERENCES users(id) ON DELETE RESTRICT,
 CONSTRAINT attribution_source_actor CHECK ((source = 'public_register' AND created_by_user_id IS NULL) OR (source = 'admin_user_create' AND created_by_user_id IS NOT NULL)),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX referral_attributions_collaborator_idx ON referral_attributions(collaborator_id);
CREATE TABLE saas_receipts (
 id serial PRIMARY KEY,
 professional_user_id integer NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 amount numeric(16,2) NOT NULL CHECK (amount > 0),
 currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
 period_from date NOT NULL,
 period_to date NOT NULL,
 received_at date NOT NULL,
 reference text,
 idempotency_key text NOT NULL UNIQUE,
 created_by_user_id integer NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 collaborator_id integer REFERENCES collaborators(id) ON DELETE RESTRICT,
 commission_percent_snapshot numeric(5,2) CHECK (commission_percent_snapshot >= 0 AND commission_percent_snapshot <= 100),
 commission_amount numeric(16,2) CHECK (commission_amount >= 0),
 paid_at timestamptz,
 paid_by_user_id integer REFERENCES users(id) ON DELETE RESTRICT,
 payment_reference text,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT receipt_period_ordered CHECK (period_from <= period_to),
 CONSTRAINT payment_audit_complete CHECK ((paid_at IS NULL AND paid_by_user_id IS NULL AND payment_reference IS NULL) OR (paid_at IS NOT NULL AND paid_by_user_id IS NOT NULL)),
 CONSTRAINT commission_snapshot_consistent CHECK (
  (collaborator_id IS NULL AND commission_percent_snapshot IS NULL AND commission_amount IS NULL AND paid_at IS NULL AND paid_by_user_id IS NULL AND payment_reference IS NULL)
  OR (collaborator_id IS NOT NULL AND commission_percent_snapshot IS NOT NULL AND commission_amount IS NOT NULL)
 )
);
CREATE INDEX saas_receipts_collaborator_idx ON saas_receipts(collaborator_id);
CREATE TABLE saas_status_events (
 id serial PRIMARY KEY,
 professional_user_id integer NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 event text NOT NULL CHECK (event IN ('baseline','first_paid','cancellation','reactivation')),
 actor_user_id integer NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 effective_date date NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX saas_status_events_professional_idx ON saas_status_events(professional_user_id);
COMMIT;