import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";

type Summary = {
  batting: {
    totalRuns: number;
    highScore: number;
    innings: number;
    totalFours: number;
    totalSixes: number;
    averageStrikeRate: number;
  };
  bowling: {
    totalWickets: number;
    bestFigures: string;
    totalOvers: number;
    averageEconomyRate: number;
  };
  fielding: {
    totalCatches: number;
    totalRunOuts: number;
    totalStumpings: number;
    totalDroppedCatches: number;
  };
  totalMatches: number;
};

type Level = {
  name: string;
  emoji: string;
  minXp: number;
  color: string;
  bg: string;
  ring: string;
};

const LEVELS: Level[] = [
  { name: "Novice",           emoji: "🌱", minXp: 0,     color: "#64748b", bg: "#f1f5f9", ring: "#cbd5e1" },
  { name: "Village Cricketer",emoji: "🌾", minXp: 500,   color: "#92400e", bg: "#fef3c7", ring: "#fcd34d" },
  { name: "Club",             emoji: "🏏", minXp: 1000,  color: "#16a34a", bg: "#f0fdf4", ring: "#86efac" },
  { name: "Amateur",          emoji: "⚡", minXp: 1500,  color: "#2563eb", bg: "#eff6ff", ring: "#93c5fd" },
  { name: "First XI",         emoji: "🎯", minXp: 2500,  color: "#0891b2", bg: "#ecfeff", ring: "#67e8f9" },
  { name: "Semi-Pro",         emoji: "🌟", minXp: 4000,  color: "#7c3aed", bg: "#f5f3ff", ring: "#c4b5fd" },
  { name: "County",           emoji: "🏅", minXp: 6500,  color: "#be185d", bg: "#fdf2f8", ring: "#f9a8d4" },
  { name: "Elite",            emoji: "🔥", minXp: 10000, color: "#d97706", bg: "#fffbeb", ring: "#fcd34d" },
  { name: "International",    emoji: "🌍", minXp: 17500, color: "#059669", bg: "#ecfdf5", ring: "#6ee7b7" },
  { name: "Legend",           emoji: "👑", minXp: 25000, color: "#dc2626", bg: "#fff1f2", ring: "#fca5a5" },
  { name: "Hall of Fame",     emoji: "🏆", minXp: 50000, color: "#b45309", bg: "#fffbeb", ring: "#fbbf24" },
];

function computeXp(summary: Summary, potmCount: number): number {
  let xp = 0;
  xp += summary.batting.totalRuns;
  xp += summary.batting.innings * 5;
  if (summary.batting.highScore >= 100) xp += 300;
  else if (summary.batting.highScore >= 50) xp += 100;
  xp += summary.batting.totalFours * 2;
  xp += summary.batting.totalSixes * 5;
  xp += summary.bowling.totalWickets * 15;
  xp += Math.floor(summary.bowling.totalOvers) * 3;
  xp += summary.fielding.totalCatches * 8;
  xp += summary.fielding.totalRunOuts * 10;
  xp += summary.fielding.totalStumpings * 8;
  xp += potmCount * 75;
  xp += summary.totalMatches * 10;
  return Math.round(xp);
}

export function CareerRating({ summary, potmCount }: { summary: Summary; potmCount: number }) {
  const { xp, level, nextLevel, progress } = useMemo(() => {
    const xp = computeXp(summary, potmCount);
    let level = LEVELS[0];
    let nextLevel: Level | null = null;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXp) { level = LEVELS[i]; nextLevel = LEVELS[i + 1] ?? null; break; }
    }
    const progress = nextLevel
      ? Math.min(((xp - level.minXp) / (nextLevel.minXp - level.minXp)) * 100, 100)
      : 100;
    return { xp, level, nextLevel, progress };
  }, [summary, potmCount]);

  return (
    <Card style={{ borderColor: level.ring, backgroundColor: level.bg }}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: level.ring + "55", border: `3px solid ${level.ring}` }}
          >
            {level.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-lg font-bold" style={{ color: level.color }}>{level.name}</span>
              <span className="text-xs text-muted-foreground font-medium">{xp.toLocaleString()} XP</span>
            </div>
            {nextLevel ? (
              <>
                <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, backgroundColor: level.color }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {(nextLevel.minXp - xp).toLocaleString()} XP to {nextLevel.name} {nextLevel.emoji}
                </p>
              </>
            ) : (
              <p className="text-xs font-medium" style={{ color: level.color }}>Maximum level achieved! 🎉</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
