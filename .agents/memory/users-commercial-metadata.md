---
name: Users commercial metadata vs login/clinical state
description: Why the admin "commercial" state on users is deliberately separate from the login `active` flag and from the clinical pagos module, and how session metrics are dated.
---

# Commercial metadata on `users` is a separate axis

The `users` table carries admin-only commercial metadata (`commercial_status` =
trial/paying/overdue/courtesy/churned, plus trial/payment dates, `monthly_amount`,
`payment_method`, `internal_notes`). This is intentionally **three independent axes**:

1. `active` (boolean) — login/auth gate. Controls whether the user can sign in.
2. `commercial_status` + commercial fields — billing/relationship state for the admin
   "Panel de usuarios". Does NOT affect login.
3. Clinical `pagos` module — patient/clinical payments, unrelated to user billing.

**Why:** the product owner wanted to track "who pays / who is on trial / who is
overdue" without conflating it with account suspension (`active=false` = "dado de baja")
or with clinical patient payments. Mixing them caused confusion in the original panel.

**How to apply:**
- Never drive login from `commercial_status`, and never write commercial fields from
  the pagos/pacientes/sesiones flows.
- Admin "Panel de usuarios" summary/filters count only `active` users; `active=false`
  ("Dados de baja") is isolated in its own filter.
- Session-activity metrics (`sesionesEsteMes`, `ultimaActividad`) are dated by the real
  clinical date `registros_clinicos.fecha` (text YYYY-MM-DD), falling back to
  `created_at` only when `fecha` is missing/invalid — because `created_at` (row insert
  time) drifts from when the session actually happened.

## Commercial audit event constraint

Keep the `saas_status_events.event` CHECK constraint synchronized with every event passed to `logCommercialChange`, including `commercial_status_changed`, `commercial_correction`, `trial_started`, and `payment_renewal`. The audit insert shares a transaction with the user/receipt update; an unsupported event triggers PostgreSQL `23514` and rolls back the whole operation.

**Why:** The initial event constraint allowed only referral-lifecycle events, while later audit writers added commercial correction and renewal event names. The resulting database error surfaced as a generic HTTP 500 in the admin form.

**How to apply:** Search all `logCommercialChange` call sites before changing audit behavior; update both fresh-schema SQL and the existing-database constraint migration. Check the live constraint read-only before proposing a schema change, and never rerun column additions without confirming the column is absent.

## Safety constraints for subscription automation

Reuse the existing commercial system; do not create parallel subscription structures.
Never invent payment or trial-start dates for existing accounts or mass-block them
because dates are missing or inconsistent. Validate and regularize their data in
verification mode before enabling commercial enforcement, with the user's approval.
Changing a commercial status alone is not confirmation of payment.

**Why:** The user requires protection of existing paying, trial, and courtesy accounts
when introducing automated expiration.

**How to apply:** Propose commercial expiration as a restriction on clinical operations,
not as account deactivation. Preserve renewal information and logout, existing roles,
clinical data, and the current behavior of manually deactivated accounts.
