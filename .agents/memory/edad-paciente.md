---
name: Edad del paciente
description: Regla de edad automática vs manual y formato de visualización en Neurometric Lab.
---

Rule: if `patients.fecha_nacimiento` (text, YYYY-MM-DD) is set, age is always computed live from it; otherwise fall back to manual `patients.age`. Under 6 years show "X años Y meses", from 6 up show whole years. Manual age is always whole years.

**Why:** clinical requirement — young children's age in months matters; a stored integer goes stale.

**How to apply:** never display `patient.age` directly; use the shared `formatEdad`/`formatEdadCorta` helpers (frontend `utils/edad.ts`, backend `lib/edad.ts` — keep both in sync). Backend validates fechaNacimiento (format + not future) on both create and update; sending an empty string clears it.
