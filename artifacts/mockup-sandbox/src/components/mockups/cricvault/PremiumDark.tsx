export function PremiumDark() {
  const tabs = ["Stats", "Targets", "Form", "Dismissals"];

  return (
    <div className="min-h-screen select-none" style={{ background: "#0a0f0a", color: "#f0f4f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="flex justify-between items-center px-5 pt-12 pb-3">
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(110,231,183,0.12)", color: "#6ee7b7" }}>⚙</div>
      </div>

      {/* Scroll tabs */}
      <div className="flex gap-2 px-5 pb-4 overflow-x-auto">
        {tabs.map((t, i) => (
          <div key={t} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 border"
            style={i === 0
              ? { background: "rgba(110,231,183,0.15)", borderColor: "rgba(110,231,183,0.4)", color: "#6ee7b7" }
              : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "#94a3b8" }}>
            <span>{["📊","🎯","📈","🏏"][i]}</span>{t}
          </div>
        ))}
      </div>

      {/* ── CAREER HERO — Premium Dark glassmorphism ─────────────────── */}
      <div className="mx-4 mb-3 rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(5,150,105,0.08) 100%)", border: "1px solid rgba(110,231,183,0.2)" }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #34d399, transparent)" }} />
        <p className="text-xs font-medium mb-2" style={{ color: "#6ee7b7", letterSpacing: "0.1em", textTransform: "uppercase" }}>Career</p>
        <div className="flex items-end gap-5 mb-3">
          <div>
            <div className="text-6xl font-black leading-none tracking-tighter" style={{ color: "#ecfdf5" }}>1,847</div>
            <div className="text-sm font-medium mt-1" style={{ color: "#6ee7b7" }}>Runs</div>
          </div>
          <div className="mb-1 flex flex-col gap-0.5">
            <div className="text-xs" style={{ color: "#64748b" }}>Avg</div>
            <div className="text-2xl font-bold" style={{ color: "#a7f3d0" }}>41.0</div>
          </div>
          <div className="mb-1 flex flex-col gap-0.5">
            <div className="text-xs" style={{ color: "#64748b" }}>Wkts</div>
            <div className="text-2xl font-bold" style={{ color: "#a7f3d0" }}>48</div>
          </div>
        </div>
        <p className="text-xs" style={{ color: "#475569" }}>All seasons · 62 matches</p>
      </div>

      {/* ── SEASON SCOREBOARD — retro manual scoreboard ───────────────── */}
      <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ background: "#0c1a0e", border: "2px solid #1a3320" }}>
        {/* Scoreboard header strip */}
        <div className="flex items-center justify-between px-4 py-2" style={{ background: "#0f2014", borderBottom: "1px solid #1a3320" }}>
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4a7c59", fontFamily: "monospace" }}>2026 Season</span>
          <div className="flex gap-1.5">
            {["2026","2025","2024"].map((y, i) => (
              <span key={y} className="text-xs px-2 py-0.5 rounded font-bold" style={{ fontFamily: "monospace", background: i === 0 ? "#1a4a28" : "transparent", color: i === 0 ? "#6ee7b7" : "#2a4a36" }}>{y}</span>
            ))}
          </div>
        </div>

        {/* Main scoreboard digits */}
        <div className="px-4 pt-4 pb-3">
          {/* Runs — large flip-board digits */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold tracking-widest uppercase w-12 shrink-0" style={{ color: "#4a7c59", fontFamily: "monospace" }}>RUNS</span>
            <div className="flex gap-1.5">
              {["5","2","2"].map((d, i) => (
                <div key={i} className="flex flex-col items-center justify-center rounded-md relative"
                  style={{ width: 40, height: 52, background: "linear-gradient(180deg, #0f2014 49%, #0a180e 50%)", border: "1px solid #1f3d28", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                  <span className="text-3xl font-black" style={{ color: "#f59e0b", fontFamily: "'Courier New', Courier, monospace", lineHeight: 1, textShadow: "0 0 12px rgba(245,158,11,0.5)" }}>{d}</span>
                  <div className="absolute inset-x-0" style={{ top: "50%", height: "1px", background: "#0a0f0a", opacity: 0.8 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "#1a3320", marginBottom: 12 }} />

          {/* Secondary stats row */}
          <div className="flex gap-4">
            {[
              { label: "WKTS", digits: ["1","2"] },
              { label: "CTCH", digits: ["0","8"] },
              { label: "MTCH", digits: ["1","4"] },
            ].map(({ label, digits }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <span className="text-xs font-bold tracking-widest" style={{ color: "#4a7c59", fontFamily: "monospace" }}>{label}</span>
                <div className="flex gap-1">
                  {digits.map((d, i) => (
                    <div key={i} className="flex items-center justify-center rounded relative"
                      style={{ width: 26, height: 34, background: "linear-gradient(180deg, #0f2014 49%, #0a180e 50%)", border: "1px solid #1f3d28" }}>
                      <span className="text-xl font-black" style={{ color: "#f59e0b", fontFamily: "'Courier New', Courier, monospace", textShadow: "0 0 8px rgba(245,158,11,0.4)" }}>{d}</span>
                      <div className="absolute inset-x-0" style={{ top: "50%", height: "1px", background: "#0a0f0a", opacity: 0.8 }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Average */}
            <div className="flex flex-col gap-1.5 ml-auto">
              <span className="text-xs font-bold tracking-widest" style={{ color: "#4a7c59", fontFamily: "monospace" }}>AVG</span>
              <div className="flex gap-0.5 items-center">
                {["4","3",".","5"].map((d, i) => (
                  d === "." ? (
                    <span key={i} className="text-xl font-black pb-1" style={{ color: "#f59e0b", fontFamily: "'Courier New', Courier, monospace", lineHeight: 1 }}>.</span>
                  ) : (
                    <div key={i} className="flex items-center justify-center rounded relative"
                      style={{ width: 26, height: 34, background: "linear-gradient(180deg, #0f2014 49%, #0a180e 50%)", border: "1px solid #1f3d28" }}>
                      <span className="text-xl font-black" style={{ color: "#f59e0b", fontFamily: "'Courier New', Courier, monospace", textShadow: "0 0 8px rgba(245,158,11,0.4)" }}>{d}</span>
                      <div className="absolute inset-x-0" style={{ top: "50%", height: "1px", background: "#0a0f0a", opacity: 0.8 }} />
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Milestone progress bar — at base of scoreboard */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#1a3320" }}>
            <div className="h-full rounded-full" style={{ width: "52%", background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }} />
          </div>
          <span className="text-xs font-bold" style={{ color: "#4a7c59", fontFamily: "monospace" }}>478 to 1000</span>
        </div>
      </div>

      {/* Your Form */}
      <div className="mx-4 mb-2">
        <p className="text-xs font-semibold mb-2" style={{ color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>Your Form</p>
        <div className="flex gap-2">
          {[
            { runs: 87, wkts: 2, opp: "SMCC", win: true },
            { runs: 44, wkts: 0, opp: "EHCC", win: false },
            { runs: 61, wkts: 1, opp: "NSCC", win: true },
            { runs: 12, wkts: 3, opp: "WCCC", win: false },
            { runs: 55, wkts: 0, opp: "BRCC", win: true },
          ].map((m, i) => (
            <div key={i} className="flex-1 rounded-xl p-2.5 flex flex-col items-center gap-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: m.win ? "#10b981" : "#ef4444" }} />
              <div className="text-sm font-bold" style={{ color: m.runs >= 50 ? "#6ee7b7" : m.runs >= 25 ? "#a3e635" : "#f87171" }}>{m.runs}</div>
              {m.wkts > 0 && <div className="text-xs" style={{ color: "#94a3b8" }}>{m.wkts}w</div>}
              <div className="text-xs" style={{ color: "#475569" }}>{m.opp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-2 pb-6 pt-3"
        style={{ background: "rgba(10,15,10,0.95)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {[
          { icon: "⊞", label: "Dashboard", active: true },
          { icon: "≡", label: "Matches" },
          { icon: "◉", label: "Badges" },
          { icon: "🎓", label: "Coaching" },
          { icon: "🖼", label: "Media" },
          { icon: "+", label: "Log Match" },
        ].map(({ icon, label, active }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <div style={{ color: active ? "#10b981" : "#475569", fontSize: 16 }}>{icon}</div>
            <div style={{ color: active ? "#10b981" : "#475569", fontSize: 9, fontWeight: active ? 600 : 400 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
