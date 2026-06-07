---
name: TanStack Query cache & navigation freshness (neurometric-lab)
description: Why data looked stale until F5, the fix, and the query-key consistency rule.
---

# Navigation freshness & query keys

**Symptom seen:** users had to press F5 for a module's data to show correctly after client-side navigation (wouter). Not an auth/token issue — token is attached fresh per request (global `window.fetch` patch in `main.tsx` + `custom-fetch.ts`).

**Root cause:** the global `QueryClient` (in `src/App.tsx`) used `staleTime: 5min` + `refetchOnWindowFocus: false` and no `refetchOnMount` override. Within the stale window, navigating to a page served the in-memory cache without hitting the network, so data changed elsewhere (by the same user on another screen, or another professional) showed stale until a hard refresh wiped the cache.

**Fix:** added `refetchOnMount: "always"` to the QueryClient default. On every module mount it shows cache instantly and refetches in the background. Kept `refetchOnWindowFocus:false` and `staleTime`.

**Why it matters / how to apply:**
- For multi-user clinical data that must be current on screen, `refetchOnMount:"always"` is the intended default here. A one-off `{ query: { refetchOnMount: "always" } }` existed in `patient-profile.tsx` as a band-aid for this exact class of bug — prefer the global default over per-page patches.

**Query-key consistency rule (latent bug):** the same backend resource is sometimes fetched with TWO different query keys — the generated hooks use path-style keys (e.g. `["/api/patients"]` from `getListPatientsQueryKey()`), while some manual `useQuery` calls use ad-hoc keys (e.g. dashboard uses `["listPatients"]`, `["listGoals"]`). These are separate cache entries that never invalidate each other. When adding/fixing data fetching, reuse the generated hook/key for a resource instead of inventing a new key, or invalidations won't propagate across pages.
