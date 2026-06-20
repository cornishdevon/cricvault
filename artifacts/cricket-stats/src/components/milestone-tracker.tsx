import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Summary = {
  batting: { totalRuns: number; innings: number; centuries: number; fifties: number };
  bowling: { totalWickets: number; fiveWicketHauls: number };
};

function getMilestone(current: number, steps: number[]) {
  for (const step of steps) {
    if (current < step) return step;
  }
  return steps[steps.length - 1];
}

function MilestoneBar({
  label,
  current,
  target,
  color = "bg-emerald-500",
}: {
  label: string;
  current: number;
  target: number;
  color?: string;
}) {
  const prev = 0;
  const pct = Math.min(100, Math.round((current / target) * 100));
  const remaining = target - current;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {current.toLocaleString()} / {target.toLocaleString()}
          <span className="ml-2 text-xs text-muted-foreground">
            ({remaining > 0 ? `${remaining} to go` : "achieved!"})
          </span>
        </span>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const RUN_MILESTONES = [50, 100, 250, 500, 1000, 2000, 5000, 10000];
const WICKET_MILESTONES = [10, 25, 50, 100, 200, 500];
const CENTURY_MILESTONES = [1, 5, 10, 25, 50];
const FWH_MILESTONES = [1, 5, 10, 25];

export function MilestoneTracker({ summary }: { summary: Summary }) {
  const { totalRuns, innings, centuries } = summary.batting;
  const { totalWickets, fiveWicketHauls } = summary.bowling;

  const nextRuns = getMilestone(totalRuns, RUN_MILESTONES);
  const nextWickets = getMilestone(totalWickets, WICKET_MILESTONES);
  const nextCenturies = getMilestone(centuries, CENTURY_MILESTONES);
  const nextFwh = getMilestone(fiveWicketHauls, FWH_MILESTONES);

  return (
    <Card id="milestones">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          🎯 Milestone Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Batting
          </p>
          <MilestoneBar
            label="Career Runs"
            current={totalRuns}
            target={nextRuns}
            color="bg-emerald-500"
          />
          <MilestoneBar
            label="Centuries"
            current={centuries}
            target={nextCenturies}
            color="bg-amber-500"
          />
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bowling
          </p>
          <MilestoneBar
            label="Career Wickets"
            current={totalWickets}
            target={nextWickets}
            color="bg-blue-500"
          />
          <MilestoneBar
            label="Five-Wicket Hauls"
            current={fiveWicketHauls}
            target={nextFwh}
            color="bg-purple-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}
