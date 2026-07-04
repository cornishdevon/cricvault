export function BoldModern() {
  const tabs = ["Stats", "Targets", "Form", "Dismissals"];

  return (
    <div className="min-h-screen font-sans select-none" style={{ background: "#f1f5f1", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Hero — full bleed gradient */}
      <div className="relative overflow-hidden px-5 pt-12 pb-6" style={{ background: "linear-gradient(160deg, #1a5c30 0%, #0f3d20 60%, #0a2a16 100%)" }}>
        {/* Decorative ring */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10" style={{ border: "40px solid #4ade80" }} />
        <div className="absolute right-8 top-8 w-24 h-24 rounded-full opacity-10" style={{ border: "20px solid #86efac" }} />

        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs font-semibold mb-1 uppercase tracking-widest" style={{ color: "#86efac" }}>Hi, Cricketer</p>
            <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
            <span className="text-white text-sm">⚙</span>
          </div>
        </div>

        {/* Big number hero */}
        <div className="flex items-end gap-3 mb-2">
          <div className="text-8xl font-black text-white leading-none" style={{ letterSpacing: "-4px" }}>522</div>
          <div className="mb-2">
            <div className="text-lg font-bold" style={{ color: "#86efac" }}>Runs</div>
            <div className="text-sm" style={{ color: "#4ade80" }}>2026 Season</div>
          </div>
        </div>

        <div className="flex gap-5 mb-5">
          {[{ l: "Average", v: "43.5" }, { l: "High Score", v: "87" }, { l: "Matches", v: "14" }].map(({ l, v }) => (
            <div key={l}>
              <div className="text-lg font-black text-white">{v}</div>
              <div className="text-xs" style={{ color: "#6ee7b7" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Scroll tabs inside hero */}
        <div className="flex gap-2 -mx-1 pb-1 overflow-x-auto scrollbar-none">
          {tabs.map((t, i) => (
            <div key={t} className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
              style={i === 0
                ? { background: "#4ade80", color: "#14532d" }
                : { background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }
              }>{t}</div>
          ))}
        </div>
      </div>

      {/* Season strip */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none" style={{ background: "#fff" }}>
        {["2026", "2025", "2024", "2023"].map((y, i) => (
          <div key={y} className="px-4 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
            style={i === 0
              ? { background: "#166534", color: "#fff" }
              : { background: "#f0fdf4", color: "#166534", border: "1.5px solid #bbf7d0" }
            }>{y}</div>
        ))}
      </div>

      {/* Milestone */}
      <div className="mx-4 mt-3 mb-3 px-4 py-3 rounded-2xl flex items-center gap-3" style={{ background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <span className="text-xl">🏏</span>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold" style={{ color: "#166534" }}>478 to 1000 runs</span>
            <span className="text-xs font-bold" style={{ color: "#16a34a" }}>52%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#dcfce7" }}>
            <div className="h-full rounded-full" style={{ width: "52%", background: "linear-gradient(90deg, #16a34a, #4ade80)" }} />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mx-4 mb-3 grid grid-cols-3 gap-3">
        {[
          { label: "Runs", val: "522", delta: "+123 vs 2025", color: "#166534", bg: "#f0fdf4", accent: "#16a34a" },
          { label: "Wickets", val: "12", delta: "+4", color: "#1e40af", bg: "#eff6ff", accent: "#3b82f6" },
          { label: "Catches", val: "8", delta: "+2", color: "#9a3412", bg: "#fff7ed", accent: "#f97316" },
        ].map(({ label, val, delta, color, bg, accent }) => (
          <div key={label} className="rounded-2xl p-3 flex flex-col" style={{ background: bg }}>
            <div className="text-3xl font-black leading-none mb-1" style={{ color }}>{val}</div>
            <div className="text-xs font-semibold mb-1.5" style={{ color }}>{label}</div>
            <div className="text-xs font-medium" style={{ color: accent }}>{delta}</div>
          </div>
        ))}
      </div>

      {/* Recent Form */}
      <div className="mx-4 mb-3">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-bold" style={{ color: "#1a1a1a" }}>Recent Form</p>
          <p className="text-xs font-medium" style={{ color: "#16a34a" }}>2026 season</p>
        </div>
        <div className="flex gap-2">
          {[
            { runs: 87, wkts: 2, opp: "SMCC", win: true },
            { runs: 44, wkts: 0, opp: "EHCC", win: false },
            { runs: 61, wkts: 1, opp: "NSCC", win: true },
            { runs: 12, wkts: 3, opp: "WCCC", win: false },
            { runs: 55, wkts: 0, opp: "BRCC", win: true },
          ].map((m, i) => (
            <div key={i} className="flex-1 rounded-2xl p-2.5 flex flex-col items-center gap-1" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="w-2 h-2 rounded-full mb-0.5" style={{ background: m.win ? "#16a34a" : "#ef4444" }} />
              <div className="text-sm font-black" style={{ color: m.runs >= 50 ? "#166534" : m.runs >= 25 ? "#ca8a04" : "#dc2626" }}>{m.runs}</div>
              {m.wkts > 0 && <div className="text-xs font-semibold" style={{ color: "#2563eb" }}>{m.wkts}w</div>}
              <div className="text-xs" style={{ color: "#94a3b8", fontSize: "9px" }}>{m.opp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Batting Section */}
      <div className="mx-4 mb-24">
        <p className="text-sm font-bold mb-2" style={{ color: "#1a1a1a" }}>2026 — Batting</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: "Runs", v: "522" }, { l: "Innings", v: "14" }, { l: "Average", v: "43.5" },
            { l: "High Score", v: "87" }, { l: "Strike Rate", v: "82.4" }, { l: "50s", v: "3" },
          ].map(({ l, v }) => (
            <div key={l} className="rounded-xl p-3 text-center" style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div className="text-lg font-black" style={{ color: "#166534" }}>{v}</div>
              <div className="text-xs" style={{ color: "#64748b" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-2 pb-6 pt-3" style={{ background: "#fff", borderTop: "1px solid #e2e8f0", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
        {[
          { icon: "⊞", label: "Dashboard", active: true },
          { icon: "≡", label: "Matches" },
          { icon: "◉", label: "Badges" },
          { icon: "🎓", label: "Coaching" },
          { icon: "🖼", label: "Media" },
          { icon: "+", label: "Log Match" },
        ].map(({ icon, label, active }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <div className="text-base" style={{ color: active ? "#16a34a" : "#94a3b8" }}>{icon}</div>
            <div style={{ color: active ? "#16a34a" : "#94a3b8", fontSize: "9px", fontWeight: active ? "700" : "400" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
