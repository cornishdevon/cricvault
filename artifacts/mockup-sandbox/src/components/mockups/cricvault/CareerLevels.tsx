export function CareerLevels() {
  const levels = [
    { name: "Novice",            emoji: "🌱", minXp: 0,     maxXp: 499,   color: "#64748b", bg: "#f1f5f9", ring: "#cbd5e1", desc: "Just getting started" },
    { name: "Village Cricketer", emoji: "🌾", minXp: 500,   maxXp: 999,   color: "#92400e", bg: "#fef3c7", ring: "#fcd34d", desc: "Weekend warrior" },
    { name: "Club",              emoji: "🏏", minXp: 1000,  maxXp: 1499,  color: "#16a34a", bg: "#f0fdf4", ring: "#86efac", desc: "Regular club player" },
    { name: "Amateur",           emoji: "⚡", minXp: 1500,  maxXp: 3999,  color: "#2563eb", bg: "#eff6ff", ring: "#93c5fd", desc: "Serious about the game" },
    { name: "Semi-Pro",          emoji: "🌟", minXp: 4000,  maxXp: 9999,  color: "#7c3aed", bg: "#f5f3ff", ring: "#c4b5fd", desc: "Highly skilled player" },
    { name: "Elite",             emoji: "🔥", minXp: 10000, maxXp: 24999, color: "#d97706", bg: "#fffbeb", ring: "#fcd34d", desc: "Top-tier performer" },
    { name: "Legend",            emoji: "👑", minXp: 25000, maxXp: null,  color: "#dc2626", bg: "#fff1f2", ring: "#fca5a5", desc: "All-time great" },
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
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Career Levels</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f8fafc" }}>Your XP Journey</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {levels.map((level, i) => {
            const isLast = i === levels.length - 1;
            return (
              <div key={level.name} style={{ position: "relative" }}>
                {/* connector line */}
                {!isLast && (
                  <div style={{
                    position: "absolute",
                    left: 27,
                    top: "100%",
                    width: 2,
                    height: 10,
                    background: "rgba(255,255,255,0.08)",
                    zIndex: 0,
                  }} />
                )}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 16px",
                  borderRadius: 14,
                  background: level.bg,
                  border: `1.5px solid ${level.ring}`,
                  position: "relative",
                  zIndex: 1,
                }}>
                  {/* emoji badge */}
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#fff",
                    border: `2px solid ${level.ring}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    flexShrink: 0,
                    boxShadow: `0 2px 8px ${level.ring}66`,
                  }}>
                    {level.emoji}
                  </div>

                  {/* name + desc */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: level.color }}>{level.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{level.desc}</div>
                  </div>

                  {/* XP range */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: level.color,
                      background: `${level.ring}55`,
                      border: `1px solid ${level.ring}`,
                      borderRadius: 8,
                      padding: "3px 10px",
                      whiteSpace: "nowrap",
                    }}>
                      {level.minXp.toLocaleString()}
                      {level.maxXp !== null ? `–${level.maxXp.toLocaleString()}` : "+"} XP
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
            <span style={{ color: "#94a3b8", fontWeight: 600 }}>XP earned from:</span> runs (1 each) · innings (5 each) · wickets (15 each) · centuries (+300) · fifties (+100) · fours (2 each) · sixes (5 each) · matches (10 each) · Player of the Match (75 each)
          </div>
        </div>
      </div>
    </div>
  );
}
