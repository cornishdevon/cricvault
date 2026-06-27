import React from "react";
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";

const STUMP = "#E8D5A8";
const BALL_RED = "#C0392B";
const BALL_SEAM = "#7B1C1C";

// ── Ball hitting stumps — used on the Best Bowling card ──────────────────────
//
// Viewbox 48×48. Ball comes from the left; stumps scatter to the right.
// Pivot for each stump is its base on the ground line (y=43).
// Each bail is a short capsule already "in the air" with an angle.
//
export function BallHitsStumps({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* Ground */}
      <Line x1="0" y1="43" x2="48" y2="43" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />

      {/* Stump 1 (leg) — knocked hard right, rotation around its base */}
      <G origin="16 43" rotation={26}>
        <Rect x="14" y="13" width="4" height="30" rx="2" fill={STUMP} />
      </G>

      {/* Stump 2 (middle) — knocked moderately */}
      <G origin="26 43" rotation={13}>
        <Rect x="24" y="13" width="4" height="30" rx="2" fill={STUMP} />
      </G>

      {/* Stump 3 (off) — barely disturbed */}
      <G origin="36 43" rotation={5}>
        <Rect x="34" y="13" width="4" height="30" rx="2" fill={STUMP} />
      </G>

      {/* Left bail — flying upper-left, angled */}
      <G origin="20 8" rotation={-32}>
        <Rect x="15" y="6.5" width="10" height="2.8" rx="1.4" fill={STUMP} />
      </G>

      {/* Right bail — flying upper-right, angled */}
      <G origin="30 5" rotation={22}>
        <Rect x="25" y="3.5" width="10" height="2.8" rx="1.4" fill={STUMP} />
      </G>

      {/* Cricket ball */}
      <Circle cx="7" cy="36" r="8" fill={BALL_RED} />
      {/* Seam — left arc */}
      <Path
        d="M4 30 C1 33 1 39 4 42"
        stroke={BALL_SEAM}
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
      />
      {/* Seam — right arc */}
      <Path
        d="M10 30 C13 33 13 39 10 42"
        stroke={BALL_SEAM}
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
      />
      {/* Highlight */}
      <Circle cx="4" cy="32" r="2.2" fill="rgba(255,255,255,0.22)" />
    </Svg>
  );
}

// ── Stumps exploding — used on the Dismissals pill (small size) ───────────────
//
// Viewbox 20×20. Three stumps angled as if just struck; two bails in the air.
// No ball — too small at pill size. Pure stump-scatter silhouette.
//
export function StumpsExploding({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      {/* Ground */}
      <Line x1="0" y1="18" x2="20" y2="18" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />

      {/* Stump 1 — knocked right */}
      <G origin="4 18" rotation={24}>
        <Rect x="2.5" y="5" width="3" height="13" rx="1.5" fill={STUMP} />
      </G>

      {/* Stump 2 — tilted */}
      <G origin="10 18" rotation={11}>
        <Rect x="8.5" y="3.5" width="3" height="14.5" rx="1.5" fill={STUMP} />
      </G>

      {/* Stump 3 — barely moved */}
      <G origin="16 18" rotation={4}>
        <Rect x="14.5" y="5" width="3" height="13" rx="1.5" fill={STUMP} />
      </G>

      {/* Left bail — flying left */}
      <G origin="7 4" rotation={-28}>
        <Rect x="3" y="2.5" width="8" height="2" rx="1" fill={STUMP} />
      </G>

      {/* Right bail — flying right */}
      <G origin="13 2" rotation={22}>
        <Rect x="9" y="0.5" width="8" height="2" rx="1" fill={STUMP} />
      </G>
    </Svg>
  );
}
