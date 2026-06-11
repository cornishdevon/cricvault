import { Link } from "wouter";
import { format } from "date-fns";

type PerMatchStat = {
  matchId: number;
  date: string;
  opponent: string;
  matchType: string;
  runs?: number | null;
  ballsFaced?: number | null;
  strikeRate?: number | null;
  fours?: number | null;
  sixes?: number | null;
  howOut?: string | null;
  wickets?: number | null;
  runsConceded?: number | null;
  economyRate?: number | null;
  hatTrick?: boolean | null;
  catches?: number | null;
  stumpings?: number | null;
  result?: string | null;
};

type Badge = {
  id: string;
  label: string;
  description: string;
  icon: string;
  earned: boolean;
  matchId?: number;
  opponent?: string;
  date?: string;
  count?: number;
};

function computeBadges(data: PerMatchStat[]): Badge[] {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  // batting innings with data
  const battingInnings = sorted.filter((d) => d.runs !== null && d.runs !== undefined);
  const bowlingInnings = sorted.filter((d) => d.wickets !== null && d.wickets !== undefined);

  // First 50
  const first50 = battingInnings.find((d) => (d.runs ?? 0) >= 50 && (d.runs ?? 0) < 100);
  const first50any = battingInnings.find((d) => (d.runs ?? 0) >= 50);

  // First 100
  const first100 = battingInnings.find((d) => (d.runs ?? 0) >= 100);

  // First 5-wicket haul
  const first5wkt = bowlingInnings.find((d) => (d.wickets ?? 0) >= 5);

  // Red Ink — 5 not outs
  const notOuts = sorted.filter((d) => d.howOut === "Not Out");
  const redInkEarned = notOuts.length >= 5;

  // Bucket Hands — 3 catches in one match (as fielder)
  const bucketHandsMatch = sorted.find((d) => (d.catches ?? 0) >= 3);

  // Magician — hat trick
  const magicianMatch = sorted.find((d) => d.hatTrick === true);

  // Safe Gloves — 5+ career stumpings
  const totalStumpings = sorted.reduce((s, d) => s + (d.stumpings ?? 0), 0);
  const safeGlovesEarned = totalStumpings >= 5;

  // Big Hitter — 5+ sixes in one innings
  const bigHitterMatch = sorted.find((d) => (d.sixes ?? 0) >= 5);

  // Boundary Getter — 10+ fours in one innings
  const boundaryMatch = sorted.find((d) => (d.fours ?? 0) >= 10);

  // TFC (Thanks For Coming) — match with <10 runs AND 0 wickets AND 0 catches
  const tfcMatch = sorted.find(
    (d) =>
      d.runs !== null && d.runs !== undefined &&
      (d.runs ?? 10) < 10 &&
      (d.wickets ?? 0) === 0 &&
      (d.catches ?? 0) === 0
  );

  // Trophy — personal best beaten (at least 2 batting innings, run score improved)
  let trophyEarned = false;
  let trophyMatch: PerMatchStat | undefined;
  if (battingInnings.length >= 2) {
    let runningBest = battingInnings[0].runs ?? 0;
    for (let i = 1; i < battingInnings.length; i++) {
      const r = battingInnings[i].runs ?? 0;
      if (r > runningBest) {
        trophyEarned = true;
        trophyMatch = battingInnings[i];
        runningBest = r;
      }
    }
  }

  const badges: Badge[] = [
    {
      id: "first50",
      label: "Half-Century",
      description: "Scored 50+ runs in an innings",
      icon: "🏏",
      earned: !!first50any,
      matchId: first50any?.matchId,
      opponent: first50any?.opponent,
      date: first50any?.date,
    },
    {
      id: "first100",
      label: "Century",
      description: "Scored 100+ runs in an innings",
      icon: "💯",
      earned: !!first100,
      matchId: first100?.matchId,
      opponent: first100?.opponent,
      date: first100?.date,
    },
    {
      id: "fivewkt",
      label: "Five-For",
      description: "Took 5 wickets in a bowling spell",
      icon: "⚡",
      earned: !!first5wkt,
      matchId: first5wkt?.matchId,
      opponent: first5wkt?.opponent,
      date: first5wkt?.date,
    },
    {
      id: "redink",
      label: "Red Ink",
      description: "Recorded 5 or more not outs",
      icon: "🛡️",
      earned: redInkEarned,
      count: notOuts.length,
    },
    {
      id: "buckethands",
      label: "Bucket Hands",
      description: "Took 3 catches in a single match",
      icon: "🧤",
      earned: !!bucketHandsMatch,
      matchId: bucketHandsMatch?.matchId,
      opponent: bucketHandsMatch?.opponent,
      date: bucketHandsMatch?.date,
    },
    {
      id: "magician",
      label: "Magician",
      description: "Took a hat trick in a match",
      icon: "🪄",
      earned: !!magicianMatch,
      matchId: magicianMatch?.matchId,
      opponent: magicianMatch?.opponent,
      date: magicianMatch?.date,
    },
    {
      id: "safegloves",
      label: "Safe Gloves",
      description: "5 career stumpings as wicketkeeper",
      icon: "🧤",
      earned: safeGlovesEarned,
      count: totalStumpings,
    },
    {
      id: "bighitter",
      label: "Big Hitter",
      description: "Hit 5 or more sixes in one innings",
      icon: "💥",
      earned: !!bigHitterMatch,
      matchId: bigHitterMatch?.matchId,
      opponent: bigHitterMatch?.opponent,
      date: bigHitterMatch?.date,
    },
    {
      id: "trophy",
      label: "Personal Best",
      description: "Beat your own batting high score",
      icon: "🏆",
      earned: trophyEarned,
      matchId: trophyMatch?.matchId,
      opponent: trophyMatch?.opponent,
      date: trophyMatch?.date,
    },
    {
      id: "boundary",
      label: "Boundary Getter",
      description: "Hit 10 or more fours in one innings",
      icon: "🔥",
      earned: !!boundaryMatch,
      matchId: boundaryMatch?.matchId,
      opponent: boundaryMatch?.opponent,
      date: boundaryMatch?.date,
    },
    {
      id: "tfc",
      label: "Thanks For Coming",
      description: "<10 runs, 0 wickets & 0 catches in a match",
      icon: "🚌",
      earned: !!tfcMatch,
      matchId: tfcMatch?.matchId,
      opponent: tfcMatch?.opponent,
      date: tfcMatch?.date,
    },
  ];

  return badges;
}

