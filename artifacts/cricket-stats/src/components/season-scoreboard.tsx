import { useEffect, useRef, useState } from "react";
import { SplitFlapDisplay } from "@/components/split-flap";

// ── Season scoreboard — web twin of the mobile ScoreboardCard ─────────────────
// Dark cricket-green board with amber split-flap digits. Values count up with
// an eased flap animation on load and whenever the underlying stats change.

const BOARD_BG = "#0c1a0e";
const BOARD_STRIP = "#0f2014";
const BOARD_BORDER = "#1a3320";
const LABEL_COLOR = "#4a7c59";
const AMBER = "#f59e0b";
const TILE_BG = "#0f2014";
const TILE_BORDER = "rgba(245,158,11,0.45)";

const DURATION = 1400;
const STEPS = 40;

function useFlapValues(runs: number, wickets: number, catches: number, matches: number) {
  const [flaps, setFlaps] = useState({ runs: 0, wickets: 0, catches: 0, matches: 0 });
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setFlaps({ runs: 0, wickets: 0, catches: 0, matches: 0 });
    // Nothing to animate for brand-new accounts — render cleanly at zero.
    if (runs === 0 && wickets === 0 && catches === 0 && matches === 0) return;

    let step = 0;
    intervalRef.current = window.setInterval(() => {
      step++;
      const t = step / STEPS;
      const eased = 1 - Math.pow(1 - t, 3);
      setFlaps({
        runs: Math.round(eased * runs),
        wickets: Math.round(eased * wickets),
        catches: Math.round(eased * catches),
        matches: Math.round(eased * matches),
      });
      if (step >= STEPS) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setFlaps({ runs, wickets, catches, matches });
      }
    }, DURATION / STEPS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [runs, wickets, catches, matches]);

  return flaps;
}

export function SeasonScoreboard({
  seasonLabel,
  runs,
  wickets,
  catches,
  matches,
  battingAvg,
  runsDelta,
  prevSeasonLabel,
}: {
  seasonLabel: string;
  runs: number;
  wickets: number;
  catches: number;
  matches: number;
  battingAvg: string;
  runsDelta?: number | null;
  prevSeasonLabel?: string;
}) {
  const flaps = useFlapValues(runs, wickets, catches, matches);
  const runsStr = String(flaps.runs);
  const seasonTarget = runs <= 500 ? 500 : runs <= 1000 ? 1000 : runs <= 2000 ? 2000 : 5000;
  const pct = Math.min(100, Math.round((flaps.runs / seasonTarget) * 100));

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: BOARD_BG, border: `1.5px solid ${BOARD_BORDER}` }}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ backgroundColor: BOARD_STRIP, borderBottom: `1px solid ${BOARD_BORDER}` }}
      >
        <span
          className="text-[10px] font-semibold uppercase"
          style={{ color: LABEL_COLOR, letterSpacing: "1.4px" }}
        >
          {seasonLabel} Season
        </span>
      </div>

      {/* Main runs block */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center flex-wrap gap-y-2 mb-1">
          <span
            className="text-[9px] font-bold uppercase mr-3 shrink-0"
            style={{ color: LABEL_COLOR, letterSpacing: "1.8px" }}
          >
            RUNS
          </span>
          <SplitFlapDisplay
            value={flaps.runs}
            minDigits={runsStr.length < 3 ? 3 : runsStr.length}
            size="lg"
            tileColor={TILE_BG}
            inkColor={AMBER}
            borderColor={TILE_BORDER}
          />
          {runsDelta != null && (
            <span
              className="text-[10px] font-medium ml-3"
              style={{ color: runsDelta >= 0 ? "#6ee7b7" : "#f87171" }}
            >
              {runsDelta >= 0 ? "+" : ""}
              {runsDelta}
              {prevSeasonLabel ? ` vs ${prevSeasonLabel}` : ""}
            </span>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: BOARD_BORDER }} className="my-3" />

        {/* Secondary stats */}
        <div className="flex items-end gap-4 flex-wrap">
          {(
            [
              { label: "WKTS", value: flaps.wickets },
              { label: "CTCH", value: flaps.catches },
              { label: "MTCH", value: flaps.matches },
            ] as const
          ).map(({ label, value }) => (
            <div key={label} className="flex flex-col items-start gap-1.5">
              <span
                className="text-[8px] font-bold uppercase"
                style={{ color: LABEL_COLOR, letterSpacing: "1.6px" }}
              >
                {label}
              </span>
              <SplitFlapDisplay
                value={value}
                minDigits={2}
                size="sm"
                tileColor={TILE_BG}
                inkColor={AMBER}
                borderColor={TILE_BORDER}
              />
            </div>
          ))}

          {/* Average — text tile (has decimal) */}
          <div className="flex flex-col items-start gap-1.5 ml-auto">
            <span
              className="text-[8px] font-bold uppercase"
              style={{ color: LABEL_COLOR, letterSpacing: "1.6px" }}
            >
              AVG
            </span>
            <div
              className="px-2 py-1 rounded-md"
              style={{ backgroundColor: TILE_BG, border: `1px solid ${TILE_BORDER}` }}
            >
              <span className="text-lg font-bold leading-none" style={{ color: AMBER }}>
                {battingAvg}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Season progress bar (only when runs exist) */}
      {runs > 0 && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <div
            className="flex-1 rounded-sm overflow-hidden"
            style={{ height: 3, backgroundColor: BOARD_BORDER }}
          >
            <div
              className="rounded-sm transition-all duration-300"
              style={{ height: 3, width: `${pct}%`, backgroundColor: AMBER }}
            />
          </div>
          <span className="text-[9px] font-medium" style={{ color: LABEL_COLOR }}>
            {flaps.runs}/{seasonTarget} runs
          </span>
        </div>
      )}
    </div>
  );
}
