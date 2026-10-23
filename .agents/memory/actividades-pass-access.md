---
name: Activities pass access
description: Shared pass flow and destination for Terapias entry points into Neurometric Actividades.
---

Every Neurometric Terapias entry point into external Actividades must request a pass through the authenticated API and open `https://therapy-spark-toolkit.lovable.app/acceso-terapias#pase=<token>`. Do not link directly to the public Lovable base.

Pass eligibility is checked against the authenticated `users` row: role must be `professional` and login `active` must be true. Stored commercial values are `trial`, `paying`, `overdue`, `courtesy`, and `churned`. Active courtesy accounts do not need billing dates; trial and paying access require valid inclusive dates using the Buenos Aires business date. `overdue`, `churned`, and inactive accounts remain blocked.

**Why:** The user reported that Lovable had not received real passes and explicitly requires that no button bypass the pass handshake.

**How to apply:** Reuse the shared pass-opening hook for dashboard, sidebar, session, and legacy `/actividades` actions. Keep the legacy route if requested, but its outgoing links must also request a pass. When a trial is rejected, compare the actual user row's role, active flag, status, start date, and end date before attributing the issue to date logic.
