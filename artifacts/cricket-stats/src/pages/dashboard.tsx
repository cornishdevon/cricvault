import {
  useGetStatsSummary,
  useListMatches,
  useGetPerMatchStats,
  getGetStatsSummaryQueryKey,
  getListMatchesQueryKey,
  getGetPerMatchStatsQueryKey,
} from "@workspace/api-client-react";
import { Achievements } from "@/components/achievements";
import { EncouragementBanner } from "@/components/encouragement-banner";
import { FormGuide } from "@/components/form-guide";
import { BowlingForm } from "@/components/bowling-form";
import { StreakTracker } from "@/components/streak-tracker";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type PerMatchStat = {
  matchId: number;
  date: string;
  opponent: string;
  matchType: string;
  runs?: number | null;
  ballsFaced?: number | null;
  strikeRate?: number | null;
  fours?: number | null;
  sixes?: number | null;
  howOut?: string | null;
  wickets?: number | null;
  overs?: number | null;
  runsConceded?: number | null;
  economyRate?: number | null;
  bowledWickets?: number | null;
  lbwWickets?: number | null;
  catches?: number | null;
  stumpings?: number | null;
  droppedCatches?: number | null;
  missedStumpings?: number | null;
  hatTrick?: boolean | null;
  result?: string | null;
};

