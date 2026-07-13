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
import { RecentFormGuide } from "@/components/recent-form-guide";
import { BowlingForm } from "@/components/bowling-form";
import { StreakTracker } from "@/components/streak-tracker";
import { MilestonesTimeline } from "@/components/milestones-timeline";
import { CareerRating } from "@/components/career-rating";
import { SeasonTargets } from "@/components/season-targets";
import { ShareCard } from "@/components/share-card";
import { MilestoneTracker } from "@/components/milestone-tracker";
import { ExtendedBattingStats } from "@/components/extended-batting-stats";
import { ExtendedBowlingStats } from "@/components/extended-bowling-stats";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { format, parseISO, isValid } from "date-fns";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LabelList,
} from "recharts";

type PerMatchStat = {
  matchId: number;
  date: string;
  opponent: string;
  venue?: string | null;
  matchType: string;
  playingFor?: string | null;
  runs?: number | null;
  ballsFaced?: number | null;
  strikeRate?: number | null;
  battingPosition?: number | null;
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
  playerOfTheMatch?: boolean | null;
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

// ── Shared chart helpers ───────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

function xAxisProps(len: number) {
  return {
    tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } as const,
    tickLine: false as const,
    axisLine: false as const,
    interval: 0 as const,
    angle: len > 6 ? -35 : 0,
    textAnchor: (len > 6 ? "end" : "middle") as "end" | "middle",
    height: len > 6 ? 60 : 28,
  };
}

function yAxisProps() {
  return {
    tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } as const,
    tickLine: false as const,
    axisLine: false as const,
    width: 32,
  };
}

function rollingAvg(arr: number[], window = 3): (number | null)[] {
  return arr.map((_, i) => {
    const slice = arr.slice(Math.max(0, i - window + 1), i + 1).filter((v) => v != null);
    if (slice.length === 0) return null;
    return parseFloat((slice.reduce((s, v) => s + v, 0) / slice.length).toFixed(1));
  });
}

// ── Runs Chart ─────────────────────────────────────────────────────────────────

function RunsChart({ data }: { data: PerMatchStat[] }) {
  const innings = data.filter((d) => d.runs != null);
  if (innings.length === 0) return null;

  const avg = rollingAvg(innings.map((d) => d.runs ?? 0));
  const overallAvg =
    Math.round(innings.reduce((s, d) => s + (d.runs ?? 0), 0) / innings.length);

  const chartData = innings.map((d, i) => ({
    label: `vs ${d.opponent}`,
    Runs: d.runs ?? 0,
    Avg: avg[i],
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Runs Scored</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Per innings · {innings.length} logged</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{overallAvg}</p>
            <p className="text-xs text-muted-foreground">avg per innings</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" {...xAxisProps(chartData.length)} />
            <YAxis {...yAxisProps()} />
            <ReferenceLine y={overallAvg} stroke="hsl(var(--primary))" strokeDasharray="4 3" strokeOpacity={0.4} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: any, name: string) => {
                if (name === "Avg") return [`${value} (3-match avg)`, "Trend"];
                return [value, name];
              }}
            />
            <Bar dataKey="Runs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={44} opacity={0.85} />
            <Line
              dataKey="Avg"
              type="monotone"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              strokeOpacity={0.7}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Cricket ball SVG label (shown above bars where catches > 0) ───────────────

function CricketBallLabel(props: any) {
  const { x, y, width, value } = props;
  if (!value || value === 0) return null;

  const r = 7;
  const count = Math.min(value as number, 5);
  const gap = 2;
  const totalW = count * (r * 2) + (count - 1) * gap;
  const startX = (x as number) + (width as number) / 2 - totalW / 2 + r;
  const ballY = (y as number) - r - 5;

  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const bx = startX + i * (r * 2 + gap);
        return (
          <g key={i} transform={`translate(${bx},${ballY})`}>
            {/* Ball body */}
            <circle r={r} fill="#c0392b" />
            {/* Highlight */}
            <circle r={r} fill="url(#ballGrad)" />
            {/* Left seam arc */}
            <path d="M-2,-5.5 Q-5.5,0 -2,5.5" stroke="white" strokeWidth="1.1" fill="none" opacity={0.85} />
            {/* Right seam arc */}
            <path d="M2,-5.5 Q5.5,0 2,5.5" stroke="white" strokeWidth="1.1" fill="none" opacity={0.85} />
            {/* Horizontal seam line */}
            <line x1="-5" y1="0" x2="5" y2="0" stroke="white" strokeWidth="0.7" opacity={0.5} />
          </g>
        );
      })}
      {/* Show overflow count if > 5 catches */}
      {(value as number) > 5 && (
        <text
          x={(x as number) + (width as number) / 2}
          y={ballY - r - 2}
          textAnchor="middle"
          fontSize={9}
          fill="#c0392b"
          fontWeight="bold"
        >
          +{(value as number) - 5}
        </text>
      )}
      {/* Gradient definition (rendered once but harmless when repeated) */}
      <defs>
        <radialGradient id="ballGrad" cx="35%" cy="35%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity={0.25} />
          <stop offset="100%" stopColor="transparent" stopOpacity={0} />
        </radialGradient>
      </defs>
    </g>
  );
}

