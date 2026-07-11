import { Link } from "wouter";
import { safeFormatDate } from "@/lib/utils";

type PerMatchStat = {
  matchId: number;
  date: string;
  opponent: string;
  runs?: number | null;
  ballsFaced?: number | null;
  howOut?: string | null;
  strikeRate?: number | null;
};

const FORM_COUNT = 5;

function getDotStyle(runs: number): { bg: string; border: string; label: string } {
  if (runs >= 100) return { bg: "bg-amber-400", border: "border-amber-500", label: "text-amber-900" };
  if (runs >= 50)  return { bg: "bg-yellow-300", border: "border-yellow-400", label: "text-yellow-900" };
  if (runs >= 25)  return { bg: "bg-primary",    border: "border-primary/60", label: "text-primary-foreground" };
  if (runs === 0)  return { bg: "bg-destructive", border: "border-destructive/60", label: "text-destructive-foreground" };
  return             { bg: "bg-orange-400",  border: "border-orange-500",  label: "text-white" };
}

function getFormLabel(runs: number): string {
  if (runs >= 100) return "Century";
  if (runs >= 50)  return "Half-century";
  if (runs >= 25)  return "Good knock";
  if (runs === 0)  return "Duck";
  return             "Low score";
}

export function FormGuide({ data }: { data: PerMatchStat[] }) {
  const battingInnings = [...data]
    .filter((d) => d.runs !== null && d.runs !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, FORM_COUNT)
    .reverse();

  if (battingInnings.length === 0) return null;

  const avg =
    battingInnings.length > 0
      ? Math.round(battingInnings.reduce((s, d) => s + (d.runs ?? 0), 0) / battingInnings.length)
      : 0;

  const trend =
    battingInnings.length >= 2
      ? (battingInnings[battingInnings.length - 1].runs ?? 0) >
        (battingInnings[0].runs ?? 0)
        ? "up"
        : "down"
      : "flat";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Batting Form</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Last {battingInnings.length} innings — avg {avg} runs
            {trend === "up" && <span className="text-primary font-medium ml-1">trending up</span>}
            {trend === "down" && <span className="text-destructive font-medium ml-1">trending down</span>}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> 100+</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-300 inline-block border border-yellow-400" /> 50+</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> 25+</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> &lt;25</span>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {battingInnings.map((d, i) => {
          const runs = d.runs ?? 0;
          const { bg, border, label } = getDotStyle(runs);
          const formLabel = getFormLabel(runs);
          const isRecent = i === battingInnings.length - 1;

          return (
            <Link
              key={d.matchId}
              href={`/matches/${d.matchId}`}
              className="flex-1 min-w-[120px] max-w-[180px]"
            >
              <div
                className={`relative rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 ${bg} ${border} ${isRecent ? "ring-2 ring-offset-2 ring-ring" : ""}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {isRecent && (
                  <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    Latest
                  </span>
                )}
                <span className={`text-3xl font-black ${label}`}>{runs}</span>
                <div className="text-center">
                  <p className={`text-xs font-semibold ${label} opacity-90`}>{formLabel}</p>
                  {d.howOut && (
                    <p className={`text-[11px] ${label} opacity-75 mt-0.5`}>{d.howOut}</p>
                  )}
                  {d.ballsFaced != null && d.ballsFaced > 0 && (
                    <p className={`text-[11px] ${label} opacity-75`}>{d.ballsFaced}b</p>
                  )}
                </div>
                <div className={`text-center border-t border-current border-opacity-20 pt-1.5 w-full`}>
                  <p className={`text-[11px] font-medium ${label} opacity-80 truncate`}>vs {d.opponent}</p>
                  <p className={`text-[10px] ${label} opacity-60`}>{safeFormatDate(d.date, "d MMM")}</p>
                </div>
              </div>
            </Link>
          );
        })}

        {/* Placeholder slots to always show 5 positions */}
        {Array.from({ length: FORM_COUNT - battingInnings.length }).map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className="flex-1 min-w-[120px] max-w-[180px] rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center p-4 gap-1"
          >
            <span className="text-2xl text-muted-foreground/40">—</span>
            <p className="text-xs text-muted-foreground/40">No innings</p>
          </div>
        ))}
      </div>
    </div>
  );
}
