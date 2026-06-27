import React from "react";
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";

const STUMP = "#E8D5A8";
const STRIPE = "#1d4ed8";
const BALL_RED = "#C0392B";
const BALL_SEAM = "#7B1C1C";

// ── Cricket pitch top-down — used on the Match Types pill ─────────────────────
//
// Viewbox 14×24. Pitch strip runs top-to-bottom (portrait).
// Three stumps with blue stripes span across each end; creases sit inside.
//
export function CricketPitch({ size = 20 }: { size?: number }) {
  const w = (size / 24) * 14;
  return (
    <Svg width={w} height={size} viewBox="0 0 14 24">
      {/* Green outfield */}
      <Rect x="0" y="0" width="14" height="24" rx="2" fill="#16a34a" />

      {/* Pitch strip — tan, centred */}
      <Rect x="4.5" y="0" width="5" height="24" fill="#C8B070" />

      {/* Top popping crease */}
      <Rect x="4.5" y="4.8" width="5" height="0.45" fill="rgba(255,255,255,0.7)" />
      {/* Bottom popping crease */}
      <Rect x="4.5" y="18.75" width="5" height="0.45" fill="rgba(255,255,255,0.7)" />

      {/* ── Top stumps (3 horizontal bars) ── */}
      {/* bail — vertical bar spanning all three stumps */}
      <Rect x="4.5" y="1.0" width="0.7" height="3.4" rx="0.35" fill={STUMP} />
      {/* stump 1 */}
      <Rect x="4.5" y="1.1" width="4.5" height="0.75" rx="0.38" fill={STUMP} />
      <Rect x="6.0" y="1.1" width="0.8" height="0.75" fill={STRIPE} />
      <Rect x="7.5" y="1.1" width="0.8" height="0.75" fill={STRIPE} />
      {/* stump 2 */}
      <Rect x="4.5" y="2.4" width="4.5" height="0.75" rx="0.38" fill={STUMP} />
      <Rect x="6.0" y="2.4" width="0.8" height="0.75" fill={STRIPE} />
      <Rect x="7.5" y="2.4" width="0.8" height="0.75" fill={STRIPE} />
      {/* stump 3 */}
      <Rect x="4.5" y="3.65" width="4.5" height="0.75" rx="0.38" fill={STUMP} />
      <Rect x="6.0" y="3.65" width="0.8" height="0.75" fill={STRIPE} />
      <Rect x="7.5" y="3.65" width="0.8" height="0.75" fill={STRIPE} />

      {/* ── Bottom stumps (mirror of top) ── */}
      {/* bail */}
      <Rect x="4.5" y="19.6" width="0.7" height="3.4" rx="0.35" fill={STUMP} />
      {/* stump 1 */}
      <Rect x="4.5" y="19.6" width="4.5" height="0.75" rx="0.38" fill={STUMP} />
      <Rect x="6.0" y="19.6" width="0.8" height="0.75" fill={STRIPE} />
      <Rect x="7.5" y="19.6" width="0.8" height="0.75" fill={STRIPE} />
      {/* stump 2 */}
      <Rect x="4.5" y="20.9" width="4.5" height="0.75" rx="0.38" fill={STUMP} />
      <Rect x="6.0" y="20.9" width="0.8" height="0.75" fill={STRIPE} />
      <Rect x="7.5" y="20.9" width="0.8" height="0.75" fill={STRIPE} />
      {/* stump 3 */}
      <Rect x="4.5" y="22.15" width="4.5" height="0.75" rx="0.38" fill={STUMP} />
      <Rect x="6.0" y="22.15" width="0.8" height="0.75" fill={STRIPE} />
      <Rect x="7.5" y="22.15" width="0.8" height="0.75" fill={STRIPE} />
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

// ── Two cricket caps facing each other — used on the Head-to-Head pill ───────
//
// Viewbox 32×16. Left cap is blue, right cap is red.
// Both have traditional yellow piping on the crown seam and band edge,
// and a small circular badge on the front face. Brims point inward to
// suggest the two opponents facing off.
//
export function TwoCricketCaps({ size = 22 }: { size?: number }) {
  const h = (size / 32) * 16;
  return (
    <Svg width={size} height={h} viewBox="0 0 32 16">

      {/* ── Left cap — blue, brim faces right ── */}
      {/* Crown dome */}
      <Path d="M 2,12 C 2,4 5,1.5 9,2 C 13,2.5 14,7 14,12 Z" fill="#1d4ed8" />
      {/* Band */}
      <Rect x="2" y="12" width="12" height="1.6" fill="#1a3a9f" />
      {/* Peak */}
      <Path d="M 13.5,12 L 17,13 L 16,14.2 L 13.5,13.4 Z" fill="#162e72" />
      {/* Yellow piping — crown seam */}
      <Path
        d="M 2,12 C 2,4 5,1.5 9,2 C 13,2.5 14,7 14,12"
        stroke="#FBBF24" strokeWidth="0.75" fill="none" strokeLinecap="round"
      />
      {/* Yellow piping — band top edge */}
      <Path d="M 2,12 L 14,12" stroke="#FBBF24" strokeWidth="0.5" fill="none" />
      {/* Badge — circle with outline + mini shield */}
      <Circle cx="11.5" cy="7.5" r="2" fill="white" />
      <Circle cx="11.5" cy="7.5" r="2" fill="none" stroke="#FBBF24" strokeWidth="0.45" />
      <Path d="M 10.7,7 L 11.5,6.2 L 12.3,7 L 12,8.5 L 11,8.5 Z" fill="#1d4ed8" />

      {/* ── Right cap — red, brim faces left ── */}
      {/* Crown dome */}
      <Path d="M 30,12 C 30,4 27,1.5 23,2 C 19,2.5 18,7 18,12 Z" fill="#dc2626" />
      {/* Band */}
      <Rect x="18" y="12" width="12" height="1.6" fill="#b91c1c" />
      {/* Peak */}
      <Path d="M 18.5,12 L 15,13 L 16,14.2 L 18.5,13.4 Z" fill="#8b1a1a" />
      {/* Yellow piping — crown seam */}
      <Path
        d="M 30,12 C 30,4 27,1.5 23,2 C 19,2.5 18,7 18,12"
        stroke="#FBBF24" strokeWidth="0.75" fill="none" strokeLinecap="round"
      />
      {/* Yellow piping — band top edge */}
      <Path d="M 18,12 L 30,12" stroke="#FBBF24" strokeWidth="0.5" fill="none" />
      {/* Badge */}
      <Circle cx="20.5" cy="7.5" r="2" fill="white" />
      <Circle cx="20.5" cy="7.5" r="2" fill="none" stroke="#FBBF24" strokeWidth="0.45" />
      <Path d="M 19.7,7 L 20.5,6.2 L 21.3,7 L 21,8.5 L 20,8.5 Z" fill="#dc2626" />

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
