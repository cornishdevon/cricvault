import "./_group.css";

type WheelShot = { x: number; y: number; runs: 1 | 2 | 4 | 6 };

// Slightly larger canvas so sixes that exceed the boundary don't get clipped
const FIELD_SIZE = 310;
const CX = FIELD_SIZE / 2;
const CY = FIELD_SIZE / 2;
const FIELD_R  = FIELD_SIZE / 2 - 14;   // boundary radius
const PITCH_R  = 14;
const DOT_R    = 8;                      // endpoint circle radius
const SIX_MAX  = FIELD_R * 1.18;        // sixes go just beyond the rope

function shotColor(runs: 1 | 2 | 4 | 6): string {
  if (runs === 6) return "#FFB300";
  if (runs === 4) return "#1B5E2B";
  if (runs === 2) return "#1565C0";
  return "#757575";
}

const RUN_OPTS: (1 | 2 | 4 | 6)[] = [1, 2, 4, 6];
const RUN_LABELS: Record<number, string> = { 1: "1 run", 2: "2 runs", 4: "Four", 6: "Six" };

// Right-handed batter at the top facing down the pitch: off side on the left.
const SHOT_LABELS = [
  { label: "Lucky edge", x: 155, y: 44 },
  { label: "Leg glance", x: 198, y: 49 },
  { label: "Straight drive", x: 155, y: 266 },
  { label: "Cover drive", x: 83, y: 231 },
  { label: "Square drive", x: 57, y: 186 },
  { label: "Cut", x: 52, y: 132 },
  { label: "Leading edge", x: 48, y: 158 },
  { label: "Late cut", x: 86, y: 75 },
  { label: "Sweep", x: 224, y: 75 },
  { label: "Pull / Hook", x: 257, y: 132 },
  { label: "Flick", x: 253, y: 186 },
  { label: "Slog", x: 246, y: 209 },
  { label: "On drive", x: 227, y: 231 },
];

// Bisect the label directions at the top batting crease, then intersect
// each dividing ray with the circular boundary.
const SHOT_SECTION_EDGES = (() => {
  const originY = CY - 25;
  const angles = SHOT_LABELS.map(({ x, y }) => Math.atan2(y - originY, x - CX))
    .sort((a, b) => a - b);
  return angles.map((angle, i) => {
    const next = angles[(i + 1) % angles.length] + (i === angles.length - 1 ? 2 * Math.PI : 0);
    // Keep the directly-behind "Lucky edge" sector narrower than the others.
    const behind = -Math.PI / 2;
    const middle = Math.abs(angle - behind) < 0.001
      ? behind + 0.28
      : Math.abs(next - behind) < 0.001
        ? behind - 0.28
        : (angle + next) / 2;
    const dx = Math.cos(middle);
    const dy = Math.sin(middle);
    const offset = originY - CY;
    const distance = -offset * dy + Math.sqrt(FIELD_R ** 2 - offset ** 2 + (offset * dy) ** 2);
    return { x: CX + distance * dx, y: originY + distance * dy };
  });
})();

