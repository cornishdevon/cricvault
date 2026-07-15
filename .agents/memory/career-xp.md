---
name: Career XP system
description: XP formula, career level thresholds, and bowling level thresholds shown on web dashboard and mobile.
---

## Career XP (all-round, shown as career badge)

Computed client-side in `artifacts/cricket-stats/src/components/career-rating.tsx` (`computeXp`) and inline in `artifacts/cricket-log-mobile/app/(tabs)/index.tsx` (careerLevel IIFE). **Both must stay in sync.**

**Formula:**
- 1 XP per career run
- 5 XP per innings
- 100 XP if highScore ≥ 50; 300 XP if ≥ 100
- 2 XP per four, 5 XP per six
- 15 XP per wicket, 3 XP per over
- 8 XP per catch/stumping, 10 XP per run-out
- 75 XP per POTM award
- 10 XP per match played

**11 Career XP Levels:**
| Level | XP |
|---|---|
| 🌱 Novice | 0 |
| 🌾 Village Cricketer | 500 |
| 🏏 Club | 1,000 |
| ⚡ Amateur | 1,500 |
| 🎯 First XI | 2,500 |
| 🌟 Semi-Pro | 4,000 |
| 🏅 County | 6,500 |
| 🔥 Elite | 10,000 |
| 🌍 International | 17,500 |
| 👑 Legend | 25,000 |
| 🏆 Hall of Fame | 50,000 |

Any change to thresholds must update BOTH `LEVELS` array in career-rating.tsx AND the careerLevel IIFE + "next level" label chain in index.tsx.

---

## Bowling Level (wicket-based, shown separately)

Computed in `BowlingRating` component (web: `career-rating.tsx`, exported and used in `dashboard.tsx`) and `bowlingLevel` IIFE (mobile: `index.tsx`). Badge appears below the wickets chip in the mobile hero.

**11 Bowling Levels (career wickets):**
| Level | Wickets |
|---|---|
| 🎳 Trundler | 0 |
| ⚡ Club Bowler | 10 |
| 🎯 Occasional | 25 |
| 💫 Wicket Taker | 50 |
| 🌟 Strike Bowler | 100 |
| 🏏 First XI | 200 |
| 🏅 County | 350 |
| 🔥 Elite | 500 |
| 🌍 International | 750 |
| 👑 Legend | 1,000 |
| 🏆 Hall of Fame | 2,000 |

**Why:** Gives bowlers their own progression separate from the all-round XP system.
**How to apply:** Any threshold change must update BOTH `BOWLING_LEVELS` in career-rating.tsx AND `bowlingLevel` IIFE in index.tsx.
