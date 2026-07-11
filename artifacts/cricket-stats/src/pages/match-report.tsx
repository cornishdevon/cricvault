import { useParams, Link } from "wouter";
import {
  useGetMatch,
  useGetBattingStats,
  useGetBowlingStats,
  useGetFieldingStats,
  getGetMatchQueryKey,
  getGetBattingStatsQueryKey,
  getGetBowlingStatsQueryKey,
  getGetFieldingStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { safeFormatDate } from "@/lib/utils";
import { useState } from "react";
import { ArrowLeft, Printer, Share2 } from "lucide-react";

function StatCell({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === "") return null;
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

function buildShareText(m: any, bat: any, bowl: any, field: any) {
  const lines: string[] = [];
  lines.push(`🏏 CricVault — vs ${m.opponent}`);
  const dateStr = m.date ? m.date.split("-").reverse().join("/") : m.date;
  lines.push(`${dateStr} · ${m.matchType}${m.venue ? ` · ${m.venue}` : ""}`);
  if (m.result) lines.push(`Result: ${m.result}`);
  if (m.playerOfTheMatch) lines.push("⭐ Player of the Match");

  if (bat?.runs != null) {
    lines.push(""); lines.push("🏏 BATTING");
    const strikeRate = bat.ballsFaced ? ((bat.runs / bat.ballsFaced) * 100).toFixed(1) : null;
    let batLine = `${bat.runs} runs`;
    if (bat.ballsFaced) batLine += ` (${bat.ballsFaced}b)`;
    if (strikeRate) batLine += ` · SR ${strikeRate}`;
    lines.push(batLine);
    if ((bat.fours ?? 0) > 0 || (bat.sixes ?? 0) > 0)
      lines.push(`4s: ${bat.fours ?? 0}  6s: ${bat.sixes ?? 0}`);
    if (bat.howOut) lines.push(`Out: ${bat.howOut}`);
  }
  if (bowl?.wickets != null || bowl?.overs != null) {
    lines.push(""); lines.push("🎳 BOWLING");
    const econ = bowl.overs ? (bowl.runsConceded / bowl.overs).toFixed(2) : null;
    let bowlLine = `${bowl.wickets ?? 0}/${bowl.runsConceded ?? 0}`;
    if (bowl.overs) bowlLine += ` off ${Number(bowl.overs).toFixed(1)} overs`;
    if (econ) bowlLine += ` · Econ ${econ}`;
    lines.push(bowlLine);
    if (bowl.hatTrick) lines.push("🎩 Hat Trick!");
  }
  if (field) {
    const parts: string[] = [];
    if ((field.catches ?? 0) > 0) parts.push(`${field.catches} catch${field.catches === 1 ? "" : "es"}`);
    if ((field.stumpings ?? 0) > 0) parts.push(`${field.stumpings} stumping${field.stumpings === 1 ? "" : "s"}`);
    if ((field.runOuts ?? 0) > 0) parts.push(`${field.runOuts} run out${field.runOuts === 1 ? "" : "s"}`);
    if (parts.length > 0) { lines.push(""); lines.push("🧤 FIELDING"); lines.push(parts.join(" · ")); }
  }
  if (m.notes) { lines.push(""); lines.push("📝 NOTES"); lines.push(m.notes); }
  lines.push(""); lines.push("Logged on CricVault 🏏");
  return lines.join("\n");
}

export default function MatchReport() {
  const { matchId } = useParams<{ matchId: string }>();
  const id = Number(matchId);
  const [copied, setCopied] = useState(false);

  const { data: match, isLoading: matchLoading } = useGetMatch(id, {
    query: { queryKey: getGetMatchQueryKey(id) },
  });
  const { data: batting } = useGetBattingStats(id, {
    query: { queryKey: getGetBattingStatsQueryKey(id) },
  });
  const { data: bowling } = useGetBowlingStats(id, {
    query: { queryKey: getGetBowlingStatsQueryKey(id) },
  });
  const { data: fielding } = useGetFieldingStats(id, {
    query: { queryKey: getGetFieldingStatsQueryKey(id) },
  });

  if (matchLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Match not found.</p>
        <Link href="/">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const m = match as any;
  const bat = batting as any;
  const bowl = bowling as any;
  const field = fielding as any;

  const hasBatting = bat && (bat.runs != null || bat.ballsFaced != null);
  const hasBowling = bowl && (bowl.overs != null || bowl.wickets != null);
  const hasFielding = field && (field.catches != null || field.runOuts != null || field.stumpings != null);

  const strikeRate =
    bat?.runs != null && bat?.ballsFaced && bat.ballsFaced > 0
      ? ((bat.runs / bat.ballsFaced) * 100).toFixed(1)
      : null;

  const economy =
    bowl?.runsConceded != null && bowl?.overs && bowl.overs > 0
      ? (bowl.runsConceded / bowl.overs).toFixed(2)
      : null;

  const resultColor =
    m.result === "Win"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : m.result === "Loss"
      ? "bg-red-100 text-red-800 border-red-200"
      : "bg-muted text-muted-foreground";

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { max-width: 100% !important; padding: 24px !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 print-page">
        {/* Nav — hidden when printing */}
        <div className="flex items-center justify-between no-print">
          <Link href={`/matches/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
              <ArrowLeft size={16} />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={async () => {
                const text = buildShareText(m, bat, bowl, field);
                if (navigator.share) {
                  try { await navigator.share({ title: `CricVault — vs ${m.opponent}`, text }); } catch { /* dismissed */ }
                } else {
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
            >
              <Share2 size={15} />
              {copied ? "Copied!" : "Share"}
            </Button>
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
        </div>

        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Match Report</p>
                <h1 className="text-2xl font-bold text-foreground">vs {m.opponent}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {safeFormatDate(m.date, "EEEE d MMMM yyyy")}
                  {m.venue ? ` · ${m.venue}` : ""}
                  {" · "}{m.matchType}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {m.result && (
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${resultColor}`}>
                    {m.result}
                  </span>
                )}
                {m.tossResult && (
                  <span className="text-xs text-muted-foreground">{m.tossResult}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batting */}
        {hasBatting && (
          <Section title="Batting">
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-3 mb-4">
                  <StatCell label="Runs" value={bat.runs ?? 0} />
                  <StatCell label="Balls" value={bat.ballsFaced ?? 0} />
                  {strikeRate && <StatCell label="SR" value={strikeRate} />}
                  <StatCell label="4s" value={bat.fours ?? 0} />
                  <StatCell label="6s" value={bat.sixes ?? 0} />
                  {bat.battingPosition && <StatCell label="Position" value={bat.battingPosition} />}
                </div>
                {bat.howOut && (
                  <p className="text-sm text-muted-foreground">
                    Dismissal: <span className="text-foreground font-medium">{bat.howOut}</span>
                  </p>
                )}
                {bat.hatTrick && (
                  <Badge className="mt-2 bg-yellow-100 text-yellow-800 border-yellow-200">🎩 Hat Trick</Badge>
                )}
              </CardContent>
            </Card>
          </Section>
        )}

        {/* Bowling */}
        {hasBowling && (
          <Section title="Bowling">
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-3 mb-4">
                  <StatCell label="Wickets" value={bowl.wickets ?? 0} />
                  <StatCell label="Overs" value={bowl.overs ?? 0} />
                  <StatCell label="Runs" value={bowl.runsConceded ?? 0} />
                  {economy && <StatCell label="Economy" value={economy} />}
                  {bowl.bowledWickets > 0 && <StatCell label="Bowled" value={bowl.bowledWickets} />}
                  {bowl.lbwWickets > 0 && <StatCell label="LBW" value={bowl.lbwWickets} />}
                  {bowl.maidens > 0 && <StatCell label="Maidens" value={bowl.maidens} />}
                  {bowl.wides > 0 && <StatCell label="Wides" value={bowl.wides} />}
                  {bowl.noBalls > 0 && <StatCell label="No Balls" value={bowl.noBalls} />}
                </div>
              </CardContent>
            </Card>
          </Section>
        )}

        {/* Fielding */}
        {hasFielding && (
          <Section title="Fielding">
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-3">
                  {(field.catches ?? 0) > 0 && <StatCell label="Catches" value={field.catches} />}
                  {(field.stumpings ?? 0) > 0 && <StatCell label="Stumpings" value={field.stumpings} />}
                  {(field.runOuts ?? 0) > 0 && <StatCell label="Run Outs" value={field.runOuts} />}
                  {(field.droppedCatches ?? 0) > 0 && <StatCell label="Dropped" value={field.droppedCatches} />}
                  {(field.missedStumpings ?? 0) > 0 && <StatCell label="Missed St." value={field.missedStumpings} />}
                </div>
                {!field.catches && !field.stumpings && !field.runOuts && (
                  <p className="text-sm text-muted-foreground">No fielding contributions recorded.</p>
                )}
              </CardContent>
            </Card>
          </Section>
        )}

        {/* Notes */}
        {m.notes && (
          <Section title="Notes">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{m.notes}</p>
              </CardContent>
            </Card>
          </Section>
        )}

        {/* Footer watermark */}
        <p className="text-center text-xs text-muted-foreground pt-2">
          CricVault · {format(new Date(), "d MMM yyyy")}
        </p>
      </div>
    </>
  );
}
