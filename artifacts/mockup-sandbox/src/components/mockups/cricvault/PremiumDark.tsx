export function PremiumDark() {
  const seasons = ["2026", "2025", "2024"];
  const tabs = ["Stats", "Targets", "Form", "Dismissals"];

  return (
    <div className="min-h-screen font-sans select-none" style={{ background: "#0a0f0a", color: "#f0f4f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Status bar */}
      <div className="flex justify-between items-center px-5 pt-4 pb-2">
        <span className="text-xs font-semibold" style={{ color: "#6ee7b7" }}>9:41</span>
        <div className="flex gap-1 items-center">
          <div className="w-4 h-2 rounded-sm border border-current opacity-60" style={{ color: "#6ee7b7" }} />
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center px-5 pb-3">
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(110,231,183,0.12)", color: "#6ee7b7" }}>
          ⚙
        </div>
      </div>

      {/* Scroll tabs */}
      <div className="flex gap-2 px-5 pb-4 overflow-x-auto scrollbar-none">
        {tabs.map((t, i) => (
          <div key={t} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 border"
            style={i === 0
              ? { background: "rgba(110,231,183,0.15)", borderColor: "rgba(110,231,183,0.4)", color: "#6ee7b7" }
              : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "#94a3b8" }
            }>
            <span>{["📊", "🎯", "📈", "🏏"][i]}</span>
            {t}
          </div>
        ))}
      </div>

      {/* Hero card — glassmorphism */}
      <div className="mx-4 mb-4 rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(5,150,105,0.08) 100%)", border: "1px solid rgba(110,231,183,0.2)", backdropFilter: "blur(12px)" }}>
        {/* Glow blob */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #34d399, transparent)" }} />

        <p className="text-xs font-medium mb-3" style={{ color: "#6ee7b7", letterSpacing: "0.08em", textTransform: "uppercase" }}>Hi, Cricketer</p>
        <div className="flex items-end gap-4 mb-4">
          <div>
            <div className="text-6xl font-black leading-none tracking-tighter" style={{ color: "#ecfdf5" }}>522</div>
            <div className="text-sm font-medium mt-1" style={{ color: "#6ee7b7" }}>Runs</div>
          </div>
          <div className="mb-1 flex flex-col gap-0.5">
            <div className="text-xs" style={{ color: "#64748b" }}>Avg</div>
            <div className="text-2xl font-bold" style={{ color: "#a7f3d0" }}>43.5</div>
          </div>
          <div className="mb-1 flex flex-col gap-0.5">
            <div className="text-xs" style={{ color: "#64748b" }}>HS</div>
            <div className="text-2xl font-bold" style={{ color: "#a7f3d0" }}>87</div>
          </div>
        </div>
        <p className="text-xs" style={{ color: "#475569" }}>2026 Season · 14 matches · 12 wkts</p>
      </div>

      {/* Season pills */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-none">
        {seasons.map((y, i) => (
          <div key={y} className="px-4 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
            style={i === 0
              ? { background: "#10b981", color: "#fff" }
              : { background: "rgba(255,255,255,0.06)", color: "#64748b", border: "1px solid rgba(255,255,255,0.1)" }
            }>{y}</div>
        ))}
      </div>

      {/* Milestone bar */}
      <div className="mx-4 mb-4 px-4 py-3 rounded-xl flex gap-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm">🏏</span>
          <div className="flex-1">
            <div className="text-xs mb-1 flex justify-between" style={{ color: "#64748b" }}><span>478 to 1000 runs</span><span style={{ color: "#6ee7b7" }}>52%</span></div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full" style={{ width: "52%", background: "linear-gradient(90deg, #10b981, #34d399)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards row */}
      <div className="mx-4 mb-4 grid grid-cols-3 gap-2">
        {[
          { label: "RUNS", val: "522", delta: "+123 vs 2025", up: true },
          { label: "WICKETS", val: "12", delta: "+4", up: true },
          { label: "CATCHES", val: "8", delta: "+2", up: true },
        ].map(({ label, val, delta, up }) => (
          <div key={label} className="rounded-2xl p-3 flex flex-col" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div className="text-2xl font-black mb-1" style={{ color: "#ecfdf5" }}>{val}</div>
            <div className="text-xs font-semibold mb-2" style={{ color: "#64748b", letterSpacing: "0.06em" }}>{label}</div>
            <div className="text-xs font-medium" style={{ color: up ? "#6ee7b7" : "#f87171" }}>
              {delta}
            </div>
          </div>
        ))}
      </div>

      {/* Recent form */}
      <div className="mx-4 mb-2">
        <p className="text-xs font-semibold mb-2" style={{ color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>Recent Form</p>
        <div className="flex gap-2">
          {[
            { runs: 87, wkts: 2, opp: "SMCC", win: true },
            { runs: 44, wkts: 0, opp: "EHCC", win: false },
            { runs: 61, wkts: 1, opp: "NSCC", win: true },
            { runs: 12, wkts: 3, opp: "WCCC", win: false },
            { runs: 55, wkts: 0, opp: "BRCC", win: true },
          ].map((m, i) => (
            <div key={i} className="flex-1 rounded-xl p-2.5 flex flex-col items-center gap-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: m.win ? "#10b981" : "#ef4444" }} />
              <div className="text-sm font-bold" style={{ color: m.runs >= 50 ? "#6ee7b7" : m.runs >= 25 ? "#a3e635" : "#f87171" }}>{m.runs}</div>
              {m.wkts > 0 && <div className="text-xs" style={{ color: "#94a3b8" }}>{m.wkts}w</div>}
              <div className="text-xs font-medium" style={{ color: "#475569" }}>{m.opp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-2 pb-6 pt-3" style={{ background: "rgba(10,15,10,0.95)", borderTop: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
        {[
          { icon: "⊞", label: "Dashboard", active: true },
          { icon: "≡", label: "Matches" },
          { icon: "◉", label: "Badges" },
          { icon: "🎓", label: "Coaching" },
          { icon: "🖼", label: "Media" },
          { icon: "+", label: "Log Match" },
        ].map(({ icon, label, active }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <div className="text-base" style={{ color: active ? "#10b981" : "#475569" }}>{icon}</div>
            <div className="text-xs" style={{ color: active ? "#10b981" : "#475569", fontSize: "9px", fontWeight: active ? "600" : "400" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
