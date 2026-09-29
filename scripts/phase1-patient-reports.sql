-- Additive only; run explicitly against each intended environment before deploying Phase 1.
ALTER TABLE patients ADD COLUMN IF NOT EXISTS anamnesis_updated_at timestamptz;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS anamnesis_updated_by_user_id integer REFERENCES users(id);

CREATE TABLE IF NOT EXISTS patient_reports (
  id serial PRIMARY KEY,
  patient_id integer NOT NULL REFERENCES patients(id),
  report_type text NOT NULL CHECK (report_type IN ('evolution', 'family')),
  title text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3) NOT NULL DEFAULT now(),
  author_user_id integer NOT NULL REFERENCES users(id),
  updated_by_user_id integer NOT NULL REFERENCES users(id),
  period_kind text,
  period_from date,
  period_to date,
  clinical_records_used_count integer CHECK (clinical_records_used_count >= 0),
  clinical_records_total_count integer CHECK (clinical_records_total_count >= 0),
  CONSTRAINT patient_reports_counts_consistent CHECK (
    clinical_records_used_count IS NULL OR clinical_records_total_count IS NULL
    OR clinical_records_used_count <= clinical_records_total_count
  )
);
CREATE INDEX IF NOT EXISTS patient_reports_patient_created_idx ON patient_reports(patient_id, created_at);