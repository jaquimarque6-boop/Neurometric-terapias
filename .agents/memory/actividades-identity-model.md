---
name: Neurometric Actividades identity model
description: Ownership model for private professional materials in the single-professional Actividades app
---

Neurometric Actividades uses a one-account-to-one-professional model. The authenticated session identity is `users.id`; private material ownership should therefore use `professional_files.uploaded_by → users.id`. Do not introduce `professional_id`, center, sharing, or multi-professional relations for this feature.

**Why:** The existing authentication flow writes `req.session.userId = user.id`, and the material routes scope every read, signed path, insert, download, and delete to that ID. `users.professional_id` is optional metadata and `professionals.id` is not the session identity.

**How to apply:** Keep the table keyed by `uploaded_by` referencing `users.id`; preserve the per-request ownership predicate and do not add admin or multi-tenant bypasses.