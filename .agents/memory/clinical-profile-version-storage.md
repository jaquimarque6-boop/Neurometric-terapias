---
name: Clinical profile version storage
description: Why clinical profile history shares the existing patient reports table and how it stays isolated.
---

Clinical profile saves use the existing `patient_reports` table with a dedicated `clinical-profile` report type. Each save is append-only; legacy profile fields remain unchanged and are not assigned an author.

Keep the profile as the original seven-section editable presentation. If no saved content exists, show only the explicit AI-generation action; opening the dialog must not generate automatically or expose seven blank fields. Existing content loads from the latest authorized version.

**Why:** the table already provides record IDs, authorship, and timestamps, avoiding a schema migration while preserving existing evolution and family reports.

**How to apply:** scope profile history to both the authorized patient and current author. Keep evolution/family report APIs limited to their own types, and do not expose profile versions through those APIs. Use only documented clinical evidence; do not invent diagnoses, causality, facts, or percentages.
