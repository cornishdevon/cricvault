import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target } from "lucide-react";

type Targets = {
  runs: number;
  wickets: number;
  season: string;
};

const STORAGE_KEY = "cricvault_season_targets";

function getStoredTargets(): Targets | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredTargets(t: Targets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  } catch {}
}

function ProgressBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function SeasonTargets({
  currentRuns,
  currentWickets,
  season,
}: {
  currentRuns: number;
  currentWickets: number;
  season: string;
}) {
  const [targets, setTargets] = useState<Targets | null>(null);
  const [editing, setEditing] = useState(false);
  const [runsInput, setRunsInput] = useState("");
  const [wicketsInput, setWicketsInput] = useState("");

  useEffect(() => {
    const stored = getStoredTargets();
    if (stored && stored.season === season) {
      setTargets(stored);
    }
  }, [season]);

  const handleSave = () => {
    const t: Targets = {
      runs: Number(runsInput) || 0,
      wickets: Number(wicketsInput) || 0,
      season,
    };
    setStoredTargets(t);
    setTargets(t);
    setEditing(false);
  };

  const handleSetTargets = () => {
    setRunsInput(targets ? String(targets.runs) : "");
    setWicketsInput(targets ? String(targets.wickets) : "");
    setEditing(true);
  };

  if (editing) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Set {season} Season Targets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Runs target</label>
              <Input
                type="number"
                placeholder="e.g. 1000"
                value={runsInput}
                onChange={(e) => setRunsInput(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Wickets target</label>
              <Input
                type="number"
                placeholder="e.g. 30"
                value={wicketsInput}
                onChange={(e) => setWicketsInput(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>Save targets</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!targets || (targets.runs === 0 && targets.wickets === 0)) {
    return (
      <Card className="border-dashed bg-transparent shadow-none">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" />
            <span className="text-sm">Set {season} season targets to track your goals</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleSetTargets}>Set goals</Button>
        </CardContent>
      </Card>
    );
  }

  const runsLeft = Math.max(targets.runs - currentRuns, 0);
  const wicketsLeft = Math.max(targets.wickets - currentWickets, 0);
  const runsDone = currentRuns >= targets.runs;
  const wicketsDone = currentWickets >= targets.wickets;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            {season} Season Goals
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={handleSetTargets}>
            Edit
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {targets.runs > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">
                🏏 Runs {runsDone ? "✅" : ""}
              </span>
              <span className="text-muted-foreground">
                {currentRuns} / {targets.runs}
                {!runsDone && <span className="text-xs ml-1">({runsLeft} to go)</span>}
              </span>
            </div>
            <ProgressBar value={currentRuns} max={targets.runs} color={runsDone ? "bg-green-500" : "bg-primary"} />
          </div>
        )}
        {targets.wickets > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">
                🎳 Wickets {wicketsDone ? "✅" : ""}
              </span>
              <span className="text-muted-foreground">
                {currentWickets} / {targets.wickets}
                {!wicketsDone && <span className="text-xs ml-1">({wicketsLeft} to go)</span>}
              </span>
            </div>
            <ProgressBar value={currentWickets} max={targets.wickets} color={wicketsDone ? "bg-green-500" : "bg-violet-500"} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