export function Current() {
  // The extracted baseline is intentionally the empty wheel state.
  const shots: WheelShot[] = [];

  return (
    <div className="wagon-wheel-preview min-h-screen">
      <div className="wagon-wheel-container">
        <div className="wagon-wheel-legend">
          {RUN_OPTS.map((r) => (
            <div key={r} className="wagon-wheel-legend-item">
              <div className="wagon-wheel-legend-dot" style={{ backgroundColor: shotColor(r) }} />
              <span className="wagon-wheel-legend-text">{RUN_LABELS[r]}</span>
            </div>
          ))}
        </div>

        <svg width={FIELD_SIZE} height={FIELD_SIZE} style={{ overflow: "visible" }}>
          {/* Six-zone shading just beyond boundary */}
          <ellipse cx={CX} cy={CY} rx={SIX_MAX} ry={SIX_MAX} fill="#FFB30008" stroke="#FFB30030" strokeWidth={1} strokeDasharray="3 4" />
          {/* Outfield */}
          <ellipse cx={CX} cy={CY} rx={FIELD_R} ry={FIELD_R} fill="#4CAF5066" stroke="#9B8052" strokeWidth={4} />
          {/* Layered cream rope with alternating twists around the boundary. */}
          <ellipse cx={CX} cy={CY} rx={FIELD_R} ry={FIELD_R} fill="none" stroke="#E7D5A9" strokeWidth={3} />
          <ellipse cx={CX} cy={CY} rx={FIELD_R} ry={FIELD_R} fill="none" stroke="#B99D6B" strokeWidth={2.5} strokeDasharray="1 4" />
          {/* Inner circle */}
          <ellipse cx={CX} cy={CY} rx={FIELD_R * 0.6} ry={FIELD_R * 0.6} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
          {SHOT_SECTION_EDGES.map(({ x, y }, i) => (
            <line key={`section-${i}`} x1={CX} y1={CY - 25} x2={x} y2={y}
              stroke="#F6BC7D" strokeWidth={1} strokeOpacity={0.9} />
          ))}
          {SHOT_LABELS.map(({ label, x, y }) => (
            <text key={label} x={x} y={y} textAnchor="middle" fontSize={8} fill="#284D2C" fontWeight="500">
              {label === "Lucky edge" || label === "Leg glance" || label === "Leading edge" ? (
                <>
                  <tspan x={x} y={y - 5}>{label.split(" ")[0]}</tspan>
                  <tspan x={x} y={y + 5}>{label.split(" ")[1]}</tspan>
                </>
              ) : label}
            </text>
          ))}
          {/* Shot spokes */}
          {shots.map((shot, i) => {
            const sx    = shot.x * FIELD_SIZE;
            const sy    = shot.y * FIELD_SIZE;
            const dx    = sx - CX;
            const dy    = sy - CY;
            const dist  = Math.sqrt(dx * dx + dy * dy);
            const sx0   = CX + (dx / dist) * PITCH_R;
            const sy0   = CY + (dy / dist) * PITCH_R;
            const color = shotColor(shot.runs);
            const isSix = shot.runs === 6;
            return (
              <g key={i}>
                {/* Dashed extension line for sixes beyond boundary */}
                {isSix && (
                  <line
                    x1={sx0} y1={sy0} x2={sx} y2={sy}
                    stroke={color} strokeWidth={1.5} strokeOpacity={0.35}
                    strokeDasharray="4 3"
                  />
                )}
                <line x1={sx0} y1={sy0} x2={sx} y2={sy} stroke={color} strokeWidth={2.5} strokeOpacity={isSix ? 0.7 : 0.85} />
                {/* Endpoint dot (drag handle) */}
                <circle cx={sx} cy={sy} r={DOT_R + 2} fill={color} fillOpacity={0.18} />
                <circle cx={sx} cy={sy} r={DOT_R} fill={color} fillOpacity={0.95} />
                <text x={sx} y={sy + 3.5} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="700">
                  {shot.runs}
                </text>
              </g>
            );
          })}
          {/* Centred vertical pitch, drawn above shots to keep wickets visible. */}
          <rect x={CX - 10} y={CY - 32} width={20} height={64} rx={2} fill="#C8A96E" stroke="#A07040" strokeWidth={1} />
          {[-1, 1].map((end) => (
            <g key={end}>
              <line x1={CX - 13} y1={CY + end * 22} x2={CX + 13} y2={CY + end * 22} stroke="#FFFFFF" strokeWidth={1.5} />
              {[-3, 0, 3].map((offset) => (
                <line key={offset} x1={CX + offset} y1={CY + end * 25} x2={CX + offset} y2={CY + end * 30} stroke="#54351D" strokeWidth={1.5} />
              ))}
              <line x1={CX - 4} y1={CY + (end === 1 ? 25 : -30)} x2={CX + 4} y2={CY + (end === 1 ? 25 : -30)} stroke="#54351D" strokeWidth={1.5} />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}