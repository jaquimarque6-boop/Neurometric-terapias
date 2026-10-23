---
name: Activities pass access
description: Shared pass flow and destination for Terapias entry points into Neurometric Actividades.
---

Every Neurometric Terapias entry point into external Actividades must request a pass through the authenticated API and open `https://therapy-spark-toolkit.lovable.app/acceso-terapias#pase=<token>`. Do not link directly to the public Lovable base.

**Why:** The user reported that Lovable had not received real passes and explicitly requires that no button bypass the pass handshake.

**How to apply:** Reuse the shared pass-opening hook for dashboard, sidebar, session, and legacy `/actividades` actions. Keep the legacy route if requested, but its outgoing links must also request a pass.
