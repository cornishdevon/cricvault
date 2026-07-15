---
name: Career XP system
description: XP formula and level thresholds for the player rating badge shown on web dashboard and mobile.
---

XP is computed client-side in `artifacts/cricket-stats/src/components/career-rating.tsx` (web) and inline in `artifacts/cricket-log-mobile/app/(tabs)/index.tsx` (mobile). Both must stay in sync.

**Formula:**
- 1 XP per career run
- 5 XP per innings
- 100 XP if highScore ≥ 50; 300 XP if ≥ 100
- 2 XP per four, 5 XP per six
- 15 XP per wicket, 3 XP per over
- 8 XP per catch/stumping, 10 XP per run-out
- 75 XP per POTM award
- 10 XP per match played

**Levels (7 tiers):**
- 🌱 Novice: 0 XP
- 🌾 Village Cricketer: 500 XP
- 🏏 Club: 1,000 XP
- ⚡ Amateur: 1,500 XP
- 🌟 Semi-Pro: 4,000 XP
- 🔥 Elite: 10,000 XP
- 👑 Legend: 25,000 XP

**Why:** Gamification to keep users logging matches; no server state required, recomputes instantly.
**How to apply:** Any level threshold change must be updated in BOTH career-rating.tsx (LEVELS array) AND index.tsx (careerLevel IIFE + the "next level" label chain). Village Cricketer was inserted between Novice and Club.
