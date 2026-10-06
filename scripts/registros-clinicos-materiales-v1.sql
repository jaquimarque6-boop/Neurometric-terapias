-- Add optional session-specific materials and activities metadata.
-- Apply separately to the development and production PostgreSQL databases.
ALTER TABLE registros_clinicos
  ADD COLUMN IF NOT EXISTS materiales_actividades jsonb;