function computeMilestones(data: PerMatchStat[]) {
  const innings = data.filter((d) => d.runs !== null && d.runs !== undefined);
  return {
    twentyFives: innings.filter((d) => (d.runs ?? 0) >= 25).length,
    fifties: innings.filter((d) => (d.runs ?? 0) >= 50).length,
    hundreds: innings.filter((d) => (d.runs ?? 0) >= 100).length,
    totalInnings: innings.length,
  };
}

function BadgeCard({ badge }: { badge: Badge }) {
  const inner = (
    <div
      className={`rounded-xl border p-4 flex flex-col items-center text-center gap-2 transition-all duration-200 h-full ${
        badge.earned
          ? "bg-card border-primary/30 shadow-sm hover:border-primary/60 hover:shadow-md"
          : "bg-muted/40 border-border opacity-50 grayscale"
      }`}
    >
      <span className="text-3xl" role="img" aria-label={badge.label}>
        {badge.earned ? badge.icon : "🔒"}
      </span>
      <div>
        <p className={`font-semibold text-sm ${badge.earned ? "text-foreground" : "text-muted-foreground"}`}>
          {badge.label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{badge.description}</p>
      </div>
      {badge.earned && badge.opponent && badge.date && (
        <p className="text-xs text-primary font-medium mt-auto">
          vs {badge.opponent}
        </p>
      )}
      {badge.earned && badge.count !== undefined && (
        <p className="text-xs text-primary font-medium mt-auto">
          {badge.count} total
        </p>
      )}
    </div>
  );

  if (badge.earned && badge.matchId) {
    return (
      <Link href={`/matches/${badge.matchId}`} className="block h-full">
        {inner}
      </Link>
    );
  }

  return <div className="h-full">{inner}</div>;
}

function MilestonesBar({ milestones }: { milestones: ReturnType<typeof computeMilestones> }) {
  const items = [
    { label: "25+", count: milestones.twentyFives, color: "bg-chart-3" },
    { label: "50+", count: milestones.fifties, color: "bg-primary" },
    { label: "100+", count: milestones.hundreds, color: "bg-secondary" },
  ];

  return (
    <div className="flex gap-4 flex-wrap">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${item.color}`} />
          <span className="text-sm font-semibold text-foreground">{item.count}</span>
          <span className="text-sm text-muted-foreground">innings of {item.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-muted-foreground">{milestones.totalInnings} innings total</span>
      </div>
    </div>
  );
}

export function Achievements({ data }: { data: PerMatchStat[] }) {
  const badges = computeBadges(data);
  const milestones = computeMilestones(data);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Achievements</h2>
          <span className="text-sm text-muted-foreground font-medium">
            {earned} / {badges.length} earned
          </span>
        </div>
        {milestones.totalInnings > 0 && (
          <div className="mt-3">
            <MilestonesBar milestones={milestones} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {badges.map((badge, i) => (
          <div
            key={badge.id}
            className="animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <BadgeCard badge={badge} />
          </div>
        ))}
      </div>
    </div>
  );
}
