import { useId, useState, type CSSProperties } from "react";
import "./dynamic.css";

const FIELD_SIZE = 336;
const CX = FIELD_SIZE / 2;
const CY = FIELD_SIZE / 2;
const FIELD_R = FIELD_SIZE / 2 - 24;
const SIX_MAX = FIELD_R * 1.16;

const RUNS = [
  { value: 1, label: "1 run", color: "#839197" },
  { value: 2, label: "2 runs", color: "#3686c5" },
  { value: 4, label: "Four", color: "#eb6b3d" },
  { value: 6, label: "Six", color: "#7C3AED" },
];

// Right-handed batter at the top facing down the pitch: off side on the left.
const SHOT_LABELS = [
  { label: "Lucky edge", x: 168, y: 45, stacked: true },
  { label: "Leg glance", x: 212, y: 54, stacked: true },
  { label: "Straight drive", x: 168, y: 294 },
  { label: "Cover drive", x: 89, y: 258 },
  { label: "Square drive", x: 55, y: 199 },
  { label: "Cut", x: 57, y: 139 },
  { label: "Leading edge", x: 55, y: 171, stacked: true },
  { label: "Late cut", x: 92, y: 79 },
  { label: "Sweep", x: 244, y: 79 },
  { label: "Pull / Hook", x: 280, y: 139 },
  { label: "Flick", x: 280, y: 199 },
  { label: "Slog", x: 272, y: 224 },
  { label: "On drive", x: 247, y: 258 },
];

// Bisect label directions at the top batting crease, retaining a tight behind-wicket wedge.
const SECTION_EDGES = (() => {
  const originY = CY - 27;
  const angles = SHOT_LABELS.map(({ x, y }) => Math.atan2(y - originY, x - CX)).sort((a, b) => a - b);
  return angles.map((angle, i) => {
    const next = angles[(i + 1) % angles.length] + (i === angles.length - 1 ? 2 * Math.PI : 0);
    const behind = -Math.PI / 2;
    const middle = Math.abs(angle - behind) < 0.001
      ? behind + 0.24
      : Math.abs(next - behind) < 0.001 ? behind - 0.24 : (angle + next) / 2;
    const dx = Math.cos(middle);
    const dy = Math.sin(middle);
    const offset = originY - CY;
    const distance = -offset * dy + Math.sqrt(FIELD_R ** 2 - offset ** 2 + (offset * dy) ** 2);
    return { x: CX + distance * dx, y: originY + distance * dy };
  });
})();

function StackLabel({ label, x, y, stacked }: (typeof SHOT_LABELS)[number]) {
  if (!stacked) return <text x={x} y={y}>{label}</text>;
  const [first, second] = label.split(" ");
  return (
    <text x={x} y={y}>
      <tspan x={x} dy="-0.52em">{first}</tspan>
      <tspan x={x} dy="1.15em">{second}</tspan>
    </text>
  );
}

