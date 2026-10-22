---
name: Isolated PostgreSQL route tests
description: Run API route integration tests against fake local data without triggering app startup initialization.
---

# Isolated PostgreSQL route tests

For API integration tests that need SQL, use a fresh temporary PostgreSQL cluster with a loopback-only listener and an explicit test database URL. Unset `PGHOST`, `PGDATABASE`, and related connection overrides so they cannot supersede the URL. Assert the connected database name and loopback server address before creating fixtures.

Import and mount only the routers under test, set `NODE_ENV=test` before importing database modules, and inject synthetic sessions in the test harness. Do not import `app.ts` or start the API workflow for this test: application startup and workflow restarts may run initialization or session-table setup.

PostgreSQL may render `inet_server_addr()::text` as `127.0.0.1/32`; strip the CIDR suffix before comparing the address to an allowlist.

**Why:** The user explicitly requires isolated fake data and no production initialization. Application startup can write to a database, and the PostgreSQL address formatting initially caused a false negative in the loopback safety check.

**How to apply:** When an API test needs real SQL behavior, create a disposable local cluster, use a database-name/host/port guard in the test, and remove the cluster after the run. Never point this harness at the Render/Supabase database.
