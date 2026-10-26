---
name: Personal notes rollout
description: Product scope and production rollout boundaries for Neurometric Terapias personal notes.
---

Keep “Mis notas” private per professional or administrator. Do not add collaborator access, patient links, categories, AI, or notifications unless explicitly requested. Do not change unrelated Neurometric Terapias functions.

Production schema changes and deployment require separate explicit authorization. Keep the SQL prepared, verify the target database before any schema command, and never assume Replit Publish manages the production database. Development and loopback-only test databases are separate from production.

**Why:** The user approved this feature with those boundaries and requested SQL plus safe application instructions, but prohibited production migrations and automatic publishing/deployment.

**How to apply:** Before production rollout, back up the existing PostgreSQL database, verify the `users` table and target environment, apply the prepared SQL in an approved change window, then deploy only when the user chooses.
