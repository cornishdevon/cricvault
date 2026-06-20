import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

type PerMatchStat = {
  matchId: number;
  date: string;
  opponent: string;
  runs?: number | null;
  wickets?: number | null;
};

function rolling(values: number[], n: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < n - 1) return null;
    const slice = values.slice(i - n + 1, i + 1);
    return parseFloat((slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(1));
  });
}

export function RollingAverageChart({ data }: { data: PerMatchStat[] }) {
  const [mode, setMode] = useState<"batting" | "bowling">("batting");
  const [window, setWindow] = useState<5 | 10>(5);

  const filtered = data.filter((m) =>
    mode === "batting" ? m.runs != null : m.wickets != null
  );

  const values = filtered.map((m) =>
    mode === "batting" ? (m.runs ?? 0) : (m.wickets ?? 0)
  );
  const rollingVals = rolling(values, window);

  const careerAvg =
    values.length > 0
      ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
      : 0;

  const chartData = filtered.map((m, i) => ({
    label: `vs ${m.opponent.slice(0, 10)}`,
    value: values[i],
    rolling: rollingVals[i],
  }));

  const barColor = mode === "batting" ? "#10b981" : "#3b82f6";
  const lineColor = mode === "batting" ? "#f59e0b" : "#8b5cf6";
  const valueLabel = mode === "batting" ? "Runs" : "Wickets";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            📈 Rolling Average
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border overflow-hidden text-xs">
              {(["batting", "bowling"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 capitalize transition-colors ${
                    mode === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg border overflow-hidden text-xs">
              {([5, 10] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setWindow(w)}
                  className={`px-3 py-1.5 transition-colors ${
                    window === w
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  Last {w}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">
            Not enough {mode} data yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                y={careerAvg}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                label={{
                  value: `Career avg ${careerAvg}`,
                  position: "insideTopRight",
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <Bar dataKey="value" name={valueLabel} fill={barColor} radius={[3, 3, 0, 0]} opacity={0.7} />
              <Line
                dataKey="rolling"
                name={`${window}-match avg`}
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
        {chartData.length >= 2 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Career avg: <strong>{careerAvg}</strong> · dashed line
          </p>
        )}
      </CardContent>
    </Card>
  );
}
