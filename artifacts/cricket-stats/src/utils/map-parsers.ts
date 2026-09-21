import { WheelShot } from "@/components/wagon-wheel";
import { BowlingWicket, parseWicketMap } from "@/components/bowling-wicket-map";

export function parseWheelShots(value: string | null | undefined): WheelShot[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some((s) =>
      !s || !Number.isFinite(s.x) || !Number.isFinite(s.y) ||
      s.x < -0.2 || s.x > 1.2 || s.y < -0.2 || s.y > 1.2 ||
      !([1, 2, 4, 6].includes(s.runs))
    )) throw new Error("Invalid saved wheel shots");
    return parsed as WheelShot[];
  } catch (error) {
    console.warn("Unable to read saved wheel shots", error);
    return [];
  }
}

export type PerMatchData = {
  matchId: number;
  date: string;
  opponent: string;
  matchType: string;
  shotData?: string | null;
  wicketMap?: string | null;
  runs?: number | null;
  wickets?: number | null;
};

export type CombinedWheelsStats = {
  matchesCount: number;
  matchesWithShots: number;
  matchesWithWickets: number;
  totalMappedRuns: number;
  mappedFours: number;
  mappedSixes: number;
  caught: number;
  bowled: number;
  lbw: number;
  shots: WheelShot[];
  wickets: BowlingWicket[];
};

export function aggregateWheelsData(matches: PerMatchData[]): CombinedWheelsStats {
  const stats: CombinedWheelsStats = {
    matchesCount: matches.length,
    matchesWithShots: 0,
    matchesWithWickets: 0,
    totalMappedRuns: 0,
    mappedFours: 0,
    mappedSixes: 0,
    caught: 0,
    bowled: 0,
    lbw: 0,
    shots: [],
    wickets: [],
  };

  // Sort matches chronologically to ensure per-season sequential markers.
  const sortedMatches = [...matches].sort((a, b) => a.date.localeCompare(b.date));

  for (const match of sortedMatches) {
    let hasShots = false;
    let hasWickets = false;

    if (match.shotData) {
      const matchShots = parseWheelShots(match.shotData);
      if (matchShots.length > 0) {
        hasShots = true;
        stats.matchesWithShots++;
        stats.shots.push(...matchShots);
        for (const shot of matchShots) {
          stats.totalMappedRuns += shot.runs;
          if (shot.runs === 4) stats.mappedFours++;
          if (shot.runs === 6) stats.mappedSixes++;
        }
      }
    }

    if (match.wicketMap) {
      const matchWickets = parseWicketMap(match.wicketMap);
      if (matchWickets.length > 0) {
        hasWickets = true;
        stats.matchesWithWickets++;
        
        for (const w of matchWickets) {
          if (w.kind === "caught") stats.caught++;
          else if (w.kind === "bowled") stats.bowled++;
          else if (w.kind === "lbw") stats.lbw++;
          
          stats.wickets.push({
            ...w,
            // Prefix match ID to ensure unique ID across matches
            id: `m${match.matchId}-${w.id}`,
            // Provenance is display-only metadata for the combined map. It is
            // never copied into the JSON saved for an individual match.
            sourceMatchId: match.matchId,
            sourceOpponent: match.opponent,
            sourceDate: match.date,
          });
        }
      }
    }
  }

  return stats;
}
