import { useMemo } from "react";
import { useSearch, Link } from "wouter";
import { useGetPerMatchStats } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer } from "lucide-react";
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
  overs?: number | null;
  catches?: number | null;
  stumpings?: number | null;
  droppedCatches?: number | null;
  result?: string | null;
  playerOfTheMatch?: boolean | null;
};

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-muted/60 px-5 py-4 text-center min-w-[90px]">
      <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 print:break-inside-avoid">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground border-b pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function computeSeasonStats(data: PerMatchStat[]) {
  const battingInnings = data.filter((d) => d.runs != null);
  const bowlingSpells  = data.filter((d) => d.overs != null && (d.overs as number) > 0);
  const withResults    = data.filter((d) => d.result && d.result !== "");

  const totalRuns   = battingInnings.reduce((s, d) => s + (d.runs ?? 0), 0);
  const totalBalls  = battingInnings.reduce((s, d) => s + (d.ballsFaced ?? 0), 0);
  const highScore   = battingInnings.reduce((m, d) => Math.max(m, d.runs ?? 0), 0);
  const fifties     = battingInnings.filter((d) => (d.runs ?? 0) >= 50 && (d.runs ?? 0) < 100).length;
  const hundreds    = battingInnings.filter((d) => (d.runs ?? 0) >= 100).length;
  const totalFours  = battingInnings.reduce((s, d) => s + (d.fours ?? 0), 0);
  const totalSixes  = battingInnings.reduce((s, d) => s + (d.sixes ?? 0), 0);
  const battingAvg  = battingInnings.length > 0 ? totalRuns / battingInnings.length : 0;
  const strikeRate  = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;

  const totalWickets    = bowlingSpells.reduce((s, d) => s + (d.wickets ?? 0), 0);
  const totalOvers      = bowlingSpells.reduce((s, d) => s + (d.overs ?? 0), 0);
  const totalConceded   = bowlingSpells.reduce((s, d) => s + (d.runsConceded ?? 0), 0);
  const economy         = totalOvers > 0 ? totalConceded / totalOvers : 0;
  const bestWickets     = bowlingSpells.reduce((m, d) => Math.max(m, d.wickets ?? 0), 0);
  const bestSpell       = bowlingSpells.find((d) => (d.wickets ?? 0) === bestWickets);

  const totalCatches  = data.reduce((s, d) => s + (d.catches ?? 0), 0);
  const totalSt       = data.reduce((s, d) => s + (d.stumpings ?? 0), 0);
  const totalDropped  = data.reduce((s, d) => s + (d.droppedCatches ?? 0), 0);

  const wins   = withResults.filter((d) => d.result?.toLowerCase() === "win").length;
  const losses = withResults.filter((d) => d.result?.toLowerCase() === "loss").length;
  const draws  = withResults.length - wins - losses;

  const potm = data.filter((d) => d.playerOfTheMatch).length;

  return {
    matches: data.length,
    wins, losses, draws, potm,
    totalRuns, highScore, battingAvg, strikeRate, fifties, hundreds, totalFours, totalSixes,
    battingInnings: battingInnings.length,
    totalWickets, totalOvers, economy, bestWickets, bestSpell,
    bowlingSpells: bowlingSpells.length,
    totalCatches, totalSt, totalDropped,
  };
}

