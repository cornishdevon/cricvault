import { useGetPerMatchStats } from "@workspace/api-client-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
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
  runs?: number | null;
  ballsFaced?: number | null;
  fours?: number | null;
  sixes?: number | null;
  wickets?: number | null;
  overs?: number | null;
  runsConceded?: number | null;
  catches?: number | null;
  stumpings?: number | null;
  result?: string | null;
  playerOfTheMatch?: boolean | null;
};

type SeasonRow = {
  season: string;
  matches: number;
  innings: number;
  runs: number;
  highScore: number;
  avg: string;
  sr: string;
  fours: number;
  sixes: number;
  wickets: number;
  bestFigures: string;
  economy: string;
  overs: number;
  catches: number;
  wins: number;
  losses: number;
  potm: number;
};

function buildSeasons(data: PerMatchStat[]): SeasonRow[] {
  const map = new Map<string, PerMatchStat[]>();
  for (const d of data) {
    const yr = d.date.slice(0, 4);
    if (!map.has(yr)) map.set(yr, []);
    map.get(yr)!.push(d);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([season, ms]) => {
      const innings = ms.filter((m) => m.runs != null);
      const runs = innings.reduce((s, m) => s + (m.runs ?? 0), 0);
      const balls = innings.reduce((s, m) => s + (m.ballsFaced ?? 0), 0);
      const hs = Math.max(...innings.map((m) => m.runs ?? 0), 0);
      const bowlMs = ms.filter((m) => m.wickets != null);
      const wkts = bowlMs.reduce((s, m) => s + (m.wickets ?? 0), 0);
      const rc = bowlMs.reduce((s, m) => s + (m.runsConceded ?? 0), 0);
      const ov = bowlMs.reduce((s, m) => s + (m.overs ?? 0), 0);
      const best = bowlMs.reduce(
        (b, m) => {
          const w = m.wickets ?? 0;
          const r = m.runsConceded ?? 999;
          return w > b.w || (w === b.w && r < b.r) ? { w, r } : b;
        },
        { w: 0, r: 0 }
      );
      return {
        season,
        matches: ms.length,
        innings: innings.length,
        runs,
        highScore: hs,
        avg: innings.length > 0 ? (runs / innings.length).toFixed(1) : "—",
        sr: balls > 0 ? ((runs / balls) * 100).toFixed(1) : "—",
        fours: innings.reduce((s, m) => s + (m.fours ?? 0), 0),
        sixes: innings.reduce((s, m) => s + (m.sixes ?? 0), 0),
        wickets: wkts,
        bestFigures: best.w > 0 ? `${best.w}/${best.r}` : "—",
        economy: ov > 0 ? (rc / ov).toFixed(2) : "—",
        overs: ov,
        catches: ms.reduce((s, m) => s + (m.catches ?? 0) + (m.stumpings ?? 0), 0),
        wins: ms.filter((m) => m.result === "Win").length,
        losses: ms.filter((m) => m.result === "Loss").length,
        potm: ms.filter((m) => (m as any).playerOfTheMatch).length,
      };
    })
    .reverse();
}

export default function SeasonsPage() {
  const { data: perMatch, isLoading } = useGetPerMatchStats();

  const seasons = useMemo(() => buildSeasons(perMatch ?? []), [perMatch]);

  const chartData = [...seasons].reverse().map((s) => ({
    season: s.season,
    Runs: s.runs,
    Wickets: s.wickets,
    Matches: s.matches,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!seasons.length) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        No matches logged yet — start tracking to see your season comparison.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Season by Season</h1>
        <p className="text-muted-foreground mt-1">Compare your stats across every season.</p>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Runs &amp; Wickets by Season</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="season" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Legend />
                <Bar dataKey="Runs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Wickets" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Batting table */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-3">Batting</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Season","M","Inn","Runs","HS","Avg","SR","4s","6s","W","L"].map((h) => (
                      <th key={h} className="px-3 py-3 text-center font-medium text-muted-foreground first:text-left first:px-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seasons.map((s) => (
                    <tr key={s.season} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{s.season}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{s.matches}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{s.innings}</td>
                      <td className="px-3 py-3 text-center font-semibold text-foreground">{s.runs}</td>
                      <td className="px-3 py-3 text-center text-foreground">{s.highScore}</td>
                      <td className="px-3 py-3 text-center text-foreground">{s.avg}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{s.sr}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{s.fours}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{s.sixes}</td>
                      <td className="px-3 py-3 text-center text-primary font-medium">{s.wins}</td>
                      <td className="px-3 py-3 text-center text-destructive font-medium">{s.losses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bowling table */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-3">Bowling</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Season","Wickets","Best","Overs","Economy","Catches"].map((h) => (
                      <th key={h} className="px-3 py-3 text-center font-medium text-muted-foreground first:text-left first:px-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seasons.map((s) => (
                    <tr key={s.season} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{s.season}</td>
                      <td className="px-3 py-3 text-center font-semibold text-foreground">{s.wickets}</td>
                      <td className="px-3 py-3 text-center text-foreground">{s.bestFigures}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{s.overs.toFixed(1)}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{s.economy}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{s.catches}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
