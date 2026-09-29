---
name: Collaborator scope and commercial history
description: Approved V1 boundaries for referrals, permissions, and historical commissions.
---

Keep collaborator commerce separate from clinical billing and preserve existing admin/professional permissions.

**Why:** Non-admin routes historically assume professional access. A collaborator must be default-denied centrally, not merely hidden from navigation. The approved V1 intentionally avoids a second authentication system.

**How to apply:** Extend the exact collaborator endpoint allowlist only after privacy tests. Resolve ownership from current authenticated identity. Never return referred professionals' identities through the collaborator dashboard.

Freeze commission economics when confirming each receipt. Inactive collaborators stop new attributions but retain commissions on established referrals; login activation is a separate axis. Reactivations are not new subscriptions.

**Why:** The approved recurring model protects attribution and historical earnings across rate changes and deliberately excludes refunds, partial payouts, and automated billing from V1.

**How to apply:** Future changes must preserve historical snapshots and explicitly introduce adjustments rather than recomputing old receipts. Do not infer ownership of the old anggy code or migrate it to ANGIE.