import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type BattingSummary = {
  innings: number;
  totalRuns: number;
  battingAverage: number;
  highScore: number;
  centuries: number;
  fifties: number;
  ducks: number;
  goldenDucks: number;
  notOuts: number;
  totalFours: number;
  totalSixes: number;
  averageStrikeRate: number;
};

function StatPill({
  label,
  value,
  sub,
  variant = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  variant?: "default" | "good" | "bad" | "neutral";
}) {
  const colors = {
    default: "bg-muted text-foreground",
    good: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    bad: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    neutral: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  };
  return (
    <div className={`rounded-xl p-3 text-center ${colors[variant]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-0.5 opacity-80">{label}</div>
      {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}

export function ExtendedBattingStats({ batting, potmCount }: { batting: BattingSummary; potmCount: number }) {
  const { innings, totalRuns, battingAverage, highScore, centuries, fifties, ducks, goldenDucks, notOuts, totalFours, totalSixes, averageStrikeRate } = batting;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          🏏 Batting Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          <StatPill label="Innings" value={innings} variant="neutral" />
          <StatPill label="Average" value={battingAverage.toFixed(1)} variant="good" />
          <StatPill label="Strike Rate" value={averageStrikeRate.toFixed(1)} variant="neutral" />
          <StatPill label="High Score" value={highScore} variant="good" />
          <StatPill label="Hundreds" value={centuries} sub="100+" variant="good" />
          <StatPill label="Fifties" value={fifties} sub="50–99" variant="good" />
          <StatPill label="Not Outs" value={notOuts} variant="neutral" />
          <StatPill label="Ducks" value={ducks} sub={goldenDucks > 0 ? `${goldenDucks} golden` : undefined} variant={ducks > 0 ? "bad" : "neutral"} />
          <StatPill label="Fours" value={totalFours} variant="neutral" />
          <StatPill label="Sixes" value={totalSixes} variant="neutral" />
          <StatPill label="POTM" value={potmCount} sub="awards" variant={potmCount > 0 ? "good" : "neutral"} />
          <StatPill
            label="Boundary %"
            value={`${innings > 0 ? Math.round(((totalFours * 4 + totalSixes * 6) / Math.max(totalRuns, 1)) * 100) : 0}%`}
            sub="of runs"
            variant="neutral"
          />
        </div>
      </CardContent>
    </Card>
  );
}
