import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { WagonWheel } from "@/components/wagon-wheel";
import { BowlingWicketMap } from "@/components/bowling-wicket-map";
import { aggregateWheelsData, PerMatchData } from "@/utils/map-parsers";
import { useBattingHand } from "@/hooks/use-batting-hand";

type CombinedWheelsProps = {
  data: PerMatchData[];
};

export function CombinedWheels({ data }: CombinedWheelsProps) {
  const { battingHand } = useBattingHand();
  
  // Extract available filter options
  const seasons = useMemo(() => {
    const years = new Set<string>();
    for (const m of data) {
      if (m.date) years.add(m.date.substring(0, 4));
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [data]);
  
  const matchTypes = useMemo(() => {
    const types = new Set<string>();
    for (const m of data) types.add(m.matchType);
    return Array.from(types).sort();
  }, [data]);

  const opponents = useMemo(() => {
    const opps = new Set<string>();
    for (const m of data) opps.add(m.opponent);
    return Array.from(opps).sort();
  }, [data]);

  // Default season is latest available, or "all" if none
  const defaultSeason = seasons.length > 0 ? seasons[0] : "all";

  const [season, setSeason] = useState<string>(defaultSeason);
  const [matchType, setMatchType] = useState<string>("all");
  const [opponent, setOpponent] = useState<string>("all");

  const resetFilters = () => {
    setSeason(defaultSeason);
    setMatchType("all");
    setOpponent("all");
  };

  const filteredData = useMemo(() => {
    return data.filter(m => {
      if (season !== "all" && m.date.substring(0, 4) !== season) return false;
      if (matchType !== "all" && m.matchType !== matchType) return false;
      if (opponent !== "all" && m.opponent !== opponent) return false;
      return true;
    });
  }, [data, season, matchType, opponent]);

  const stats = useMemo(() => aggregateWheelsData(filteredData), [filteredData]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Combined Maps</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Aggregate your shot maps and wicket maps over time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={season} onValueChange={setSeason}>
            <SelectTrigger className="w-[130px] h-8 text-xs" aria-label="Season">
              <SelectValue placeholder="Season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All seasons</SelectItem>
              {seasons.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={matchType} onValueChange={setMatchType}>
            <SelectTrigger className="w-[130px] h-8 text-xs" aria-label="Format">
              <SelectValue placeholder="Match Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All formats</SelectItem>
              {matchTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {opponents.length > 0 && (
            <Select value={opponent} onValueChange={setOpponent}>
              <SelectTrigger className="w-[130px] h-8 text-xs" aria-label="Opponent">
                <SelectValue placeholder="Opponent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All opponents</SelectItem>
                {opponents.map(o => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {(season !== defaultSeason || matchType !== "all" || opponent !== "all") && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs px-2">
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex justify-between items-center">
              Shot Map
              <span className="text-sm font-normal text-muted-foreground">
                {stats.matchesWithShots} / {stats.matchesCount} matches with maps
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <dl aria-label="Mapped boundary totals" aria-live="polite" className="grid grid-cols-2 gap-3 w-full mb-4">
              <div className="rounded-xl border bg-muted/30 p-3 text-center">
                <dt className="text-sm text-muted-foreground">Mapped fours (4s)</dt>
                <dd className="text-2xl font-bold tabular-nums">{stats.mappedFours}</dd>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3 text-center">
                <dt className="text-sm text-muted-foreground">Mapped sixes (6s)</dt>
                <dd className="text-2xl font-bold tabular-nums">{stats.mappedSixes}</dd>
              </div>
            </dl>
            {stats.shots.length > 0 ? (
              <>
                <WagonWheel shots={stats.shots} battingHand={battingHand} />
                <div className="mt-3 text-sm text-center">
                  <span className="font-semibold text-foreground">{stats.shots.length}</span> mapped shots
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="font-semibold text-primary">{stats.totalMappedRuns}</span> mapped runs
                </div>
              </>
            ) : (
              <div className="w-full aspect-square max-w-[358px] bg-muted/30 rounded-[20px] border border-dashed border-border flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                {stats.matchesCount === 0 
                  ? "No matches found for these filters."
                  : "No shot maps recorded in these matches."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex justify-between items-center">
              Wicket Map
              <span className="text-sm font-normal text-muted-foreground">
                {stats.matchesWithWickets} / {stats.matchesCount} matches with maps
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {stats.wickets.length > 0 ? (
              <>
                <BowlingWicketMap 
                  wickets={stats.wickets} 
                  compactMarkers={true}
                  hideList={false}
                  scrollableList={true}
                />
                <div className="mt-3 text-sm text-center text-muted-foreground">
                  <span className="font-semibold text-foreground">{stats.wickets.length}</span> total
                  <span className="mx-2">·</span>
                  <span className="text-foreground">{stats.caught}</span> caught
                  <span className="mx-2">·</span>
                  <span className="text-foreground">{stats.bowled}</span> bowled
                  <span className="mx-2">·</span>
                  <span className="text-foreground">{stats.lbw}</span> LBW
                </div>
              </>
            ) : (
              <div className="w-full aspect-square max-w-[400px] bg-muted/30 rounded-[16px] border border-dashed border-border flex flex-col items-center justify-center p-6 text-center text-muted-foreground mt-[14px]">
                {stats.matchesCount === 0 
                  ? "No matches found for these filters."
                  : "No wicket maps recorded in these matches."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
