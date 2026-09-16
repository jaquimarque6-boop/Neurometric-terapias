---
name: Password seed safety
description: Startup account initialization must not overwrite credentials of existing users.
---

Account bootstrap routines may create a missing administrator with an initial password, but existing users must retain their current password hash. Role or active-state normalization must be separate from credential initialization.

**Why:** Rewriting an existing hash at backend startup makes a manually changed password stop working after a restart or deploy.

**How to apply:** Keep password hashing inside the create-only branch, and audit every startup seed separately from explicit migration workflows.