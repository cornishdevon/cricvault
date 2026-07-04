export function Navy() {
  const p = {
    bg: "#EEF1F8", card: "#F8FAFF", primary: "#0D2B6E", primaryFg: "#fff",
    fg: "#0A1428", muted: "#D8DEEE", mutedFg: "#5A6480", border: "#C0C8DC",
    accent: "#CF142B", pavilion: "#071847", pavilionFg: "#F0F4FF",
    pavilionMuted: "rgba(255,255,255,0.55)",
  };
  return <PalettePreview p={p} name="Navy Blue" />;
}

function PalettePreview({ p, name }: { p: any; name: string }) {
  return (
    <div style={{ width: 390, minHeight: 780, background: p.bg, fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: p.pavilion, padding: "44px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: p.pavilionMuted, fontSize: 12, marginBottom: 2 }}>Welcome back</div>
          <div style={{ color: p.pavilionFg, fontSize: 20, fontWeight: 700 }}>J. Smith</div>
        </div>
        <div style={{ background: p.primary, borderRadius: 20, padding: "6px 14px" }}>
          <span style={{ color: p.primaryFg, fontSize: 12, fontWeight: 600 }}>🏏 Club</span>
        </div>
      </div>
      <div style={{ flex: 1, padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: p.primary, borderRadius: 14, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>Season 2025</div>
            <div style={{ color: p.primaryFg, fontSize: 16, fontWeight: 700 }}>12 matches played</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>Win rate</div>
            <div style={{ color: p.primaryFg, fontSize: 22, fontWeight: 800 }}>67%</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[{ label: "Batting Avg", value: "38.4" }, { label: "Top Score", value: "94" }, { label: "Wickets", value: "23" }, { label: "Economy", value: "6.2" }].map(({ label, value }) => (
            <div key={label} style={{ background: p.card, border: `1px solid ${p.border}`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ color: p.mutedFg, fontSize: 11, marginBottom: 4 }}>{label}</div>
              <div style={{ color: p.primary, fontSize: 26, fontWeight: 800 }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ color: p.fg, fontSize: 14, fontWeight: 700, marginTop: 4 }}>Recent Matches</div>
        {[{ opp: "vs Northside CC", score: "72 (45)", result: "Won", wickets: "2/28" }, { opp: "vs Valley XI", score: "18 (22)", result: "Lost", wickets: "1/34" }, { opp: "vs Riverside SC", score: "94 (78)", result: "Won", wickets: "3/21" }].map((m, i) => (
          <div key={i} style={{ background: p.card, border: `1px solid ${p.border}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: p.fg, fontSize: 13, fontWeight: 600 }}>{m.opp}</div>
              <div style={{ color: p.mutedFg, fontSize: 12 }}>🏏 {m.score} &nbsp; 🎯 {m.wickets}</div>
            </div>
            <div style={{ background: m.result === "Won" ? p.primary : p.accent, color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>{m.result}</div>
          </div>
        ))}
        <div style={{ marginTop: "auto", background: p.primary, borderRadius: 20, padding: "10px 0", textAlign: "center" }}>
          <span style={{ color: p.primaryFg, fontWeight: 700, fontSize: 14 }}>{name}</span>
        </div>
      </div>
      <div style={{ background: p.card, borderTop: `1px solid ${p.border}`, display: "flex", justifyContent: "space-around", padding: "10px 0 20px" }}>
        {["📊", "📋", "🏆", "📷", "➕"].map((icon, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 20 }}>{icon}</div>
            <div style={{ width: 4, height: 4, borderRadius: 2, background: i === 0 ? p.primary : "transparent" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
