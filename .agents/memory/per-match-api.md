---
name: Per-match stats API fields
description: What fields /api/stats/per-match returns and the consumer pattern for typing them.
---

The `/api/stats/per-match` endpoint (in `artifacts/api-server/src/routes/matches.ts`) returns a flat object per match joining matchesTable + battingStatsTable + bowlingStatsTable + fieldingStatsTable.

**Fields added (beyond original):** `venue`, `playingFor` (from matchesTable), `battingPosition` (from battingStatsTable).

**Consumer pattern:** The `useGetPerMatchStats()` hook returns untyped JSON. Each page/component that consumes it declares a local `type PerMatchStat = { ... }` — this must include the new fields or TypeScript won't surface them:
```ts
venue?: string | null;
playingFor?: string | null;
battingPosition?: number | null;
playerOfTheMatch?: boolean | null;
```

**Why:** The API client is generated/untyped; local type aliases are the pattern used throughout the codebase (dashboard.tsx, analysis.tsx, mobile index.tsx all do this).
**How to apply:** When adding more fields to the endpoint, update the return object in matches.ts AND add the field to PerMatchStat in every consumer file that needs it.
