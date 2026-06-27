import React from "react";
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";

const STUMP = "#E8D5A8";
const STRIPE = "#1d4ed8";
const BALL_RED = "#C0392B";
const BALL_SEAM = "#7B1C1C";

// ── Cricket pitch top-down — used on the Match Types pill ─────────────────────
//
// Viewbox 24×14. Pitch strip runs left-to-right through a green square.
// Three stumps with blue stripes stand at each end of the strip.
// Bail caps each set; crease lines sit just inside each wicket.
//
export function CricketPitch({ size = 18 }: { size?: number }) {
  const h = (size / 24) * 14;
  return (
    <Svg width={size} height={h} viewBox="0 0 24 14">
      {/* Green outer square */}
      <Rect x="0" y="0" width="24" height="14" rx="2" fill="#16a34a" />

      {/* Pitch strip — tan playing surface */}
      <Rect x="0" y="4.5" width="24" height="5" fill="#C8B070" />

      {/* Left popping crease */}
      <Rect x="4.8" y="4.5" width="0.45" height="5" fill="rgba(255,255,255,0.7)" />
      {/* Right popping crease */}
      <Rect x="18.75" y="4.5" width="0.45" height="5" fill="rgba(255,255,255,0.7)" />

      {/* ── Left stumps ── */}
      <Rect x="1.0" y="4.5" width="3.4" height="0.7" rx="0.35" fill={STUMP} />
      <Rect x="1.1" y="4.5" width="0.75" height="4.5" rx="0.38" fill={STUMP} />
      <Rect x="1.1" y="6.0" width="0.75" height="0.8" fill={STRIPE} />
      <Rect x="1.1" y="7.5" width="0.75" height="0.8" fill={STRIPE} />
      <Rect x="2.4" y="4.5" width="0.75" height="4.5" rx="0.38" fill={STUMP} />
      <Rect x="2.4" y="6.0" width="0.75" height="0.8" fill={STRIPE} />
      <Rect x="2.4" y="7.5" width="0.75" height="0.8" fill={STRIPE} />
      <Rect x="3.65" y="4.5" width="0.75" height="4.5" rx="0.38" fill={STUMP} />
      <Rect x="3.65" y="6.0" width="0.75" height="0.8" fill={STRIPE} />
      <Rect x="3.65" y="7.5" width="0.75" height="0.8" fill={STRIPE} />

      {/* ── Right stumps (mirror of left) ── */}
      <Rect x="19.6" y="4.5" width="3.4" height="0.7" rx="0.35" fill={STUMP} />
      <Rect x="19.6" y="4.5" width="0.75" height="4.5" rx="0.38" fill={STUMP} />
      <Rect x="19.6" y="6.0" width="0.75" height="0.8" fill={STRIPE} />
      <Rect x="19.6" y="7.5" width="0.75" height="0.8" fill={STRIPE} />
      <Rect x="20.9" y="4.5" width="0.75" height="4.5" rx="0.38" fill={STUMP} />
      <Rect x="20.9" y="6.0" width="0.75" height="0.8" fill={STRIPE} />
      <Rect x="20.9" y="7.5" width="0.75" height="0.8" fill={STRIPE} />
      <Rect x="22.15" y="4.5" width="0.75" height="4.5" rx="0.38" fill={STUMP} />
      <Rect x="22.15" y="6.0" width="0.75" height="0.8" fill={STRIPE} />
      <Rect x="22.15" y="7.5" width="0.75" height="0.8" fill={STRIPE} />
    </Svg>
  );
}

// ── Ball hitting stumps — used on the Best Bowling card ──────────────────────
export function BallHitsStumps({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Line x1="0" y1="43" x2="48" y2="43" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />

      <G origin="16 43" rotation={26}>
        <Rect x="14" y="13" width="4" height="30" rx="2" fill={STUMP} />
        <Rect x="14" y="17.5" width="4" height="2.5" fill={STRIPE} />
        <Rect x="14" y="22.5" width="4" height="2.5" fill={STRIPE} />
      </G>

      <G origin="26 43" rotation={13}>
        <Rect x="24" y="13" width="4" height="30" rx="2" fill={STUMP} />
        <Rect x="24" y="17.5" width="4" height="2.5" fill={STRIPE} />
        <Rect x="24" y="22.5" width="4" height="2.5" fill={STRIPE} />
      </G>

      <G origin="36 43" rotation={5}>
        <Rect x="34" y="13" width="4" height="30" rx="2" fill={STUMP} />
        <Rect x="34" y="17.5" width="4" height="2.5" fill={STRIPE} />
        <Rect x="34" y="22.5" width="4" height="2.5" fill={STRIPE} />
      </G>

      <G origin="20 8" rotation={-32}>
        <Rect x="15" y="6.5" width="10" height="2.8" rx="1.4" fill={STUMP} />
      </G>

      <G origin="30 5" rotation={22}>
        <Rect x="25" y="3.5" width="10" height="2.8" rx="1.4" fill={STUMP} />
      </G>

      <Circle cx="7" cy="36" r="8" fill={BALL_RED} />
      <Path d="M4 30 C1 33 1 39 4 42" stroke={BALL_SEAM} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <Path d="M10 30 C13 33 13 39 10 42" stroke={BALL_SEAM} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <Circle cx="4" cy="32" r="2.2" fill="rgba(255,255,255,0.22)" />
    </Svg>
  );
}

// ── Stumps exploding — used on the Dismissals pill ───────────────────────────
export function StumpsExploding({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Line x1="0" y1="18" x2="20" y2="18" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />

      <G origin="4 18" rotation={24}>
        <Rect x="2.5" y="5" width="3" height="13" rx="1.5" fill={STUMP} />
        <Rect x="2.5" y="7.5" width="3" height="1.5" fill={STRIPE} />
        <Rect x="2.5" y="10.5" width="3" height="1.5" fill={STRIPE} />
      </G>

      <G origin="10 18" rotation={11}>
        <Rect x="8.5" y="3.5" width="3" height="14.5" rx="1.5" fill={STUMP} />
        <Rect x="8.5" y="6" width="3" height="1.5" fill={STRIPE} />
        <Rect x="8.5" y="9" width="3" height="1.5" fill={STRIPE} />
      </G>

      <G origin="16 18" rotation={4}>
        <Rect x="14.5" y="5" width="3" height="13" rx="1.5" fill={STUMP} />
        <Rect x="14.5" y="7.5" width="3" height="1.5" fill={STRIPE} />
        <Rect x="14.5" y="10.5" width="3" height="1.5" fill={STRIPE} />
      </G>

      <G origin="7 4" rotation={-28}>
        <Rect x="3" y="2.5" width="8" height="2" rx="1" fill={STUMP} />
      </G>

      <G origin="13 2" rotation={22}>
        <Rect x="9" y="0.5" width="8" height="2" rx="1" fill={STUMP} />
      </G>
    </Svg>
  );
}
