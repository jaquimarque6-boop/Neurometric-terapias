-- Migración documentada: columnas opcionales de cobertura médica en la ficha.
-- Ya aplicada en producción (Supabase); conservar como referencia y no volver a ejecutar.
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS cobertura_medica text,
  ADD COLUMN IF NOT EXISTS numero_afiliado text;