// ── Wickets Chart ──────────────────────────────────────────────────────────────

function WicketsChart({ data }: { data: PerMatchStat[] }) {
  const innings = data.filter((d) => d.wickets != null);
  if (innings.length === 0) return null;

  const avg = rollingAvg(innings.map((d) => d.wickets ?? 0));
  const overallAvg = parseFloat(
    (innings.reduce((s, d) => s + (d.wickets ?? 0), 0) / innings.length).toFixed(1)
  );

  const hasCatches = innings.some((d) => (d.catches ?? 0) > 0);

  const chartData = innings.map((d, i) => ({
    label: `vs ${d.opponent}`,
    Wickets: d.wickets ?? 0,
    Avg: avg[i],
    catches: d.catches ?? 0,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Wickets Taken</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Per spell · {innings.length} logged</p>
          </div>
          <div className="flex items-center gap-4">
            {hasCatches && (
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="-7 -7 14 14">
                  <circle r="6" fill="#c0392b" />
                  <path d="M-1.5,-4.5 Q-4.5,0 -1.5,4.5" stroke="white" strokeWidth="1" fill="none" opacity={0.85} />
                  <path d="M1.5,-4.5 Q4.5,0 1.5,4.5" stroke="white" strokeWidth="1" fill="none" opacity={0.85} />
                </svg>
                <span className="text-xs text-muted-foreground">= catches taken</span>
              </div>
            )}
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: "hsl(var(--secondary))" }}>{overallAvg}</p>
              <p className="text-xs text-muted-foreground">avg per spell</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 28, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" {...xAxisProps(chartData.length)} />
            <YAxis {...yAxisProps()} allowDecimals={false} />
            <ReferenceLine y={overallAvg} stroke="hsl(var(--secondary))" strokeDasharray="4 3" strokeOpacity={0.4} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: any, name: string) => {
                if (name === "Avg") return [`${value} (3-match avg)`, "Trend"];
                if (name === "catches") return [value, "Catches"];
                return [value, name];
              }}
            />
            <Bar dataKey="Wickets" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} maxBarSize={44} opacity={0.85}>
              <LabelList dataKey="catches" content={CricketBallLabel} />
            </Bar>
            <Line
              dataKey="Avg"
              type="monotone"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              dot={false}
              strokeOpacity={0.7}
            />
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
      value: `${highScoreMatch.runs}${!highScoreMatch.howOut || highScoreMatch.howOut.toLowerCase() === 'not out' ? '*' : ''}`,
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
                  <p className="text-xs text-muted-foreground">{(() => { const d = parseISO(b.date); return isValid(d) ? format(d, "d MMM yyyy") : b.date; })()}</p>
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
    const base = perMatch.filter((d) => d.matchType !== "Back Garden");
    if (selectedSeason === "all") return base;
    return base.filter((d) => d.date.startsWith(selectedSeason));
  }, [perMatch, selectedSeason]);

  const hasMatchData = filteredData.length > 0;

  const potmCount = useMemo(
    () => filteredData.filter((m) => m.playerOfTheMatch).length,
    [filteredData]
  );

  const winCount = useMemo(
    () => filteredData.filter((m) => m.result === "Win").length,
    [filteredData]
  );

  const seasonRuns = useMemo(
    () => filteredData.filter((m) => m.runs != null).reduce((s, m) => s + (m.runs ?? 0), 0),
    [filteredData]
  );

  const seasonWickets = useMemo(
    () => filteredData.filter((m) => m.wickets != null).reduce((s, m) => s + (m.wickets ?? 0), 0),
    [filteredData]
  );

  const filteredInnings = useMemo(
    () => filteredData.filter((m) => m.runs != null).length,
    [filteredData]
  );

  const filteredDismissals = useMemo(
    () => filteredData.filter((m) => m.runs != null && (!m.howOut || m.howOut.toLowerCase() !== "not out")).length,
    [filteredData]
  );

  const filteredBattingAvg = useMemo(() => {
    if (filteredDismissals === 0) return seasonRuns > 0 ? seasonRuns.toFixed(1) : "—";
    return (seasonRuns / filteredDismissals).toFixed(1);
  }, [seasonRuns, filteredDismissals]);

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
      <div id="stats" className="-mt-4" />
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
                {selectedSeason === "all" ? (summary?.batting.totalRuns ?? 0) : seasonRuns}{" "}
                <span className="text-base font-normal text-muted-foreground">runs</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {selectedSeason === "all" ? (summary?.batting as any)?.battingAverage?.toFixed(1) ?? "—" : filteredBattingAvg} •{" "}
                {selectedSeason === "all" ? (summary?.batting.innings ?? 0) : filteredInnings} innings
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

      {/* Extended batting & bowling breakdown */}
      {!summaryLoading && summary?.batting && (
        <ExtendedBattingStats batting={summary.batting as any} potmCount={summary.potmCount ?? 0} />
      )}
      {!summaryLoading && summary?.bowling && (
        <ExtendedBowlingStats bowling={summary.bowling as any} />
      )}

      {/* Milestone tracker */}
      {!summaryLoading && summary && (
        <MilestoneTracker summary={summary as any} />
      )}

      {/* Career rating */}
      {!summaryLoading && summary && (
        <CareerRating summary={summary} potmCount={potmCount} />
      )}

      {/* Season targets */}
      <div id="goals" className="-mt-2" />
      {!chartLoading && (
        <SeasonTargets
          currentRuns={seasonRuns}
          currentWickets={seasonWickets}
          season={selectedSeason}
        />
      )}

      {/* Encouragement banner — shown when bad form detected */}
      {!chartLoading && hasMatchData && (
        <EncouragementBanner data={filteredData} />
      )}

      {/* Form */}
      <div id="form" className="-mt-2" />

      {/* Runs & Wickets charts */}
      {chartLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : hasMatchData ? (
        <div className="grid gap-4 md:grid-cols-2">
          <RunsChart data={filteredData} />
          <WicketsChart data={filteredData} />
        </div>
      ) : null}

      {/* Recent match form (W/L/D dots) */}
      {chartLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : hasMatchData ? (
        <RecentFormGuide data={selectedSeason === "all" && seasons.length > 0 ? filteredData.filter((d) => d.date.startsWith(seasons[0])) : filteredData} />
      ) : null}

      {/* Batting form guide */}
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

      {/* Badges */}
      <div id="badges" className="-mt-2" />

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

      {/* Timeline */}
      <div id="timeline" className="-mt-2" />

      {/* Career milestones — always career-wide */}
      {chartLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (perMatch && perMatch.length > 0) ? (
        <MilestonesTimeline data={perMatch} />
      ) : null}

      {/* Stats share card */}
      {!summaryLoading && !chartLoading && hasMatchData && summary && (
        <ShareCard
          summary={summary}
          season={selectedSeason}
          potmCount={potmCount}
          winCount={winCount}
        />
      )}

      {/* Recent matches */}
      <div id="recent" className="-mt-2" />
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
            {matches?.filter((m) => m.date.startsWith(
              selectedSeason === "all" && seasons.length > 0 ? seasons[0] : selectedSeason
            )).map((match, i) => (
              <Link key={match.id} href={`/matches/${match.id}`} className="block">
                <Card
                  className="hover:border-primary/50 transition-colors animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg text-foreground">vs {match.opponent}</div>
                      <div className="text-sm text-muted-foreground">
                        {match.date ? (() => { const d = parseISO(match.date); return isValid(d) ? format(d, "d MMM yyyy") : match.date; })() : "Unknown date"} • {match.matchType}
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
