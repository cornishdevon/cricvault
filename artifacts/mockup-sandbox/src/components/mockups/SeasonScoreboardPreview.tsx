import { useState } from "react";
import { SeasonScoreboard } from "../../../../cricket-stats/src/components/season-scoreboard";

export default function SeasonScoreboardPreview() {
  const [bump, setBump] = useState(0);
  return (
    <div className="min-h-screen bg-gray-100 p-8 space-y-6 max-w-2xl mx-auto">
      <SeasonScoreboard
        seasonLabel="2026"
        runs={487 + bump}
        wickets={23}
        catches={11}
        matches={18}
        battingAvg="34.8"
        runsDelta={62}
        prevSeasonLabel="2025"
      />
      <SeasonScoreboard
        seasonLabel="All-Time"
        runs={0}
        wickets={0}
        catches={0}
        matches={0}
        battingAvg="—"
      />
      <button
        className="px-3 py-1.5 rounded bg-green-800 text-white text-sm"
        onClick={() => setBump((b) => b + 37)}
      >
        Add runs (test flip on change)
      </button>
    </div>
  );
}