export default function SeasonReport() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const year = params.get("year") ?? "all";

  const { data: rawData, isLoading } = useGetPerMatchStats();
  const perMatch = (rawData as PerMatchStat[] | undefined) ?? [];

  const filtered = useMemo(() => {
    if (year === "all") return perMatch;
    return perMatch.filter((m) => m.date.startsWith(year));
  }, [perMatch, year]);

  const stats = useMemo(() => computeSeasonStats(filtered), [filtered]);

  const title = year === "all" ? "Career Report" : `${year} Season Report`;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { max-width: 100% !important; padding: 24px !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 print-page">
        {/* Nav */}
        <div className="flex items-center justify-between no-print">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
              <ArrowLeft size={16} />
              Back
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => window.print()}
          >
            <Printer size={15} />
            Print / Save PDF
          </Button>
        </div>

        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">CricVault</p>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">Generated {format(new Date(), "d MMMM yyyy")}</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <StatCell label="Matches" value={stats.matches} />
              <StatCell label="Wins" value={stats.wins} />
              <StatCell label="Losses" value={stats.losses} />
              {stats.draws > 0 && <StatCell label="Draws" value={stats.draws} />}
              {stats.potm > 0 && <StatCell label="POTM" value={stats.potm} />}
            </div>
          </CardContent>
        </Card>

        {/* Batting */}
        {stats.battingInnings > 0 && (
          <Section title="Batting">
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-3">
                  <StatCell label="Runs" value={stats.totalRuns} />
                  <StatCell label="Innings" value={stats.battingInnings} />
                  <StatCell label="Average" value={stats.battingAvg.toFixed(1)} />
                  <StatCell label="SR" value={stats.strikeRate.toFixed(1)} />
                  <StatCell label="HS" value={stats.highScore} />
                  {stats.fifties > 0 && <StatCell label="50s" value={stats.fifties} />}
                  {stats.hundreds > 0 && <StatCell label="100s" value={stats.hundreds} />}
                  {stats.totalFours > 0 && <StatCell label="4s" value={stats.totalFours} />}
                  {stats.totalSixes > 0 && <StatCell label="6s" value={stats.totalSixes} />}
                </div>
              </CardContent>
            </Card>
          </Section>
        )}

        {/* Bowling */}
        {stats.bowlingSpells > 0 && (
          <Section title="Bowling">
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-3">
                  <StatCell label="Wickets" value={stats.totalWickets} />
                  <StatCell label="Overs" value={stats.totalOvers.toFixed(1)} />
                  <StatCell label="Economy" value={stats.economy.toFixed(2)} />
                  {stats.bestWickets > 0 && (
                    <StatCell
                      label="Best"
                      value={`${stats.bestWickets}/${stats.bestSpell?.runsConceded ?? 0}`}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </Section>
        )}

        {/* Fielding */}
        {(stats.totalCatches > 0 || stats.totalSt > 0) && (
          <Section title="Fielding">
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-3">
                  {stats.totalCatches > 0 && <StatCell label="Catches" value={stats.totalCatches} />}
                  {stats.totalSt > 0 && <StatCell label="Stumpings" value={stats.totalSt} />}
                  {stats.totalDropped > 0 && <StatCell label="Dropped" value={stats.totalDropped} />}
                </div>
              </CardContent>
            </Card>
          </Section>
        )}

        {/* Match results table */}
        {filtered.length > 0 && (
          <Section title="Match Log">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {[...filtered].sort((a, b) => a.date.localeCompare(b.date)).map((m) => (
                    <div key={m.matchId} className="flex items-center justify-between px-5 py-3 text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-muted-foreground text-xs w-20 shrink-0">{m.date}</span>
                        <span className="font-medium text-foreground truncate">vs {m.opponent}</span>
                        {m.playerOfTheMatch && (
                          <span className="text-xs text-amber-600 font-medium shrink-0">⭐ POTM</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        {m.runs != null && (
                          <span className="text-muted-foreground">{m.runs}r</span>
                        )}
                        {m.wickets != null && (
                          <span className="text-muted-foreground">{m.wickets}wkt</span>
                        )}
                        {m.result && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            m.result.toLowerCase() === "win"
                              ? "bg-emerald-100 text-emerald-700"
                              : m.result.toLowerCase() === "loss"
                              ? "bg-red-100 text-red-700"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {m.result}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Section>
        )}

        <p className="text-center text-xs text-muted-foreground pt-2">
          CricVault · {format(new Date(), "d MMM yyyy")}
        </p>
      </div>
    </>
  );
}
