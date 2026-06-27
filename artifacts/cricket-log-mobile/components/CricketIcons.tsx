import React from "react";
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop } from "react-native-svg";

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
      {/* Outfield */}
      <Rect x="0" y="0" width="14" height="24" rx="2" fill="#7f1d1d" />

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
      <Rect x="6.0" y="1.1" width="0.8" height="0.75" fill={BALL_RED} />
      <Rect x="7.5" y="1.1" width="0.8" height="0.75" fill={BALL_RED} />
      {/* stump 2 */}
      <Rect x="4.5" y="2.4" width="4.5" height="0.75" rx="0.38" fill={STUMP} />
      <Rect x="6.0" y="2.4" width="0.8" height="0.75" fill={BALL_RED} />
      <Rect x="7.5" y="2.4" width="0.8" height="0.75" fill={BALL_RED} />
      {/* stump 3 */}
      <Rect x="4.5" y="3.65" width="4.5" height="0.75" rx="0.38" fill={STUMP} />
      <Rect x="6.0" y="3.65" width="0.8" height="0.75" fill={BALL_RED} />
      <Rect x="7.5" y="3.65" width="0.8" height="0.75" fill={BALL_RED} />

      {/* ── Bottom stumps (mirror of top) ── */}
      {/* bail */}
      <Rect x="4.5" y="19.6" width="0.7" height="3.4" rx="0.35" fill={STUMP} />
      {/* stump 1 */}
      <Rect x="4.5" y="19.6" width="4.5" height="0.75" rx="0.38" fill={STUMP} />
      <Rect x="6.0" y="19.6" width="0.8" height="0.75" fill={BALL_RED} />
      <Rect x="7.5" y="19.6" width="0.8" height="0.75" fill={BALL_RED} />
      {/* stump 2 */}
      <Rect x="4.5" y="20.9" width="4.5" height="0.75" rx="0.38" fill={STUMP} />
      <Rect x="6.0" y="20.9" width="0.8" height="0.75" fill={BALL_RED} />
      <Rect x="7.5" y="20.9" width="0.8" height="0.75" fill={BALL_RED} />
      {/* stump 3 */}
      <Rect x="4.5" y="22.15" width="4.5" height="0.75" rx="0.38" fill={STUMP} />
      <Rect x="6.0" y="22.15" width="0.8" height="0.75" fill={BALL_RED} />
      <Rect x="7.5" y="22.15" width="0.8" height="0.75" fill={BALL_RED} />
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

      {/* ── Left cap — cricket ball red, brim faces right ── */}
      {/* Crown dome */}
      <Path d="M 2,12 C 2,4 5,1.5 9,2 C 13,2.5 14,7 14,12 Z" fill="#C0392B" />
      {/* Band */}
      <Rect x="2" y="12" width="12" height="1.6" fill="#a93226" />
      {/* Peak */}
      <Path d="M 13.5,12 L 17,13 L 16,14.2 L 13.5,13.4 Z" fill="#96281b" />
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
      <Path d="M 10.7,7 L 11.5,6.2 L 12.3,7 L 12,8.5 L 11,8.5 Z" fill="#C0392B" />

      {/* ── Right cap — dark red, brim faces left ── */}
      {/* Crown dome */}
      <Path d="M 30,12 C 30,4 27,1.5 23,2 C 19,2.5 18,7 18,12 Z" fill="#96281b" />
      {/* Band */}
      <Rect x="18" y="12" width="12" height="1.6" fill="#7b2218" />
      {/* Peak */}
      <Path d="M 18.5,12 L 15,13 L 16,14.2 L 18.5,13.4 Z" fill="#641c14" />
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
      <Path d="M 19.7,7 L 20.5,6.2 L 21.3,7 L 21,8.5 L 20,8.5 Z" fill="#96281b" />

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
        <Rect x="2.5" y="7.5" width="3" height="1.5" fill={BALL_RED} />
        <Rect x="2.5" y="10.5" width="3" height="1.5" fill={BALL_RED} />
      </G>

      <G origin="10 18" rotation={11}>
        <Rect x="8.5" y="3.5" width="3" height="14.5" rx="1.5" fill={STUMP} />
        <Rect x="8.5" y="6" width="3" height="1.5" fill={BALL_RED} />
        <Rect x="8.5" y="9" width="3" height="1.5" fill={BALL_RED} />
      </G>

      <G origin="16 18" rotation={4}>
        <Rect x="14.5" y="5" width="3" height="13" rx="1.5" fill={STUMP} />
        <Rect x="14.5" y="7.5" width="3" height="1.5" fill={BALL_RED} />
        <Rect x="14.5" y="10.5" width="3" height="1.5" fill={BALL_RED} />
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

// ── Bar-chart scorecard — Stats pill ──────────────────────────────────────────
//
// Three ascending bars in shades of blue, with a base line.
// Feels like a cricket scorecard histogram.
//
export function BarChartStats({ size = 18 }: { size?: number }) {
  const h = (size / 16) * 14;
  return (
    <Svg width={size} height={h} viewBox="0 0 16 14">
      <Defs>
        <LinearGradient id="bar1" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e74c3c" stopOpacity="1" />
          <Stop offset="1" stopColor="#C0392B" stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="bar2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C0392B" stopOpacity="1" />
          <Stop offset="1" stopColor="#a93226" stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="bar3" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#a93226" stopOpacity="1" />
          <Stop offset="1" stopColor="#96281b" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      {/* Base line */}
      <Line x1="0.5" y1="13" x2="15.5" y2="13" stroke="#C0392B" strokeWidth="0.8" strokeOpacity="0.4" />
      {/* Bar 1 — short */}
      <Rect x="1" y="9" width="3.5" height="4" rx="0.8" fill="url(#bar1)" />
      {/* Bar 2 — medium */}
      <Rect x="6.25" y="5.5" width="3.5" height="7.5" rx="0.8" fill="url(#bar2)" />
      {/* Bar 3 — tall */}
      <Rect x="11.5" y="1.5" width="3.5" height="11.5" rx="0.8" fill="url(#bar3)" />
      {/* Tick marks on top of each bar */}
      <Rect x="1" y="8.3" width="3.5" height="0.7" rx="0.3" fill="rgba(255,255,255,0.5)" />
      <Rect x="6.25" y="4.8" width="3.5" height="0.7" rx="0.3" fill="rgba(255,255,255,0.5)" />
      <Rect x="11.5" y="0.8" width="3.5" height="0.7" rx="0.3" fill="rgba(255,255,255,0.5)" />
    </Svg>
  );
}

