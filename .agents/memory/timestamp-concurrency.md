---
name: Timestamp concurrency precision
description: PostgreSQL timestamps used as browser optimistic-lock tokens must round-trip through JavaScript.
---

Persist timestamp-based optimistic-lock tokens at millisecond precision when clients serialize them through JavaScript Date.

**Why:** PostgreSQL defaults can retain microseconds that JavaScript drops. Comparing the returned ISO timestamp against the original database value can reject an unchanged document as a conflict.

**How to apply:** Keep SQL migrations and ORM timestamp precision aligned; verify a real database read → browser serialization → conditional update, not only mocked equality tests.