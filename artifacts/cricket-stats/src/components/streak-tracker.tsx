import { Flame, TrendingUp } from "lucide-react";

type PerMatchStat = {
  matchId: number;
  date: string;
  runs?: number | null;
  wickets?: number | null;
};

function computeStreaks(data: PerMatchStat[]) {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  const batting = sorted.filter((d) => d.runs !== null && d.runs !== undefined);
  const bowling = sorted.filter((d) => d.wickets !== null && d.wickets !== undefined);

  function calcStreaks(items: typeof batting, pass: (d: typeof batting[number]) => boolean) {
    let current = 0;
    let best = 0;
    let bestEnd = 0;
    for (let i = 0; i < items.length; i++) {
      if (pass(items[i])) {
        current++;
        if (current > best) { best = current; bestEnd = i; }
      } else {
        current = 0;
      }
    }
    return { current, best };
  }

  const bat25 = calcStreaks(batting, (d) => (d.runs ?? 0) >= 25);
  const wkt   = calcStreaks(bowling, (d) => (d.wickets ?? 0) >= 1);

  return { bat25, wkt };
}

function StreakPill({
  label,
  current,
  best,
  unit,
  icon,
  threshold,
}: {
  label: string;
  current: number;
  best: number;
  unit: string;
  icon: React.ReactNode;
  threshold: number;
}) {
  const isOnFire = current >= threshold;
  return (
    <div className={`rounded-xl border-2 p-4 flex flex-col gap-3 transition-all ${isOnFire ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2">
        <span className={`${isOnFire ? "text-primary" : "text-muted-foreground"}`}>{icon}</span>
        <span className="font-semibold text-sm">{label}</span>
        {isOnFire && (
          <span className="ml-auto text-xs bg-primary text-primary-foreground font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Flame className="w-3 h-3" /> On fire
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className={`text-4xl font-black tabular-nums ${isOnFire ? "text-primary" : "text-foreground"}`}>{current}</p>
          <p className="text-xs text-muted-foreground mt-0.5">current {unit}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tabular-nums text-muted-foreground">{best}</p>
          <p className="text-xs text-muted-foreground">best ever</p>
        </div>
      </div>
      {best > 0 && (
        <div className="flex gap-0.5">
          {Array.from({ length: Math.min(best, 10) }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all ${i < Math.min(current, 10) ? (isOnFire ? "bg-primary" : "bg-primary/60") : "bg-muted"}`}
            />
          ))}
          {best > 10 && <span className="text-[10px] text-muted-foreground ml-1">+{best - 10}</span>}
        </div>
      )}
    </div>
  );
}

export function StreakTracker({ data }: { data: PerMatchStat[] }) {
  const { bat25, wkt } = computeStreaks(data);

  if (bat25.best === 0 && wkt.best === 0) return null;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Streaks</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Consecutive match sequences</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bat25.best > 0 && (
          <StreakPill
            label="Scores of 25+"
            current={bat25.current}
            best={bat25.best}
            unit="in a row"
            threshold={3}
            icon={<TrendingUp className="w-4 h-4" />}
          />
        )}
        {wkt.best > 0 && (
          <StreakPill
            label="Wicket-taking spells"
            current={wkt.current}
            best={wkt.best}
            unit="in a row"
            threshold={3}
            icon={<Flame className="w-4 h-4" />}
          />
        )}
      </div>
    </div>
  );
}