// ── Bullseye target — Targets pill ────────────────────────────────────────────
//
// Three concentric rings (amber) with fine crosshair lines and a solid centre.
//
export function BullseyeTarget({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      {/* Outer ring */}
      <Circle cx="8" cy="8" r="7" fill="none" stroke="#C0392B" strokeWidth="1.2" strokeOpacity="0.45" />
      {/* Middle ring */}
      <Circle cx="8" cy="8" r="4.5" fill="none" stroke="#C0392B" strokeWidth="1.3" strokeOpacity="0.7" />
      {/* Inner fill */}
      <Circle cx="8" cy="8" r="2.2" fill="#C0392B" />
      {/* Crosshair — vertical */}
      <Line x1="8" y1="0.5" x2="8" y2="3.3" stroke="#C0392B" strokeWidth="1" strokeOpacity="0.55" strokeLinecap="round" />
      <Line x1="8" y1="12.7" x2="8" y2="15.5" stroke="#C0392B" strokeWidth="1" strokeOpacity="0.55" strokeLinecap="round" />
      {/* Crosshair — horizontal */}
      <Line x1="0.5" y1="8" x2="3.3" y2="8" stroke="#C0392B" strokeWidth="1" strokeOpacity="0.55" strokeLinecap="round" />
      <Line x1="12.7" y1="8" x2="15.5" y2="8" stroke="#C0392B" strokeWidth="1" strokeOpacity="0.55" strokeLinecap="round" />
    </Svg>
  );
}

// ── Rising trend line — Form pill ─────────────────────────────────────────────
//
// Upward-trending polyline in green with cricket-ball dot markers
// and an arrowhead at the right end.
//
export function TrendLine({ size = 18 }: { size?: number }) {
  const h = (size / 16) * 14;
  return (
    <Svg width={size} height={h} viewBox="0 0 16 14">
      {/* Faint grid baseline */}
      <Line x1="0" y1="13" x2="16" y2="13" stroke="#C0392B" strokeWidth="0.5" strokeOpacity="0.25" />
      {/* Trend path */}
      <Path
        d="M1.5,11 L5,7.5 L9,8.5 L13.5,2.5"
        stroke="#C0392B" strokeWidth="1.6" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Arrowhead */}
      <Polygon
        points="13.5,1 15.5,3 12,3.5"
        fill="#C0392B"
      />
      {/* Data-point dots */}
      <Circle cx="1.5" cy="11" r="1.4" fill="#C0392B" />
      <Circle cx="5" cy="7.5" r="1.4" fill="#C0392B" />
      <Circle cx="9" cy="8.5" r="1.4" fill="#C0392B" />
      <Circle cx="13.5" cy="2.5" r="1.4" fill="#C0392B" />
      {/* White highlight on each dot */}
      <Circle cx="1.1" cy="10.6" r="0.5" fill="rgba(255,255,255,0.55)" />
      <Circle cx="4.6" cy="7.1" r="0.5" fill="rgba(255,255,255,0.55)" />
      <Circle cx="8.6" cy="8.1" r="0.5" fill="rgba(255,255,255,0.55)" />
      <Circle cx="13.1" cy="2.1" r="0.5" fill="rgba(255,255,255,0.55)" />
    </Svg>
  );
}

// ── Stacked match slips — Recent pill ─────────────────────────────────────────
//
// Three overlapping card rectangles (cascading offset) with ruled lines
// on the front card, like a stack of match scorecards.
//
export function StackedCards({ size = 18 }: { size?: number }) {
  const h = (size / 16) * 14;
  return (
    <Svg width={size} height={h} viewBox="0 0 16 14">
      {/* Back card */}
      <Rect x="4" y="0.5" width="11" height="9" rx="1.5" fill="#fde8e8" stroke="#e57373" strokeWidth="0.7" />
      {/* Middle card */}
      <Rect x="2" y="2" width="11" height="9" rx="1.5" fill="#fef2f2" stroke="#C0392B" strokeWidth="0.8" strokeOpacity="0.5" />
      {/* Front card */}
      <Rect x="0" y="3.5" width="11" height="10" rx="1.5" fill="white" stroke="#C0392B" strokeWidth="0.9" />
      {/* Ruling lines on front card */}
      <Line x1="1.5" y1="7" x2="9.5" y2="7" stroke="#C0392B" strokeWidth="0.7" strokeOpacity="0.5" strokeLinecap="round" />
      <Line x1="1.5" y1="9.5" x2="9.5" y2="9.5" stroke="#C0392B" strokeWidth="0.7" strokeOpacity="0.35" strokeLinecap="round" />
      <Line x1="1.5" y1="12" x2="7" y2="12" stroke="#C0392B" strokeWidth="0.7" strokeOpacity="0.25" strokeLinecap="round" />
      {/* Small header block on front card */}
      <Rect x="1.5" y="5" width="4" height="1.2" rx="0.4" fill="#C0392B" opacity="0.7" />
    </Svg>
  );
}
