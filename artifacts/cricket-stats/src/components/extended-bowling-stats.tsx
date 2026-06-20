import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BowlingSummary = {
  innings: number;
  totalWickets: number;
  totalOvers: number;
  totalRunsConceded: number;
  averageEconomyRate: number;
  bowlingAverage: number;
  bestFigures: string;
  fiveWicketHauls: number;
  fourWicketHauls: number;
  totalMaidens: number;
  totalNoBalls: number;
  totalWides: number;
  hatTricks: number;
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

export function ExtendedBowlingStats({ bowling }: { bowling: BowlingSummary }) {
  const {
    innings,
    totalWickets,
    totalOvers,
    totalRunsConceded,
    averageEconomyRate,
    bowlingAverage,
    bestFigures,
    fiveWicketHauls,
    fourWicketHauls,
    totalMaidens,
    totalNoBalls,
    totalWides,
    hatTricks,
  } = bowling;

  const maidenPct =
    totalOvers > 0 ? Math.round((totalMaidens / totalOvers) * 100) : 0;
  const extrasPerSpell =
    innings > 0
      ? ((totalNoBalls + totalWides) / innings).toFixed(1)
      : "0.0";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          🎳 Bowling Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          <StatPill label="Spells" value={innings} variant="neutral" />
          <StatPill label="Average" value={bowlingAverage > 0 ? bowlingAverage.toFixed(1) : "—"} variant="good" />
          <StatPill label="Economy" value={averageEconomyRate.toFixed(2)} variant="neutral" />
          <StatPill label="Best" value={bestFigures} variant="good" />
          <StatPill label="5-Wicket Hauls" value={fiveWicketHauls} sub="5W+" variant={fiveWicketHauls > 0 ? "good" : "neutral"} />
          <StatPill label="4-Wicket Hauls" value={fourWicketHauls} sub="4W" variant={fourWicketHauls > 0 ? "good" : "neutral"} />
          <StatPill label="Maidens" value={totalMaidens} sub={`${maidenPct}% of overs`} variant="good" />
          <StatPill label="No Balls" value={totalNoBalls} sub={`${extrasPerSpell} extras/spell`} variant={totalNoBalls > 0 ? "bad" : "neutral"} />
          <StatPill label="Wides" value={totalWides} variant={totalWides > 0 ? "bad" : "neutral"} />
          <StatPill label="Hat Tricks" value={hatTricks} variant={hatTricks > 0 ? "good" : "neutral"} />
          <StatPill label="Wickets" value={totalWickets} variant="neutral" />
          <StatPill label="Overs" value={totalOvers.toFixed(1)} variant="neutral" />
        </div>
      </CardContent>
    </Card>
  );
}
