---
name: Generated API contracts
description: Codegen quirks for date-only strings and project-reference declaration freshness.
---

Represent date-only API values sent by browser forms as strings with a `YYYY-MM-DD` pattern rather than OpenAPI `format: date` when the generated Zod validator is used at runtime. In this workspace, `format: date` generated a Zod `Date` validator while the React client sent strings.

After regenerating OpenAPI clients, rebuild the root TypeScript project references before package typechecks. Otherwise dependent packages can read stale declarations from `dist` and report missing newly generated fields.

**Why:** A date-only form submission was rejected by the generated validator, and API/database typechecks initially consumed old declarations after codegen.

**How to apply:** Use string patterns for date-only fields that are serialized as JSON strings, run codegen, then run `pnpm exec tsc --build --force` before checking dependent packages.
