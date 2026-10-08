---
name: API workflow auto-restarts
description: The Replit API development workflow may reload after source edits and run startup initialization.
---

# API workflow auto-restarts

Editing API source can automatically restart the running development workflow; not manually restarting it does not guarantee the process will stay up.

**Why:** The API runs startup seeds and its session store is configured to create the session table if missing, so a watcher restart may touch the development database.

**How to apply:** Before changing API source during work that must avoid database writes, account for the dev workflow watcher. Do not assume a source edit is isolated from startup behavior; verify workflow logs and avoid using a database that must remain untouched.
