-- Additive legal-acceptance history. Apply only to the approved environment.
BEGIN;
CREATE TABLE user_consent_acceptances (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'ai')),
  version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  accepted_by_user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_consent_acceptances_actor_is_owner CHECK (accepted_by_user_id = user_id),
  CONSTRAINT user_consent_acceptances_user_type_version_unique UNIQUE (user_id, consent_type, version)
);
CREATE INDEX user_consent_acceptances_user_idx ON user_consent_acceptances(user_id);
COMMIT;