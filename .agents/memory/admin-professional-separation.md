---
name: Admin/professional identity separation
description: Neurometric's administrator and owner's professional account are distinct identities.
---

The user already has a separate professional account from the administrator account. They want strict separation of administrative and clinical access without creating accounts or migrating patients.

Keep the `users` access-account list distinct from the `professionals` contact and license directory. Do not auto-sync, merge, duplicate, or migrate records between them without explicit authorization.

For administrative counts, attribute patients through their explicit account assignment and include archived patients. Attribute clinical sessions through the exact account link only; if any session rows lack an account link, show the total as unavailable rather than guessing or silently omitting them.

**Why:** the user explicitly stated this and asked to preserve the existing accounts and patient associations.

**How to apply:** keep account metrics separate from directory-professional assignments. Verify the two identities before changing ownership or permissions. Use aggregate counts on explicit links; never infer attribution from names or merge records without authorization.
