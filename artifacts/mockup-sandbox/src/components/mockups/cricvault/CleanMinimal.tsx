export function CleanMinimal() {
  const tabs = ["Stats", "Targets", "Form", "Dismissals"];

  return (
    <div className="min-h-screen font-sans select-none" style={{ background: "#faf9f7", fontFamily: "Georgia, 'Times New Roman', serif", color: "#1c1917" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex justify-between items-center">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase mb-0.5" style={{ color: "#a8a29e", fontFamily: "system-ui", letterSpacing: "0.12em" }}>Good morning</p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "system-ui", color: "#1c1917" }}>Dashboard</h1>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#f5f5f4", border: "1px solid #e7e5e4", color: "#78716c" }}>
          ⚙
        </div>
      </div>

      {/* Scroll tabs */}
      <div className="flex gap-2 px-5 pb-5 overflow-x-auto scrollbar-none" style={{ fontFamily: "system-ui" }}>
        {tabs.map((t, i) => (
          <div key={t} className="px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0"
            style={i === 0
              ? { background: "#1c1917", color: "#faf9f7" }
              : { background: "transparent", color: "#78716c", border: "1px solid #d6d3d1" }
            }>{t}</div>
        ))}
      </div>

      {/* Hero — editorial style */}
      <div className="mx-4 mb-5 rounded-3xl overflow-hidden relative" style={{ background: "#1c1917" }}>
        <div className="p-6 pb-5">
          {/* Season row */}
          <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none">
            {["2026", "2025", "2024"].map((y, i) => (
              <div key={y} className="px-3 py-1 rounded-full text-xs font-medium flex-shrink-0" style={{ fontFamily: "system-ui" }}
                style={i === 0
                  ? { background: "#4ade80", color: "#14532d", fontWeight: "700" }
                  : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }
                }>{y}</div>
            ))}
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-7xl font-black text-white leading-none" style={{ fontFamily: "system-ui", letterSpacing: "-2px" }}>522</span>
          </div>
          <p className="text-sm font-medium mb-4" style={{ color: "#6ee7b7", fontFamily: "system-ui" }}>Runs this season</p>

          <div className="flex gap-6" style={{ fontFamily: "system-ui" }}>
            {[{ l: "Avg", v: "43.5" }, { l: "HS", v: "87" }, { l: "Mat", v: "14" }, { l: "Wkts", v: "12" }].map(({ l, v }) => (
              <div key={l}>
                <div className="text-lg font-bold text-white">{v}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Thin accent line */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #4ade80 52%, transparent 100%)" }} />
        <div className="px-6 py-3 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full" style={{ width: "52%", background: "#4ade80" }} />
          </div>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "system-ui" }}>478 to 1000</span>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mx-4 mb-5 flex gap-3">
        {[
          { label: "Runs", val: "522", sub: "+123 vs 2025" },
          { label: "Wickets", val: "12", sub: "+4 this year" },
          { label: "Catches", val: "8", sub: "+2 this year" },
        ].map(({ label, val, sub }) => (
          <div key={label} className="flex-1 rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #e7e5e4", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="text-3xl font-black mb-0.5" style={{ fontFamily: "system-ui", color: "#1c1917" }}>{val}</div>
            <div className="text-xs font-semibold mb-2" style={{ fontFamily: "system-ui", color: "#a8a29e", letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
            <div className="text-xs" style={{ fontFamily: "system-ui", color: "#16a34a" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Recent Form */}
      <div className="mx-4 mb-5">
        <div className="flex justify-between items-baseline mb-3">
          <p className="text-sm font-semibold" style={{ fontFamily: "system-ui", color: "#1c1917" }}>Recent Form</p>
          <p className="text-xs" style={{ fontFamily: "system-ui", color: "#a8a29e" }}>2026 only</p>
        </div>
        <div className="flex gap-2">
          {[
            { runs: 87, wkts: 2, opp: "SMCC", win: true },
            { runs: 44, wkts: 0, opp: "EHCC", win: false },
            { runs: 61, wkts: 1, opp: "NSCC", win: true },
            { runs: 12, wkts: 3, opp: "WCCC", win: false },
            { runs: 55, wkts: 0, opp: "BRCC", win: true },
          ].map((m, i) => (
            <div key={i} className="flex-1 rounded-2xl p-2.5 flex flex-col items-center gap-1.5" style={{ background: "#fff", border: "1px solid #e7e5e4" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: m.win ? "#16a34a" : "#e7e5e4" }} />
              <div className="text-sm font-black" style={{ fontFamily: "system-ui", color: m.runs >= 50 ? "#15803d" : m.runs >= 25 ? "#b45309" : "#dc2626" }}>{m.runs}</div>
              {m.wkts > 0 && <div className="text-xs font-semibold" style={{ fontFamily: "system-ui", color: "#3b82f6" }}>{m.wkts}w</div>}
              <div style={{ fontFamily: "system-ui", color: "#a8a29e", fontSize: "9px" }}>{m.opp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Batting Stats */}
      <div className="mx-4 mb-24">
        <p className="text-sm font-semibold mb-3" style={{ fontFamily: "system-ui", color: "#1c1917" }}>2026 — Batting</p>
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #e7e5e4" }}>
          {[
            { l: "Runs", v: "522" }, { l: "Innings", v: "14" }, { l: "Average", v: "43.5" },
            { l: "High Score", v: "87" }, { l: "Strike Rate", v: "82.4" }, { l: "50s", v: "3" },
          ].map(({ l, v }, i) => (
            <div key={l} className="flex justify-between items-center px-4 py-3" style={{ borderTop: i > 0 ? "1px solid #f5f5f4" : "none" }}>
              <span className="text-sm" style={{ fontFamily: "system-ui", color: "#78716c" }}>{l}</span>
              <span className="text-sm font-bold" style={{ fontFamily: "system-ui", color: "#1c1917" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-2 pb-6 pt-3" style={{ background: "#faf9f7", borderTop: "1px solid #e7e5e4" }}>
        {[
          { icon: "⊞", label: "Dashboard", active: true },
          { icon: "≡", label: "Matches" },
          { icon: "◉", label: "Badges" },
          { icon: "🎓", label: "Coaching" },
          { icon: "🖼", label: "Media" },
          { icon: "+", label: "Log Match" },
        ].map(({ icon, label, active }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <div style={{ color: active ? "#1c1917" : "#d6d3d1", fontSize: "16px" }}>{icon}</div>
            <div style={{ fontFamily: "system-ui", color: active ? "#1c1917" : "#d6d3d1", fontSize: "9px", fontWeight: active ? "600" : "400" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
