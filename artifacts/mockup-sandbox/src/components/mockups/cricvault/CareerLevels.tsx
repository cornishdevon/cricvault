export function CareerLevels() {
  const levels = [
    { name: "Novice",            emoji: "🌱", minXp: 0,     maxXp: 499,   color: "#64748b", bg: "#f1f5f9", ring: "#cbd5e1", desc: "Just getting started" },
    { name: "Village Cricketer", emoji: "🌾", minXp: 500,   maxXp: 999,   color: "#92400e", bg: "#fef3c7", ring: "#fcd34d", desc: "Weekend warrior" },
    { name: "Club",              emoji: "🏏", minXp: 1000,  maxXp: 1499,  color: "#16a34a", bg: "#f0fdf4", ring: "#86efac", desc: "Regular club player" },
    { name: "Amateur",           emoji: "⚡", minXp: 1500,  maxXp: 2499,  color: "#2563eb", bg: "#eff6ff", ring: "#93c5fd", desc: "Serious about the game" },
    { name: "First XI",          emoji: "🎯", minXp: 2500,  maxXp: 3999,  color: "#0891b2", bg: "#ecfeff", ring: "#67e8f9", desc: "Top of the club order" },
    { name: "Semi-Pro",          emoji: "🌟", minXp: 4000,  maxXp: 6499,  color: "#7c3aed", bg: "#f5f3ff", ring: "#c4b5fd", desc: "Highly skilled player" },
    { name: "County",            emoji: "🏅", minXp: 6500,  maxXp: 9999,  color: "#be185d", bg: "#fdf2f8", ring: "#f9a8d4", desc: "County-level talent" },
    { name: "Elite",             emoji: "🔥", minXp: 10000, maxXp: 17499, color: "#d97706", bg: "#fffbeb", ring: "#fcd34d", desc: "Top-tier performer" },
    { name: "International",     emoji: "🌍", minXp: 17500, maxXp: 24999, color: "#059669", bg: "#ecfdf5", ring: "#6ee7b7", desc: "World-class cricketer" },
    { name: "Legend",            emoji: "👑", minXp: 25000, maxXp: 49999, color: "#dc2626", bg: "#fff1f2", ring: "#fca5a5", desc: "All-time great" },
    { name: "Hall of Fame",      emoji: "🏆", minXp: 50000, maxXp: null,  color: "#b45309", bg: "#fffbeb", ring: "#fbbf24", desc: "The very best to ever play" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Career Levels</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f8fafc" }}>Your XP Journey</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>11 tiers from Novice to Hall of Fame</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {levels.map((level, i) => {
            const isLast = i === levels.length - 1;
            return (
              <div key={level.name} style={{ position: "relative" }}>
                {!isLast && (
                  <div style={{
                    position: "absolute",
                    left: 27,
                    top: "100%",
                    width: 2,
                    height: 8,
                    background: "rgba(255,255,255,0.07)",
                    zIndex: 0,
                  }} />
                )}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: level.bg,
                  border: `1.5px solid ${level.ring}`,
                  position: "relative",
                  zIndex: 1,
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "#fff",
                    border: `2px solid ${level.ring}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                    boxShadow: `0 2px 6px ${level.ring}55`,
                  }}>
                    {level.emoji}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: level.color }}>{level.name}</div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{level.desc}</div>
                  </div>

                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: level.color,
                    background: `${level.ring}44`,
                    border: `1px solid ${level.ring}`,
                    borderRadius: 7,
                    padding: "3px 9px",
                    whiteSpace: "nowrap",
                  }}>
                    {level.minXp.toLocaleString()}
                    {level.maxXp !== null ? `–${level.maxXp.toLocaleString()}` : "+"} XP
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.7 }}>
            <span style={{ color: "#94a3b8", fontWeight: 600 }}>XP from:</span> runs (1 each) · innings (+5) · wickets (+15) · centuries (+300) · fifties (+100) · fours (+2) · sixes (+5) · matches (+10) · Player of the Match (+75)
          </div>
        </div>
      </div>
    </div>
  );
}
