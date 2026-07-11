import { Link } from "wouter";
import { safeFormatDate } from "@/lib/utils";

type MatchResult = {
  matchId: number;
  date: string;
  opponent: string;
  result?: string | null;
  runs?: number | null;
  howOut?: string | null;
  wickets?: number | null;
  playerOfTheMatch?: boolean | null;
};

const FORM_COUNT = 5;

function getResultStyle(result: string | null | undefined): {
  bg: string; border: string; text: string; dot: string; label: string;
} {
  if (result === "Win")  return { bg: "bg-primary/10",     border: "border-primary/30",     text: "text-primary",     dot: "bg-primary",     label: "W" };
  if (result === "Loss") return { bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", dot: "bg-destructive", label: "L" };
  if (result === "Draw") return { bg: "bg-amber-500/10",   border: "border-amber-500/30",   text: "text-amber-600",   dot: "bg-amber-500",   label: "D" };
  return                        { bg: "bg-muted/40",       border: "border-border",          text: "text-muted-foreground", dot: "bg-muted-foreground", label: "?" };
}

export function RecentFormGuide({ data }: { data: MatchResult[] }) {
  const recent = [...data]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, FORM_COUNT)
    .reverse();

  if (recent.length === 0) return null;

  const wins   = recent.filter((m) => m.result === "Win").length;
  const losses = recent.filter((m) => m.result === "Loss").length;
  const draws  = recent.filter((m) => m.result === "Draw").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recent Form</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Last {recent.length} matches — {wins}W {losses}L{draws > 0 ? ` ${draws}D` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Win</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-destructive inline-block" /> Loss</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Draw</span>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {recent.map((m, i) => {
          const { bg, border, text, dot, label } = getResultStyle(m.result);
          const isRecent = i === recent.length - 1;
          return (
            <Link
              key={m.matchId}
              href={`/matches/${m.matchId}`}
              className="flex-1 min-w-[110px] max-w-[160px]"
            >
              <div
                className={`relative rounded-xl border-2 p-3 flex flex-col items-center gap-1.5 transition-all duration-200 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 ${bg} ${border} ${isRecent ? "ring-2 ring-offset-2 ring-ring" : ""}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {isRecent && (
                  <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    Latest
                  </span>
                )}
                {m.playerOfTheMatch && (
                  <span className="absolute -top-2 -left-2 text-amber-400 text-sm leading-none">⭐</span>
                )}
                <div className={`flex items-center gap-1.5`}>
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dot}`} />
                  <span className={`text-2xl font-black ${text}`}>{label}</span>
                </div>
                <div className="text-center w-full">
                  {(m.runs != null || m.wickets != null) && (
                    <p className={`text-xs font-semibold ${text} opacity-90`}>
                      {m.runs != null && `${m.runs}${!m.howOut || m.howOut.toLowerCase() === 'not out' ? '*' : ''}r`}
                      {m.runs != null && m.wickets != null && " · "}
                      {m.wickets != null && `${m.wickets}w`}
                    </p>
                  )}
                  <p className={`text-[11px] font-medium ${text} opacity-80 truncate mt-0.5`}>vs {m.opponent}</p>
                  <p className={`text-[10px] ${text} opacity-60`}>{safeFormatDate(m.date, "d MMM")}</p>
                </div>
              </div>
            </Link>
          );
        })}

        {Array.from({ length: FORM_COUNT - recent.length }).map((_, i) => (
          <div
            key={`ph-${i}`}
            className="flex-1 min-w-[110px] max-w-[160px] rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center p-3 gap-1"
          >
            <span className="text-2xl text-muted-foreground/40">—</span>
            <p className="text-xs text-muted-foreground/40">No match</p>
          </div>
        ))}
      </div>
    </div>
  );
}
