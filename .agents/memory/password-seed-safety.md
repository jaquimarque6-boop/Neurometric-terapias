---
name: Password seed safety
description: Startup account initialization must not overwrite credentials of existing users.
---

Default administrator bootstrap is development-only. Production, staging, test, and unset `NODE_ENV` must not invoke account-creation seeds; existing users, password hashes, and roles remain untouched.

**Why:** Automatically creating production administrators with credentials baked into source creates avoidable access risk, while rewriting existing hashes can lock out legitimate users.

**How to apply:** Gate startup account seeds on explicit `NODE_ENV=development`. Keep local test fixtures separate, and audit manual migration scripts independently from backend startup.