function exportCSV(data: PerMatchStat[], season: string) {
  const headers = [
    "Date", "Opponent", "Match Type", "Result",
    "Runs", "Balls Faced", "Strike Rate", "Fours", "Sixes", "How Out",
    "Wickets", "Overs", "Runs Conceded", "Economy Rate", "Bowled Wkts", "LBW Wkts",
    "Catches", "Stumpings", "Dropped Catches", "Missed Stumpings", "Hat Trick",
  ];

  const rows = data.map((m) => [
    m.date,
    m.opponent,
    m.matchType,
    m.result ?? "",
    m.runs ?? "",
    m.ballsFaced ?? "",
    m.strikeRate != null ? m.strikeRate.toFixed(1) : "",
    m.fours ?? "",
    m.sixes ?? "",
    m.howOut ?? "",
    m.wickets ?? "",
    m.overs ?? "",
    m.runsConceded ?? "",
    m.economyRate != null ? m.economyRate.toFixed(2) : "",
    m.bowledWickets ?? "",
    m.lbwWickets ?? "",
    m.catches ?? "",
    m.stumpings ?? "",
    m.droppedCatches ?? "",
    m.missedStumpings ?? "",
    m.hatTrick ? "Yes" : "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = season === "all" ? "cricket-log-career.csv" : `cricket-log-${season}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Performance Chart ─────────────────────────────────────────────────────────

function PerformanceChart({ data }: { data: PerMatchStat[] }) {
  const chartData = data.map((d) => ({
    label: `vs ${d.opponent}`,
    Runs: d.runs ?? 0,
    Wickets: d.wickets ?? 0,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Performance Over Time</CardTitle>
        <p className="text-sm text-muted-foreground">
          Runs and wickets across all logged matches.
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={chartData.length > 5 ? -30 : 0}
              textAnchor={chartData.length > 5 ? "end" : "middle"}
              height={chartData.length > 5 ? 56 : 32}
            />
            <YAxis
              yAxisId="runs"
              orientation="left"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Runs",
                angle: -90,
                position: "insideLeft",
                offset: 12,
                style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <YAxis
              yAxisId="wickets"
              orientation="right"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, "auto"]}
              label={{
                value: "Wickets",
                angle: 90,
                position: "insideRight",
                offset: 12,
                style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: any, name: string) =>
                value === null || value === undefined ? ["—", name] : [value, name]
              }
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))", paddingTop: 8 }}
            />
            <Bar yAxisId="runs" dataKey="Runs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar yAxisId="wickets" dataKey="Wickets" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Personal Bests ────────────────────────────────────────────────────────────

function PersonalBests({ data }: { data: PerMatchStat[] }) {
  const batting = data.filter((d) => d.runs !== null && d.runs !== undefined);
  const highScoreMatch = batting.reduce<PerMatchStat | null>(
    (best, d) => (!best || (d.runs ?? 0) > (best.runs ?? 0) ? d : best),
    null
  );

  const bowling = data.filter((d) => d.wickets !== null && d.wickets !== undefined);
  const bestBowlingMatch = bowling.reduce<PerMatchStat | null>((best, d) => {
    if (!best) return d;
    if ((d.wickets ?? 0) > (best.wickets ?? 0)) return d;
    if ((d.wickets ?? 0) === (best.wickets ?? 0) && (d.runsConceded ?? 999) < (best.runsConceded ?? 999)) return d;
    return best;
  }, null);

  const fielding = data.filter(
    (d) => (d.catches ?? 0) + (d.stumpings ?? 0) > 0
  );
  const bestFieldingMatch = fielding.reduce<PerMatchStat | null>((best, d) => {
    const total = (d.catches ?? 0) + (d.stumpings ?? 0);
    const bestTotal = best ? (best.catches ?? 0) + (best.stumpings ?? 0) : -1;
    return total > bestTotal ? d : best;
  }, null);

  const bests = [
    highScoreMatch && {
      title: "Highest Score",
      value: `${highScoreMatch.runs}`,
      sub: highScoreMatch.strikeRate != null ? `SR ${Number(highScoreMatch.strikeRate).toFixed(1)}` : null,
      opponent: highScoreMatch.opponent,
      matchId: highScoreMatch.matchId,
      date: highScoreMatch.date,
    },
    bestBowlingMatch && {
      title: "Best Bowling",
      value: `${bestBowlingMatch.wickets}/${bestBowlingMatch.runsConceded}`,
      sub: bestBowlingMatch.economyRate != null ? `Econ ${Number(bestBowlingMatch.economyRate).toFixed(2)}` : null,
      opponent: bestBowlingMatch.opponent,
      matchId: bestBowlingMatch.matchId,
      date: bestBowlingMatch.date,
    },
    bestFieldingMatch && {
      title: "Best Fielding",
      value: `${(bestFieldingMatch.catches ?? 0) + (bestFieldingMatch.stumpings ?? 0)} dismissals`,
      sub: [
        (bestFieldingMatch.catches ?? 0) > 0 && `${bestFieldingMatch.catches}c`,
        (bestFieldingMatch.stumpings ?? 0) > 0 && `${bestFieldingMatch.stumpings}st`,
      ].filter(Boolean).join(" ") || null,
      opponent: bestFieldingMatch.opponent,
      matchId: bestFieldingMatch.matchId,
      date: bestFieldingMatch.date,
    },
  ].filter(Boolean) as {
    title: string; value: string; sub: string | null;
    opponent: string; matchId: number; date: string;
  }[];

  if (bests.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-4">Personal Bests</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {bests.map((b) => (
          <Link key={b.title} href={`/matches/${b.matchId}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">{b.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-3xl font-bold text-foreground">{b.value}</div>
                {b.sub && <p className="text-xs text-muted-foreground">{b.sub}</p>}
                <div className="pt-2 border-t border-border">
                  <p className="text-sm font-medium text-foreground">vs {b.opponent}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(b.date), "MMM d, yyyy")}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Head-to-Head ──────────────────────────────────────────────────────────────

type H2HRecord = {
  opponent: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  noResult: number;
  avgRuns: number | null;
  avgWickets: number | null;
  matchIds: number[];
};

function HeadToHead({ data }: { data: PerMatchStat[] }) {
  const map = new Map<string, H2HRecord>();

  for (const d of data) {
    if (!map.has(d.opponent)) {
      map.set(d.opponent, {
        opponent: d.opponent,
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        noResult: 0,
        avgRuns: null,
        avgWickets: null,
        matchIds: [],
      });
    }
    const rec = map.get(d.opponent)!;
    rec.played++;
    rec.matchIds.push(d.matchId);
    if (d.result === "Win") rec.wins++;
    else if (d.result === "Loss") rec.losses++;
    else if (d.result === "Draw") rec.draws++;
    else if (d.result === "No Result") rec.noResult++;
  }

  // Compute averages per opponent
  for (const [opp, rec] of map.entries()) {
    const matches = data.filter((d) => d.opponent === opp);
    const runsInnings = matches.filter((d) => d.runs !== null && d.runs !== undefined);
    const wicketsInnings = matches.filter((d) => d.wickets !== null && d.wickets !== undefined);
    rec.avgRuns = runsInnings.length > 0
      ? Math.round(runsInnings.reduce((s, d) => s + (d.runs ?? 0), 0) / runsInnings.length)
      : null;
    rec.avgWickets = wicketsInnings.length > 0
      ? parseFloat((wicketsInnings.reduce((s, d) => s + (d.wickets ?? 0), 0) / wicketsInnings.length).toFixed(1))
      : null;
  }

  const records = Array.from(map.values()).sort((a, b) => b.played - a.played);

  if (records.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-4">Head-to-Head</h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Opponent</th>
                  <th className="text-center px-3 py-3 font-medium text-muted-foreground">P</th>
                  <th className="text-center px-3 py-3 font-medium text-muted-foreground">W</th>
                  <th className="text-center px-3 py-3 font-medium text-muted-foreground">L</th>
                  <th className="text-center px-3 py-3 font-medium text-muted-foreground">D</th>
                  <th className="text-center px-3 py-3 font-medium text-muted-foreground">Avg Runs</th>
                  <th className="text-center px-3 py-3 font-medium text-muted-foreground">Avg Wkts</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Record</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => {
                  const winPct = rec.played > 0 ? (rec.wins / rec.played) * 100 : 0;
                  return (
                    <tr
                      key={rec.opponent}
                      className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors animate-in fade-in`}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{rec.opponent}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{rec.played}</td>
                      <td className="px-3 py-3 text-center font-semibold text-primary">{rec.wins}</td>
                      <td className="px-3 py-3 text-center font-semibold text-destructive">{rec.losses}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{rec.draws + rec.noResult}</td>
                      <td className="px-3 py-3 text-center text-foreground">
                        {rec.avgRuns !== null ? rec.avgRuns : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3 text-center text-foreground">
                        {rec.avgWickets !== null ? rec.avgWickets : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge
                          variant="outline"
                          className={
                            winPct >= 60
                              ? "bg-primary/10 text-primary border-primary/20"
                              : winPct >= 40
                              ? "bg-accent text-accent-foreground"
                              : rec.wins === 0 && rec.losses > 0
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {rec.wins}W–{rec.losses}L
                          {rec.draws + rec.noResult > 0 ? `–${rec.draws + rec.noResult}D` : ""}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [selectedSeason, setSelectedSeason] = useState("all");

  const { data: summary, isLoading: summaryLoading } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey() },
  });
  const { data: matches, isLoading: matchesLoading } = useListMatches({
    query: { queryKey: getListMatchesQueryKey() },
  });
  const { data: perMatch, isLoading: chartLoading } = useGetPerMatchStats({
    query: { queryKey: getGetPerMatchStatsQueryKey() },
  });

  const seasons = useMemo(() => {
    if (!perMatch) return [];
    const years = [...new Set(perMatch.map((d) => d.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
    return years;
  }, [perMatch]);

  const filteredData = useMemo(() => {
    if (!perMatch) return [];
    if (selectedSeason === "all") return perMatch;
    return perMatch.filter((d) => d.date.startsWith(selectedSeason));
  }, [perMatch, selectedSeason]);

  const hasMatchData = filteredData.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {selectedSeason === "all" ? "Career Summary" : `${selectedSeason} Season`}
          </h1>
          <p className="text-muted-foreground mt-2">
            {selectedSeason === "all"
              ? "Your overall performance across all matches."
              : `Showing stats for the ${selectedSeason} season.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filteredData.length > 0 && (
            <>
              <Link
                href={selectedSeason === "all" ? "/season-report" : `/season-report?year=${selectedSeason}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Season Report
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-sm"
                onClick={() => exportCSV(filteredData, selectedSeason)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
              </Button>
            </>
          )}
          {seasons.length > 0 && (
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                {seasons.map((y) => (
                  <SelectItem key={y} value={y}>{y} season</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {summaryLoading ? (
        <div className="rounded-2xl bg-primary p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-primary p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Batting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {summary?.batting.totalRuns ?? 0}{" "}
                <span className="text-base font-normal text-muted-foreground">runs</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                HS: {summary?.batting.highScore ?? 0} • SR:{" "}
                {summary?.batting.averageStrikeRate?.toFixed(1) ?? "0.0"} •{" "}
                {summary?.batting.innings ?? 0} innings
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bowling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {summary?.bowling.totalWickets ?? 0}{" "}
                <span className="text-base font-normal text-muted-foreground">wickets</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Best: {summary?.bowling.bestFigures ?? "0/0"} • Econ:{" "}
                {summary?.bowling.averageEconomyRate?.toFixed(2) ?? "0.00"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fielding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {summary?.fielding.totalCatches ?? 0}{" "}
                <span className="text-base font-normal text-muted-foreground">catches</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Run Outs: {summary?.fielding.totalRunOuts ?? 0} • Dropped:{" "}
                {summary?.fielding.totalDroppedCatches ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>
        </div>
      )}

      {/* Encouragement banner — shown when bad form detected */}
      {!chartLoading && hasMatchData && (
        <EncouragementBanner data={filteredData} />
      )}

      {/* Performance chart */}
      {chartLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : hasMatchData ? (
        <PerformanceChart data={filteredData} />
      ) : null}

      {/* Form guide */}
      {chartLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : hasMatchData ? (
        <FormGuide data={filteredData} />
      ) : null}

      {/* Bowling form guide */}
      {chartLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : hasMatchData ? (
        <BowlingForm data={filteredData} />
      ) : null}

      {/* Streak tracker */}
      {chartLoading ? (
        <Skeleton className="h-36 rounded-xl" />
      ) : hasMatchData ? (
        <StreakTracker data={filteredData} />
      ) : null}

      {/* Personal bests */}
      {chartLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      ) : hasMatchData ? (
        <PersonalBests data={filteredData} />
      ) : null}

      {/* Achievements & milestones — always career-wide */}
      {chartLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : (perMatch && perMatch.length > 0) ? (
        <Achievements data={perMatch} />
      ) : null}

      {/* Head-to-head */}
      {chartLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : hasMatchData ? (
        <HeadToHead data={filteredData} />
      ) : null}

      {/* Recent matches */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Recent Matches</h2>
          <Link href="/matches/new" className="text-sm text-primary font-medium hover:underline">
            + Log Match
          </Link>
        </div>

        {matchesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : matches?.length === 0 ? (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <p className="text-lg font-medium text-foreground">No matches logged yet</p>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Start tracking your stats to see them here.
              </p>
              <Link
                href="/matches/new"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Log Your First Match
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(selectedSeason === "all"
              ? matches
              : matches?.filter((m) => m.date.startsWith(selectedSeason))
            )?.map((match, i) => (
              <Link key={match.id} href={`/matches/${match.id}`} className="block">
                <Card
                  className="hover:border-primary/50 transition-colors animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg text-foreground">vs {match.opponent}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(match.date), "MMM d, yyyy")} • {match.matchType}
                        {match.venue ? ` • ${match.venue}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-medium ${
                          match.result === "Win"
                            ? "text-primary"
                            : match.result === "Loss"
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {match.result || "Pending"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
