import { Link } from "wouter";
import { safeFormatDate } from "@/lib/utils";

type PerMatchStat = {
  matchId: number;
  date: string;
  opponent: string;
  wickets?: number | null;
  runsConceded?: number | null;
  economyRate?: number | null;
  hatTrick?: boolean | null;
  overs?: number | null;
};

const FORM_COUNT = 5;

function getTileStyle(wickets: number): { bg: string; border: string; label: string } {
  if (wickets >= 5)  return { bg: "bg-destructive",  border: "border-destructive/60",  label: "text-destructive-foreground" };
  if (wickets >= 3)  return { bg: "bg-amber-400",    border: "border-amber-500",        label: "text-amber-900" };
  if (wickets >= 1)  return { bg: "bg-primary",      border: "border-primary/60",       label: "text-primary-foreground" };
  return               { bg: "bg-muted",           border: "border-border",           label: "text-muted-foreground" };
}

function getSpellLabel(wickets: number): string {
  if (wickets >= 5) return "Five-for!";
  if (wickets >= 3) return "3-wicket haul";
  if (wickets >= 1) return wickets === 1 ? "1 wicket" : `${wickets} wickets`;
  return "Wicketless";
}

export function BowlingForm({ data }: { data: PerMatchStat[] }) {
  const bowlingSpells = [...data]
    .filter((d) => d.wickets !== null && d.wickets !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, FORM_COUNT)
    .reverse();

  if (bowlingSpells.length === 0) return null;

  const totalWkts = bowlingSpells.reduce((s, d) => s + (d.wickets ?? 0), 0);
  const avgWkts = (totalWkts / bowlingSpells.length).toFixed(1);

  const trend =
    bowlingSpells.length >= 2
      ? (bowlingSpells[bowlingSpells.length - 1].wickets ?? 0) >
        (bowlingSpells[0].wickets ?? 0)
        ? "up"
        : "down"
      : "flat";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bowling Form</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Last {bowlingSpells.length} spells — avg {avgWkts} wkts
            {trend === "up" && <span className="text-primary font-medium ml-1">trending up</span>}
            {trend === "down" && <span className="text-destructive font-medium ml-1">trending down</span>}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-destructive inline-block" /> 5+</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> 3–4</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> 1–2</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-muted inline-block border border-border" /> 0</span>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {bowlingSpells.map((d, i) => {
          const wickets = d.wickets ?? 0;
          const { bg, border, label } = getTileStyle(wickets);
          const spellLabel = getSpellLabel(wickets);
          const isRecent = i === bowlingSpells.length - 1;

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
                {d.hatTrick && (
                  <span className="absolute -top-2 -left-2 text-sm" title="Hat trick!">🪄</span>
                )}
                <span className={`text-3xl font-black ${label}`}>{wickets}<span className="text-base font-semibold opacity-70">w</span></span>
                <div className="text-center">
                  <p className={`text-xs font-semibold ${label} opacity-90`}>{spellLabel}</p>
                  {d.runsConceded != null && (
                    <p className={`text-[11px] ${label} opacity-75 mt-0.5`}>{d.runsConceded} runs</p>
                  )}
                  {d.economyRate != null && d.economyRate > 0 && (
                    <p className={`text-[11px] ${label} opacity-75`}>Econ {d.economyRate.toFixed(1)}</p>
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

        {Array.from({ length: FORM_COUNT - bowlingSpells.length }).map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className="flex-1 min-w-[120px] max-w-[180px] rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center p-4 gap-1"
          >
            <span className="text-2xl text-muted-foreground/40">—</span>
            <p className="text-xs text-muted-foreground/40">No spell</p>
          </div>
        ))}
      </div>
    </div>
  );
}
