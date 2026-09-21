import type { WheelShot } from "../components/WagonWheel";
import type { BowlingWicket } from "../components/BowlingWicketMap";
import { parseWicketMap } from "./wicket-map-parser";

export type PerMatchData = {
  matchId: number;
  date: string;
  opponent: string;
  matchType: string;
  shotData?: string | null;
  wicketMap?: string | null;
};

export function parseWheelShots(value: string | null | undefined): WheelShot[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some((s) =>
      !s || !Number.isFinite(s.x) || !Number.isFinite(s.y) ||
      s.x < -0.2 || s.x > 1.2 || s.y < -0.2 || s.y > 1.2 ||
      ![1, 2, 4, 6].includes(s.runs)
    )) return [];
    return parsed.map(({ x, y, runs }) => ({ x, y, runs }));
  } catch {
    return [];
  }
}

export function filterCombinedMatches(
  data: PerMatchData[],
  filters: { year: string; matchType: string; opponent: string },
) {
  return data.filter((match) =>
    (filters.year === "all" || match.date.substring(0, 4) === filters.year) &&
    (filters.matchType === "all" || match.matchType === filters.matchType) &&
    (filters.opponent === "all" || match.opponent === filters.opponent));
}

export function aggregateWheelsData(matches: PerMatchData[]) {
  const shots: WheelShot[] = [];
  const wickets: BowlingWicket[] = [];
  let matchesWithShots = 0;
  let matchesWithWickets = 0;
  // Sorting affects numbering only, never saved geometry or the input array.
  const sorted = [...matches].sort((a, b) =>
    a.date.localeCompare(b.date) || a.matchId - b.matchId);
  for (const match of sorted) {
    const matchShots = parseWheelShots(match.shotData);
    const matchWickets = parseWicketMap(match.wicketMap);
    if (matchShots.length) matchesWithShots++;
    if (matchWickets.length) matchesWithWickets++;
    shots.push(...matchShots);
    matchWickets.forEach((wicket, index) => wickets.push({
      ...wicket,
      id: `m${match.matchId}-${index}-${wicket.id}`,
      sourceMatchId: match.matchId,
      sourceOpponent: match.opponent,
      sourceDate: match.date,
    }));
  }
  return {
    shots, wickets, matchesWithShots, matchesWithWickets,
    totalMatches: matches.length,
    totalMappedRuns: shots.reduce((sum, shot) => sum + shot.runs, 0),
    totalMappedWickets: wickets.length,
  };
}