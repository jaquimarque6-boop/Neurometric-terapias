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
