---
name: Isolated PostgreSQL route tests
description: Run API route integration tests against fake local data without triggering app startup initialization.
---

# Isolated PostgreSQL route tests

For API integration tests that need SQL, use a fresh temporary PostgreSQL cluster with a loopback-only listener and an explicit test database URL. Unset `PGHOST`, `PGDATABASE`, and related connection overrides so they cannot supersede the URL. Assert the connected database name and loopback server address before creating fixtures.

For direct API route tests, import and mount only the routers under test, set `NODE_ENV=test` before importing database modules, and inject synthetic sessions in the test harness. Do not import `app.ts` or start the managed API workflow for that harness: application startup and workflow restarts may run initialization or session-table setup.

PostgreSQL may render `inet_server_addr()::text` as `127.0.0.1/32`; strip the CIDR suffix before comparing the address to an allowlist.

For browser-visible tests of the Neurometric Lab artifact, its `/api` preview path routes to the API artifact on port 8080; Vite's `localhost:3001` proxy is not the browser-facing route. If the visual test needs the full app, start a manual API process on port 8080 with `NODE_ENV=test`, an explicit loopback-only `DATABASE_URL`, and production/Supabase variables unset. Keep the managed API workflow off.

Long-running local PostgreSQL must run as a foreground process in a background shell task; a short shell command can terminate daemonized child processes when it exits. Stop the task and remove the disposable cluster after verification.

**Why:** The user explicitly requires isolated fake data and no production initialization. Application startup can write to a database, PostgreSQL may render a loopback address with a CIDR suffix, and path-based preview routing differs from Vite's local proxy.

**How to apply:** For route tests, use a database-name/host/port guard and mount only the routers. For visual tests, use the manual API process only after verifying the exact temporary database identity. Never point either harness at the Render/Supabase database.
