import {
  useGetStatsSummary,
  useListMatches,
  useGetPerMatchStats,
  getGetStatsSummaryQueryKey,
  getListMatchesQueryKey,
  getGetPerMatchStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
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
} from "recharts";

function PerformanceChart({ data }: { data: any[] }) {
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    label: `vs ${d.opponent}`,
    date: d.date,
    Runs: d.runs ?? 0,
    Wickets: d.wickets ?? 0,
    "Strike Rate": d.strikeRate ? Number(d.strikeRate.toFixed(1)) : null,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Performance Over Time</CardTitle>
        <p className="text-sm text-muted-foreground">Runs and wickets across all logged matches.</p>
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
              label={{ value: "Runs", angle: -90, position: "insideLeft", offset: 12, style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
            />
            <YAxis
              yAxisId="wickets"
              orientation="right"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, "auto"]}
              label={{ value: "Wickets", angle: 90, position: "insideRight", offset: 12, style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: any, name: string) => {
                if (value === null || value === undefined) return ["—", name];
                return [value, name];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))", paddingTop: 8 }}
            />
            <Bar
              yAxisId="runs"
              dataKey="Runs"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              yAxisId="wickets"
              dataKey="Wickets"
              fill="hsl(var(--secondary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey() },
  });
  const { data: matches, isLoading: matchesLoading } = useListMatches({
    query: { queryKey: getListMatchesQueryKey() },
  });
  const { data: perMatch, isLoading: chartLoading } = useGetPerMatchStats({
    query: { queryKey: getGetPerMatchStatsQueryKey() },
  });

  const hasMatchData = perMatch && perMatch.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Career Summary</h1>
        <p className="text-muted-foreground mt-2">Your overall performance across all matches.</p>
      </div>

      {summaryLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : (
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
      )}

      {/* Performance chart */}
      {chartLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : hasMatchData ? (
        <PerformanceChart data={perMatch} />
      ) : null}

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
            {matches?.map((match, i) => (
              <Link key={match.id} href={`/matches/${match.id}`} className="block">
                <Card
                  className="hover:border-primary/50 transition-colors animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg text-foreground">
                        vs {match.opponent}
                      </div>
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
