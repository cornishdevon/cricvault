export function CareerLevels() {
  const battingLevels = [
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

  const bowlingLevels = [
    { name: "Trundler",       emoji: "🎳", min: 0,    max: 9,    color: "#64748b", bg: "#f1f5f9", ring: "#cbd5e1", desc: "Just getting the ball" },
    { name: "Club Bowler",    emoji: "⚡", min: 10,   max: 24,   color: "#16a34a", bg: "#f0fdf4", ring: "#86efac", desc: "Picks up the odd one" },
    { name: "Occasional",     emoji: "🎯", min: 25,   max: 49,   color: "#2563eb", bg: "#eff6ff", ring: "#93c5fd", desc: "Useful change bowler" },
    { name: "Wicket Taker",   emoji: "💫", min: 50,   max: 99,   color: "#0891b2", bg: "#ecfeff", ring: "#67e8f9", desc: "Regular wicket threat" },
    { name: "Strike Bowler",  emoji: "🌟", min: 100,  max: 199,  color: "#7c3aed", bg: "#f5f3ff", ring: "#c4b5fd", desc: "Main attack weapon" },
    { name: "First XI",       emoji: "🏏", min: 200,  max: 349,  color: "#be185d", bg: "#fdf2f8", ring: "#f9a8d4", desc: "First-choice bowler" },
    { name: "County",         emoji: "🏅", min: 350,  max: 499,  color: "#92400e", bg: "#fef3c7", ring: "#fcd34d", desc: "County-quality threat" },
    { name: "Elite",          emoji: "🔥", min: 500,  max: 749,  color: "#d97706", bg: "#fffbeb", ring: "#fcd34d", desc: "Elite strike bowler" },
    { name: "International",  emoji: "🌍", min: 750,  max: 999,  color: "#059669", bg: "#ecfdf5", ring: "#6ee7b7", desc: "World-class pace/spin" },
    { name: "Legend",         emoji: "👑", min: 1000, max: 1999, color: "#dc2626", bg: "#fff1f2", ring: "#fca5a5", desc: "All-time great wicket-taker" },
    { name: "Hall of Fame",   emoji: "🏆", min: 2000, max: null, color: "#b45309", bg: "#fffbeb", ring: "#fbbf24", desc: "Greatest bowler of all time" },
  ];

  const LevelRow = ({ level, rangeLabel }: { level: typeof battingLevels[0], rangeLabel: string }) => (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "9px 14px",
      borderRadius: 12,
      background: level.bg,
      border: `1.5px solid ${level.ring}`,
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        background: "#fff",
        border: `2px solid ${level.ring}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        flexShrink: 0,
        boxShadow: `0 2px 6px ${level.ring}55`,
      }}>
        {level.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: level.color }}>{level.name}</div>
        <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{level.desc}</div>
      </div>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: level.color,
        background: `${level.ring}44`,
        border: `1px solid ${level.ring}`,
        borderRadius: 7,
        padding: "3px 8px",
        whiteSpace: "nowrap",
      }}>
        {rangeLabel}
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      display: "flex",
      gap: 24,
      padding: "28px 24px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* Batting / Career XP */}
      <div style={{ flex: 1, maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Career XP Rating</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>Batting & All-Round</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>Runs · wickets · catches · POTM · more</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {battingLevels.map((l) => (
            <LevelRow key={l.name} level={l} rangeLabel={`${l.minXp.toLocaleString()}${l.maxXp !== null ? `–${l.maxXp.toLocaleString()}` : "+"} XP`} />
          ))}
        </div>
        <div style={{ marginTop: 14, padding: "9px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.7 }}>
            <span style={{ color: "#94a3b8", fontWeight: 600 }}>XP from:</span> runs · innings (+5) · wickets (+15) · centuries (+300) · fifties (+100) · fours (+2) · sixes (+5) · matches (+10) · POTM (+75)
          </div>
        </div>
      </div>

      {/* Bowling Wickets */}
      <div style={{ flex: 1, maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Bowling Rating</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>Career Wickets</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>Based on total career wickets taken</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {bowlingLevels.map((l) => (
            <LevelRow key={l.name} level={l} rangeLabel={`${l.min}${l.max !== null ? `–${l.max}` : "+"} wkts`} />
          ))}
        </div>
        <div style={{ marginTop: 14, padding: "9px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.7 }}>
            <span style={{ color: "#94a3b8", fontWeight: 600 }}>Milestone targets:</span> 10 · 25 · 50 · 100 · 200 · 350 · 500 · 750 · 1,000 · 2,000 wickets
          </div>
        </div>
      </div>
    </div>
  );
}
