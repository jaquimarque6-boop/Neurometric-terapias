---
name: Diagnosis storage & multiselect
description: How patient diagnoses are stored/compared across ficha and per-session records in Neurometric Lab.
---

Diagnoses are multi-select but stored as a single comma-separated string for backward compatibility.

- Patient-level (the "ficha"): `patients.diagnosis` — one comma-separated string. Old single-diagnosis records parse fine.
- Per-session: `registros_clinicos.diagnostico` (separate column) — the diagnosis chosen for that specific session, also comma-separated.
- Use `parseDiagnoses()` / `serializeDiagnoses()` (in `utils/diagnosis-map.ts`) to convert between `string[]` and the stored string. Always parse-then-serialize BOTH sides before comparing two diagnosis strings, otherwise comma/spacing differences cause false "changed" detection.
- IA suggestions / EvalSugerida / phoneme logic intentionally use only the PRIMARY (first) diagnosis (`sessionDiagnoses[0]`), not the full multiselect.

**Why:** prod is Netlify+Render with its own DB; schema must stay additive and not break existing single-string rows. Multiselect was layered on top without a join table to avoid a risky migration.

**How to apply:** when saving a session, if the session diagnosis differs from the ficha, prompt scope ("Solo esta sesión" vs "También actualizar ficha"). Only PATCH `patients.diagnosis` when the user opts to update the ficha. Note the backend PATCH uses `body.diagnosis ?? existing.diagnosis`, so send the raw serialized string (empty string clears; `null` would NOT clear).
