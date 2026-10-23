---
name: Mockup sandbox workflow recovery
description: Recover a mockup sandbox workflow when its Vite package link points to a missing pnpm store path.
---

When the mockup sandbox workflow fails with a missing `artifacts/mockup-sandbox/node_modules/vite/bin/vite.js` even though Vite is declared, the workspace symlink may point to a stale pnpm store path. Running `pnpm install --filter @workspace/mockup-sandbox... --frozen-lockfile` from the workspace root repaired the link without changing the lockfile; restart the existing managed workflow afterward.

**Why:** The package existed in the lockfile, but the installed symlink referenced a package-store folder that no longer existed.

**How to apply:** For this specific missing-module failure, verify the workspace link and package-store entries first, then re-install from the frozen lockfile before editing manifests or changing dependency versions.
