import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
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
  runs?: number | null;
  ballsFaced?: number | null;
  wickets?: number | null;
  howOut?: string | null;
  playerOfTheMatch?: boolean | null;
};

type SeasonRow = {
  season: string;
  innings: number;
  runs: number;
  avg: number;
  hs: number;
  fifties: number;
  hundreds: number;
  wickets: number;
  potm: number;
};

function getYear(date: string) {
  return date?.slice(0, 4) ?? "?";
}

export function SeasonComparison({ data }: { data: PerMatchStat[] }) {
  const [metric, setMetric] = useState<"runs" | "avg" | "wickets">("runs");

  const seasons: Record<string, SeasonRow> = {};
  for (const m of data) {
    const y = getYear(m.date);
    if (!seasons[y]) {
      seasons[y] = { season: y, innings: 0, runs: 0, avg: 0, hs: 0, fifties: 0, hundreds: 0, wickets: 0, potm: 0 };
    }
    const s = seasons[y];
    if (m.runs != null) {
      s.innings++;
      s.runs += m.runs;
      if (m.runs > s.hs) s.hs = m.runs;
      if (m.runs >= 100) s.hundreds++;
      else if (m.runs >= 50) s.fifties++;
    }
    if (m.wickets != null) s.wickets += m.wickets;
    if (m.playerOfTheMatch) s.potm++;
  }

  const rows = Object.values(seasons)
    .sort((a, b) => a.season.localeCompare(b.season))
    .map((s) => ({
      ...s,
      avg: s.innings > 0 ? parseFloat((s.runs / s.innings).toFixed(1)) : 0,
    }));

  const METRICS = [
    { key: "runs", label: "Runs", color: "#10b981" },
    { key: "avg", label: "Average", color: "#f59e0b" },
    { key: "wickets", label: "Wickets", color: "#3b82f6" },
  ] as const;

  const active = METRICS.find((m) => m.key === metric)!;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            📅 Season-on-Season
          </CardTitle>
          <div className="flex rounded-lg border overflow-hidden text-xs">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  metric === m.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length < 2 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Log matches across at least 2 seasons to compare.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="season" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey={metric} name={active.label} fill={active.color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {rows.length >= 1 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left py-1.5 pr-3">Season</th>
                  <th className="text-right pr-3">Inn</th>
                  <th className="text-right pr-3">Runs</th>
                  <th className="text-right pr-3">Avg</th>
                  <th className="text-right pr-3">HS</th>
                  <th className="text-right pr-3">100s</th>
                  <th className="text-right pr-3">50s</th>
                  <th className="text-right pr-3">Wkts</th>
                  <th className="text-right">POTM</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.season} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-1.5 pr-3 font-semibold">{r.season}</td>
                    <td className="text-right pr-3 text-muted-foreground">{r.innings}</td>
                    <td className="text-right pr-3 font-medium">{r.runs}</td>
                    <td className="text-right pr-3 text-muted-foreground">{r.avg}</td>
                    <td className="text-right pr-3 text-muted-foreground">{r.hs}</td>
                    <td className="text-right pr-3 text-amber-600 font-medium">{r.hundreds || "—"}</td>
                    <td className="text-right pr-3 text-emerald-600 font-medium">{r.fifties || "—"}</td>
                    <td className="text-right pr-3 text-blue-600 font-medium">{r.wickets}</td>
                    <td className="text-right text-purple-600 font-medium">{r.potm || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
