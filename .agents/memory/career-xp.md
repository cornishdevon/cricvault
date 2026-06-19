---
name: Career XP system
description: XP formula and level thresholds for the player rating badge shown on web dashboard.
---

XP is computed purely client-side in `artifacts/cricket-stats/src/components/career-rating.tsx` from the summary object (no API change needed).

**Formula:**
- 1 XP per career run
- 5 XP per innings
- 100 XP if highScore ≥ 50; 300 XP if ≥ 100
- 2 XP per four, 5 XP per six
- 15 XP per wicket, 3 XP per over
- 8 XP per catch/stumping, 10 XP per run-out
- 75 XP per POTM award
- 10 XP per match played

**Levels:** Novice (0), Club (500), Amateur (1500), Semi-Pro (4000), Elite (10000), Legend (25000)

**Why:** Gamification to keep users logging matches; no server state required, recomputes instantly.
**How to apply:** If adding new stat types, add their XP contribution to `computeXp()` in career-rating.tsx.