export function Dynamic() {
  const [activeShot, setActiveShot] = useState<string | null>(null);
  const uid = useId().replace(/:/g, "");

  return (
    <main className="dynamic-wheel">
      <header className="dynamic-wheel__heading">
        <span className="dynamic-wheel__eyebrow">CricVault · shot map</span>
        <span className="dynamic-wheel__hint">{activeShot ? activeShot : "Touch a region to explore"}</span>
      </header>
      <div className="dynamic-wheel__legend" aria-label="Runs legend">
        {RUNS.map((run) => (
          <span className="dynamic-wheel__key" key={run.value}>
            <i style={{ "--key": run.color } as CSSProperties} />
            {run.label}
          </span>
        ))}
      </div>

      <div className="dynamic-wheel__stage">
        <svg className="dynamic-wheel__svg" viewBox={`0 0 ${FIELD_SIZE} ${FIELD_SIZE}`} role="img" aria-label="Interactive cricket wagon wheel">
          <defs>
            <radialGradient id={`${uid}-grass`} cx="42%" cy="32%" r="74%">
              <stop offset="0%" stopColor="#8bb957" />
              <stop offset="62%" stopColor="#528d45" />
              <stop offset="100%" stopColor="#2f6841" />
            </radialGradient>
            <linearGradient id={`${uid}-pitch`} x1="0" x2="1">
              <stop offset="0%" stopColor="#b6854f" />
              <stop offset="43%" stopColor="#e2bb7b" />
              <stop offset="100%" stopColor="#a87342" />
            </linearGradient>
            <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <clipPath id={`${uid}-fieldclip`}><circle cx={CX} cy={CY} r={FIELD_R} /></clipPath>
            <pattern id={`${uid}-stripes`} width="38" height="38" patternUnits="userSpaceOnUse">
              <rect width="19" height="38" fill="#d6eb8c" opacity=".1" />
            </pattern>
          </defs>

          <ellipse className="dynamic-wheel__six-zone" cx={CX} cy={CY} rx={SIX_MAX} ry={SIX_MAX} />
          <circle className="dynamic-wheel__field-shadow" cx={CX} cy={CY + 5} r={FIELD_R + 3} />
          <circle className="dynamic-wheel__field" cx={CX} cy={CY} r={FIELD_R} fill={`url(#${uid}-grass)`} />
          <circle cx={CX} cy={CY} r={FIELD_R} fill={`url(#${uid}-stripes)`} />
          <g clipPath={`url(#${uid}-fieldclip)`}>
            <ellipse cx={CX - 58} cy={CY - 72} rx="106" ry="35" fill="#d7ed9c" opacity=".09" transform={`rotate(-25 ${CX - 58} ${CY - 72})`} />
            <ellipse cx={CX + 68} cy={CY + 85} rx="130" ry="40" fill="#183f31" opacity=".13" transform={`rotate(-25 ${CX + 68} ${CY + 85})`} />
          </g>
          <circle className="dynamic-wheel__inner-ring" cx={CX} cy={CY} r={FIELD_R * .6} />

          <g className="dynamic-wheel__regions">
            {SECTION_EDGES.map(({ x, y }, i) => (
              <line key={i} x1={CX} y1={CY - 27} x2={x} y2={y} />
            ))}
          </g>
          <circle className="dynamic-wheel__rope-under" cx={CX} cy={CY} r={FIELD_R} />
          <circle className="dynamic-wheel__rope" cx={CX} cy={CY} r={FIELD_R} />
          <circle className="dynamic-wheel__rope-twist" cx={CX} cy={CY} r={FIELD_R} />

          {SHOT_LABELS.map((shot) => (
            <g
              className={`dynamic-wheel__label ${activeShot === shot.label ? "is-active" : ""}`}
              key={shot.label}
              onPointerEnter={() => setActiveShot(shot.label)}
              onPointerLeave={() => setActiveShot(null)}
              onClick={() => setActiveShot(activeShot === shot.label ? null : shot.label)}
              tabIndex={0}
              role="button"
              aria-label={`Highlight ${shot.label}`}
              onFocus={() => setActiveShot(shot.label)}
              onBlur={() => setActiveShot(null)}
            >
              <circle cx={shot.x} cy={shot.y} r="17" />
              <StackLabel {...shot} />
            </g>
          ))}

          <g className="dynamic-wheel__pitch-shadow" filter={`url(#${uid}-soft)`}><rect x={CX - 13} y={CY - 38} width="26" height="76" rx="4" /></g>
          <rect className="dynamic-wheel__pitch" x={CX - 11} y={CY - 38} width="22" height="76" rx="2.5" fill={`url(#${uid}-pitch)`} />
          <line className="dynamic-wheel__crease" x1={CX - 18} y1={CY - 27} x2={CX + 18} y2={CY - 27} />
          <line className="dynamic-wheel__crease" x1={CX - 18} y1={CY + 27} x2={CX + 18} y2={CY + 27} />
          {[-1, 1].map((end) => (
            <g className="dynamic-wheel__stumps" key={end}>
              {[-4, 0, 4].map((offset) => <line key={offset} x1={CX + offset} y1={CY + end * 30} x2={CX + offset} y2={CY + end * 35} />)}
              <line x1={CX - 5.5} y1={CY + (end === 1 ? 30 : -35)} x2={CX + 5.5} y2={CY + (end === 1 ? 30 : -35)} />
            </g>
          ))}
        </svg>
        <div className="dynamic-wheel__ground-mark" aria-hidden="true">C</div>
      </div>
      <p className="dynamic-wheel__caption">From the crease, every inning has its own story.</p>
    </main>
  );
}