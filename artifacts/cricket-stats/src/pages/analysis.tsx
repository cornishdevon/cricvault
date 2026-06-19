import { useGetPerMatchStats } from "@workspace/api-client-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
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
  wickets?: number | null;
  overs?: number | null;
  runsConceded?: number | null;
  economyRate?: number | null;
  howOut?: string | null;
  result?: string | null;
  playerOfTheMatch?: boolean | null;
  catches?: number | null;
};

const DISMISSAL_COLORS = [
  "#16a34a","#2563eb","#7c3aed","#d97706","#dc2626",
  "#0891b2","#db2777","#65a30d","#9333ea","#c2410c","#475569",
];

// ── Dismissal Breakdown ───────────────────────────────────────────────────────

function DismissalBreakdown({ data }: { data: PerMatchStat[] }) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of data) {
      if (m.howOut) {
        const key = m.howOut.trim();
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const totalInnings = data.filter((m) => m.runs != null).length;
  const notOuts = counts.filter((c) => c.name.toLowerCase().includes("not out") || c.name.toLowerCase().includes("retired")).reduce((s, c) => s + c.value, 0);

  if (counts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          Dismissal Breakdown
          <span className="text-sm font-normal text-muted-foreground">{totalInnings} innings · {notOuts} not out</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={counts} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={72} paddingAngle={2}>
                  {counts.map((_, i) => (
                    <Cell key={i} fill={DISMISSAL_COLORS[i % DISMISSAL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 w-full">
            <div className="space-y-2">
              {counts.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: DISMISSAL_COLORS[i % DISMISSAL_COLORS.length] }} />
                  <span className="text-sm text-foreground flex-1">{c.name}</span>
                  <span className="text-sm font-semibold text-foreground">{c.value}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right">{totalInnings > 0 ? Math.round((c.value / totalInnings) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Match Type Comparison ─────────────────────────────────────────────────────

function MatchTypeComparison({ data }: { data: PerMatchStat[] }) {
  const rows = useMemo(() => {
    const map = new Map<string, PerMatchStat[]>();
    for (const m of data) {
      if (!map.has(m.matchType)) map.set(m.matchType, []);
      map.get(m.matchType)!.push(m);
    }
    return Array.from(map.entries())
      .map(([type, ms]) => {
        const innings = ms.filter((m) => m.runs != null);
        const runs = innings.reduce((s, m) => s + (m.runs ?? 0), 0);
        const balls = innings.reduce((s, m) => s + (m.ballsFaced ?? 0), 0);
        const bowlMs = ms.filter((m) => m.wickets != null);
        const wkts = bowlMs.reduce((s, m) => s + (m.wickets ?? 0), 0);
        const rc = bowlMs.reduce((s, m) => s + (m.runsConceded ?? 0), 0);
        const ov = bowlMs.reduce((s, m) => s + (m.overs ?? 0), 0);
        return {
          type,
          matches: ms.length,
          innings: innings.length,
          runs,
          avg: innings.length > 0 ? (runs / innings.length).toFixed(1) : "—",
          sr: balls > 0 ? ((runs / balls) * 100).toFixed(1) : "—",
          hs: Math.max(...innings.map((m) => m.runs ?? 0), 0),
          wickets: wkts,
          economy: ov > 0 ? (rc / ov).toFixed(2) : "—",
          wins: ms.filter((m) => m.result === "Win").length,
        };
      })
      .sort((a, b) => b.matches - a.matches);
  }, [data]);

  if (rows.length < 2) return null;

  const chartData = rows.map((r) => ({ type: r.type, Runs: r.runs, Wickets: r.wickets }));

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight mb-3">By Match Type</h2>
      <div className="space-y-4">
        {rows.length > 1 && (
          <Card>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} />
                  <Legend />
                  <Bar dataKey="Runs" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                  <Bar dataKey="Wickets" fill="#8b5cf6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Type","M","Inn","Runs","HS","Avg","SR","Wkts","Econ","W"].map(h => (
                      <th key={h} className="px-3 py-3 text-center font-medium text-muted-foreground first:text-left first:px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.type} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{r.type}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{r.matches}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{r.innings}</td>
                      <td className="px-3 py-3 text-center font-semibold text-foreground">{r.runs}</td>
                      <td className="px-3 py-3 text-center text-foreground">{r.hs}</td>
                      <td className="px-3 py-3 text-center text-foreground">{r.avg}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{r.sr}</td>
                      <td className="px-3 py-3 text-center font-semibold text-foreground">{r.wickets}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{r.economy}</td>
                      <td className="px-3 py-3 text-center text-primary font-medium">{r.wins}</td>
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

// ── Venue Stats ───────────────────────────────────────────────────────────────

function VenueStats({ data }: { data: PerMatchStat[] }) {
  const rows = useMemo(() => {
    const map = new Map<string, PerMatchStat[]>();
    for (const m of data) {
      const key = m.venue?.trim() || "Unknown venue";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries())
      .filter(([key]) => key !== "Unknown venue" || map.size === 1)
      .map(([venue, ms]) => {
        const innings = ms.filter((m) => m.runs != null);
        const runs = innings.reduce((s, m) => s + (m.runs ?? 0), 0);
        const hs = Math.max(...innings.map((m) => m.runs ?? 0), 0);
        const wkts = ms.filter((m) => m.wickets != null).reduce((s, m) => s + (m.wickets ?? 0), 0);
        return {
          venue,
          matches: ms.length,
          runs,
          hs,
          avg: innings.length > 0 ? (runs / innings.length).toFixed(1) : "—",
          wickets: wkts,
          wins: ms.filter((m) => m.result === "Win").length,
          losses: ms.filter((m) => m.result === "Loss").length,
        };
      })
      .filter((r) => r.venue !== "Unknown venue")
      .sort((a, b) => b.matches - a.matches);
  }, [data]);

  if (rows.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight mb-3">By Venue</h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Venue","M","Runs","HS","Avg","Wkts","W","L"].map(h => (
                    <th key={h} className="px-3 py-3 text-center font-medium text-muted-foreground first:text-left first:px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.venue} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground max-w-[200px] truncate">{r.venue}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{r.matches}</td>
                    <td className="px-3 py-3 text-center font-semibold text-foreground">{r.runs}</td>
                    <td className="px-3 py-3 text-center text-foreground">{r.hs}</td>
                    <td className="px-3 py-3 text-center text-foreground">{r.avg}</td>
                    <td className="px-3 py-3 text-center text-foreground">{r.wickets}</td>
                    <td className="px-3 py-3 text-center text-primary font-medium">{r.wins}</td>
                    <td className="px-3 py-3 text-center text-destructive font-medium">{r.losses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Batting Position Breakdown ─────────────────────────────────────────────────

function BattingPositionBreakdown({ data }: { data: PerMatchStat[] }) {
  const rows = useMemo(() => {
    const map = new Map<number, PerMatchStat[]>();
    for (const m of data) {
      if (m.battingPosition != null && m.runs != null) {
        if (!map.has(m.battingPosition)) map.set(m.battingPosition, []);
        map.get(m.battingPosition)!.push(m);
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([pos, ms]) => {
        const runs = ms.reduce((s, m) => s + (m.runs ?? 0), 0);
        const balls = ms.reduce((s, m) => s + (m.ballsFaced ?? 0), 0);
        const hs = Math.max(...ms.map((m) => m.runs ?? 0), 0);
        return {
          pos,
          label: pos === 1 ? "Opener (1)" : pos === 2 ? "Opener (2)" : `No. ${pos}`,
          innings: ms.length,
          runs,
          hs,
          avg: (runs / ms.length).toFixed(1),
          sr: balls > 0 ? ((runs / balls) * 100).toFixed(1) : "—",
        };
      });
  }, [data]);

  if (rows.length < 2) return null;

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight mb-3">By Batting Position</h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Position","Inn","Runs","HS","Avg","SR"].map(h => (
                    <th key={h} className="px-3 py-3 text-center font-medium text-muted-foreground first:text-left first:px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.pos} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{r.label}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{r.innings}</td>
                    <td className="px-3 py-3 text-center font-semibold text-foreground">{r.runs}</td>
                    <td className="px-3 py-3 text-center text-foreground">{r.hs}</td>
                    <td className="px-3 py-3 text-center text-foreground">{r.avg}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{r.sr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Playing For Tracker ───────────────────────────────────────────────────────

function PlayingForTracker({ data }: { data: PerMatchStat[] }) {
  const rows = useMemo(() => {
    const map = new Map<string, PerMatchStat[]>();
    for (const m of data) {
      const key = m.playingFor?.trim() || "";
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    if (map.size < 2) return [];
    return Array.from(map.entries())
      .map(([team, ms]) => {
        const innings = ms.filter((m) => m.runs != null);
        const runs = innings.reduce((s, m) => s + (m.runs ?? 0), 0);
        const wkts = ms.filter((m) => m.wickets != null).reduce((s, m) => s + (m.wickets ?? 0), 0);
        return {
          team,
          matches: ms.length,
          runs,
          avg: innings.length > 0 ? (runs / innings.length).toFixed(1) : "—",
          hs: Math.max(...innings.map((m) => m.runs ?? 0), 0),
          wickets: wkts,
          wins: ms.filter((m) => m.result === "Win").length,
          winPct: ms.length > 0 ? Math.round((ms.filter((m) => m.result === "Win").length / ms.length) * 100) : 0,
        };
      })
      .sort((a, b) => b.matches - a.matches);
  }, [data]);

  if (rows.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight mb-3">By Team</h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Team","M","Runs","HS","Avg","Wkts","Wins","Win %"].map(h => (
                    <th key={h} className="px-3 py-3 text-center font-medium text-muted-foreground first:text-left first:px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.team} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{r.team}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{r.matches}</td>
                    <td className="px-3 py-3 text-center font-semibold text-foreground">{r.runs}</td>
                    <td className="px-3 py-3 text-center text-foreground">{r.hs}</td>
                    <td className="px-3 py-3 text-center text-foreground">{r.avg}</td>
                    <td className="px-3 py-3 text-center text-foreground">{r.wickets}</td>
                    <td className="px-3 py-3 text-center text-primary font-medium">{r.wins}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-medium ${r.winPct >= 50 ? "text-primary" : "text-muted-foreground"}`}>{r.winPct}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Pressure Performance ──────────────────────────────────────────────────────

function PressurePerformance({ data }: { data: PerMatchStat[] }) {
  const stats = useMemo(() => {
    const byResult = {
      win: data.filter((m) => m.result === "Win"),
      loss: data.filter((m) => m.result === "Loss"),
      draw: data.filter((m) => m.result === "Draw"),
    };

    const calc = (ms: PerMatchStat[]) => {
      const innings = ms.filter((m) => m.runs != null);
      const runs = innings.reduce((s, m) => s + (m.runs ?? 0), 0);
      const balls = innings.reduce((s, m) => s + (m.ballsFaced ?? 0), 0);
      const wkts = ms.filter((m) => m.wickets != null).reduce((s, m) => s + (m.wickets ?? 0), 0);
      const rc = ms.filter((m) => m.runsConceded != null).reduce((s, m) => s + (m.runsConceded ?? 0), 0);
      const ov = ms.filter((m) => m.overs != null).reduce((s, m) => s + (m.overs ?? 0), 0);
      return {
        matches: ms.length,
        runs,
        avg: innings.length > 0 ? (runs / innings.length).toFixed(1) : "—",
        sr: balls > 0 ? ((runs / balls) * 100).toFixed(1) : "—",
        wickets: wkts,
        economy: ov > 0 ? (rc / ov).toFixed(2) : "—",
        potm: ms.filter((m) => m.playerOfTheMatch).length,
      };
    };

    return {
      win: calc(byResult.win),
      loss: calc(byResult.loss),
      draw: calc(byResult.draw),
    };
  }, [data]);

  if (stats.win.matches === 0 && stats.loss.matches === 0) return null;

  const rows = [
    { label: "🏆 Wins", ...stats.win, color: "text-primary" },
    { label: "❌ Losses", ...stats.loss, color: "text-destructive" },
    ...(stats.draw.matches > 0 ? [{ label: "🤝 Draws", ...stats.draw, color: "text-muted-foreground" }] : []),
  ];

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight mb-3">Performance by Result</h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Result","M","Runs","Avg","SR","Wkts","Econ","POTM"].map(h => (
                    <th key={h} className="px-3 py-3 text-center font-medium text-muted-foreground first:text-left first:px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b border-border last:border-0">
                    <td className={`px-4 py-3 font-semibold ${r.color}`}>{r.label}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{r.matches}</td>
                    <td className="px-3 py-3 text-center font-semibold text-foreground">{r.runs}</td>
                    <td className="px-3 py-3 text-center text-foreground">{r.avg}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{r.sr}</td>
                    <td className="px-3 py-3 text-center text-foreground">{r.wickets}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{r.economy}</td>
                    <td className="px-3 py-3 text-center text-amber-500 font-medium">{r.potm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { data: perMatch, isLoading } = useGetPerMatchStats();
  const data = (perMatch ?? []) as PerMatchStat[];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        No matches logged yet — log some matches to see your breakdown analysis.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analysis</h1>
        <p className="text-muted-foreground mt-1">Deep dives into how, where, and when you perform.</p>
      </div>

      <DismissalBreakdown data={data} />
      <MatchTypeComparison data={data} />
      <VenueStats data={data} />
      <BattingPositionBreakdown data={data} />
      <PlayingForTracker data={data} />
      <PressurePerformance data={data} />
    </div>
  );
}
