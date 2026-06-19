import { Link } from "wouter";
import { format } from "date-fns";

type PerMatchStat = {
  matchId: number;
  date: string;
  opponent: string;
  runs?: number | null;
  ballsFaced?: number | null;
  wickets?: number | null;
  overs?: number | null;
  runsConceded?: number | null;
  hatTrick?: boolean | null;
  result?: string | null;
  playerOfTheMatch?: boolean | null;
};

type Milestone = {
  date: string;
  matchId: number;
  icon: string;
  label: string;
  detail: string;
  opponent: string;
  color: string;
};

function buildMilestones(data: PerMatchStat[]): Milestone[] {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const milestones: Milestone[] = [];
  let battingPB = -1;
  let bowlingPB = { w: -1, r: 999 };
  let careerRuns = 0;
  let careerWkts = 0;
  const runMarks = new Set([50, 100, 150, 200]);
  const wktMarks = new Set([5, 10, 25, 50, 100]);
  const careerRunMarks = new Set([500, 1000, 2000, 5000]);
  const careerWktMarks = new Set([10, 25, 50, 100]);

  for (const m of sorted) {
    const fmt = (d: string) => {
      try { return format(new Date(d), "MMM d, yyyy"); } catch { return d; }
    };

    const runs = m.runs ?? null;
    const wkts = m.wickets ?? null;

    // First match
    if (milestones.length === 0) {
      milestones.push({
        date: m.date,
        matchId: m.matchId,
        icon: "🎖️",
        label: "Debut",
        detail: "First match logged",
        opponent: m.opponent,
        color: "#6366f1",
      });
    }

    if (runs !== null) {
      // Batting milestones
      for (const mark of runMarks) {
        if (runs >= mark && battingPB < mark) {
          const labels: Record<number, string> = { 50: "First Half-Century", 100: "First Century", 150: "150 Club", 200: "Double Century!" };
          const icons: Record<number, string> = { 50: "🏏", 100: "💯", 150: "💎", 200: "🦁" };
          milestones.push({
            date: m.date, matchId: m.matchId,
            icon: icons[mark] ?? "🏏",
            label: labels[mark] ?? `${mark} runs`,
            detail: `${runs} runs`,
            opponent: m.opponent,
            color: "#16a34a",
          });
        }
      }
      // Personal best
      if (runs > battingPB && battingPB >= 0) {
        milestones.push({
          date: m.date, matchId: m.matchId,
          icon: "🏆",
          label: "New Personal Best",
          detail: `${runs} runs`,
          opponent: m.opponent,
          color: "#d97706",
        });
      }
      battingPB = Math.max(battingPB, runs);

      // Career run milestones
      careerRuns += runs;
      for (const mark of careerRunMarks) {
        if (careerRuns >= mark && (careerRuns - runs) < mark) {
          milestones.push({
            date: m.date, matchId: m.matchId,
            icon: "⭐",
            label: `${mark.toLocaleString()} Career Runs`,
            detail: `${careerRuns} total`,
            opponent: m.opponent,
            color: "#0891b2",
          });
        }
      }
    }

    if (wkts !== null) {
      // Bowling milestones
      for (const mark of wktMarks) {
        if (wkts >= mark && bowlingPB.w < mark) {
          const icons: Record<number, string> = { 5: "🔥", 10: "🎯", 25: "🎳", 50: "🌟", 100: "👑" };
          milestones.push({
            date: m.date, matchId: m.matchId,
            icon: icons[mark] ?? "🎳",
            label: mark === 5 ? "First Five-For" : `${mark}-Wicket Haul`,
            detail: `${wkts}/${m.runsConceded ?? 0}`,
            opponent: m.opponent,
            color: "#7c3aed",
          });
        }
      }
      if (wkts > bowlingPB.w || (wkts === bowlingPB.w && (m.runsConceded ?? 999) < bowlingPB.r && bowlingPB.w > 0)) {
        bowlingPB = { w: wkts, r: m.runsConceded ?? 999 };
      } else {
        bowlingPB.w = Math.max(bowlingPB.w, wkts);
      }

      careerWkts += wkts;
      for (const mark of careerWktMarks) {
        if (careerWkts >= mark && (careerWkts - wkts) < mark) {
          milestones.push({
            date: m.date, matchId: m.matchId,
            icon: "🎳",
            label: `${mark} Career Wickets`,
            detail: `${careerWkts} total`,
            opponent: m.opponent,
            color: "#7c3aed",
          });
        }
      }

      // Hat trick
      if (m.hatTrick) {
        milestones.push({
          date: m.date, matchId: m.matchId,
          icon: "🎩",
          label: "Hat Trick!",
          detail: "3 wickets in 3 balls",
          opponent: m.opponent,
          color: "#db2777",
        });
      }
    }

    // POTM
    if ((m as any).playerOfTheMatch) {
      milestones.push({
        date: m.date, matchId: m.matchId,
        icon: "⭐",
        label: "Player of the Match",
        detail: m.result ? `Result: ${m.result}` : "",
        opponent: m.opponent,
        color: "#d97706",
      });
    }
  }

  return milestones
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);
}

export function MilestonesTimeline({ data }: { data: PerMatchStat[] }) {
  const milestones = buildMilestones(data);

  if (milestones.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-4">Career Milestones</h2>
      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
        <div className="space-y-1">
          {milestones.map((m, i) => (
            <Link key={i} href={`/matches/${m.matchId}`} className="block">
              <div className="flex gap-4 items-start group hover:bg-muted/40 rounded-lg px-2 py-2.5 transition-colors">
                <div
                  className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: m.color + "22", border: `2px solid ${m.color}44` }}
                >
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="font-semibold text-sm text-foreground leading-tight">{m.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.detail && <span className="font-medium text-foreground">{m.detail} </span>}
                    vs {m.opponent}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(() => { try { return format(new Date(m.date), "MMM d, yyyy"); } catch { return m.date; } })()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
