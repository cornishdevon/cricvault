import React from "react";
import Svg, { Circle, G, Line, Path, Polygon, Rect } from "react-native-svg";

// ── Cricket ball — straight seam across the equator ──────────────────────────
export function CricketBallSvg({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx="20" cy="20" r="19" fill={RED} />
      {/* Straight seam */}
      <Line x1="1" y1="20" x2="39" y2="20" stroke={CREAM} strokeWidth="2.2" strokeLinecap="round" opacity={0.9} />
      {/* Stitch marks above seam (angled /) */}
      <Line x1="8"  y1="17" x2="10" y2="19.5" stroke={CREAM} strokeWidth="1.2" opacity={0.65} strokeLinecap="round" />
      <Line x1="14" y1="16" x2="16" y2="19.5" stroke={CREAM} strokeWidth="1.2" opacity={0.65} strokeLinecap="round" />
      <Line x1="20" y1="16" x2="22" y2="19.5" stroke={CREAM} strokeWidth="1.2" opacity={0.65} strokeLinecap="round" />
      <Line x1="26" y1="16" x2="28" y2="19.5" stroke={CREAM} strokeWidth="1.2" opacity={0.65} strokeLinecap="round" />
      <Line x1="32" y1="17" x2="34" y2="19.5" stroke={CREAM} strokeWidth="1.2" opacity={0.65} strokeLinecap="round" />
      {/* Stitch marks below seam (angled \) */}
      <Line x1="10" y1="20.5" x2="8"  y2="23" stroke={CREAM} strokeWidth="1.2" opacity={0.65} strokeLinecap="round" />
      <Line x1="16" y1="20.5" x2="14" y2="24" stroke={CREAM} strokeWidth="1.2" opacity={0.65} strokeLinecap="round" />
      <Line x1="22" y1="20.5" x2="20" y2="24" stroke={CREAM} strokeWidth="1.2" opacity={0.65} strokeLinecap="round" />
      <Line x1="28" y1="20.5" x2="26" y2="24" stroke={CREAM} strokeWidth="1.2" opacity={0.65} strokeLinecap="round" />
      <Line x1="34" y1="20.5" x2="32" y2="23" stroke={CREAM} strokeWidth="1.2" opacity={0.65} strokeLinecap="round" />
    </Svg>
  );
}

// ── Single hand — palm facing viewer, fingers up ───────────────────────────────
export function CatchingHandsSvg({ size = 24 }: { size?: number }) {
  const SKIN = "#C89060";
  const DARK = "#A0724A";
  return (
    <Svg width={size} height={size} viewBox="0 0 32 40">
      {/* Palm */}
      <Path d="M 5,38 C 5,32 6,28 8,27 L 24,27 C 26,28 27,32 27,38 Z" fill={SKIN} />
      {/* Index finger */}
      <Path d="M 8,27 L 8,10" stroke={SKIN} strokeWidth="4.8" strokeLinecap="round" />
      {/* Middle finger */}
      <Path d="M 13.5,27 L 13.5,7" stroke={SKIN} strokeWidth="4.8" strokeLinecap="round" />
      {/* Ring finger */}
      <Path d="M 19,27 L 19,8" stroke={SKIN} strokeWidth="4.8" strokeLinecap="round" />
      {/* Little finger */}
      <Path d="M 24,27 L 24,12" stroke={SKIN} strokeWidth="4.3" strokeLinecap="round" />
      {/* Thumb */}
      <Path d="M 5,33 C 1,30 1,24 5,21" stroke={SKIN} strokeWidth="4.3" strokeLinecap="round" fill="none" />
      {/* Knuckle hints */}
      <Line x1="8"    y1="20" x2="8"    y2="21.5" stroke={DARK} strokeWidth="1" opacity={0.25} strokeLinecap="round" />
      <Line x1="13.5" y1="19" x2="13.5" y2="20.5" stroke={DARK} strokeWidth="1" opacity={0.25} strokeLinecap="round" />
      <Line x1="19"   y1="19" x2="19"   y2="20.5" stroke={DARK} strokeWidth="1" opacity={0.25} strokeLinecap="round" />
      <Line x1="24"   y1="21" x2="24"   y2="22.5" stroke={DARK} strokeWidth="1" opacity={0.25} strokeLinecap="round" />
    </Svg>
  );
}

const RED   = "#C0392B";
const CREAM = "#E8D5A8";

// ── Ball hitting stumps — bold version for Best Bowling card ─────────────────
export function BallHitsStumps({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* Ground line */}
      <Line x1="0" y1="44" x2="48" y2="44" stroke={CREAM} strokeWidth="2" opacity={0.3} />
      {/* Left stump — tilted left */}
      <G origin="14 44" rotation={-20}>
        <Rect x="11" y="10" width="6" height="34" rx="3" fill={CREAM} />
      </G>
      {/* Centre stump — slight tilt */}
      <G origin="24 44" rotation={-8}>
        <Rect x="21" y="8" width="6" height="36" rx="3" fill={CREAM} />
      </G>
      {/* Right stump — slight tilt */}
      <G origin="34 44" rotation={6}>
        <Rect x="31" y="12" width="6" height="32" rx="3" fill={CREAM} />
      </G>
      {/* Bail — flying left */}
      <G origin="13 10" rotation={-35}>
        <Rect x="5" y="7" width="14" height="4" rx="2" fill={CREAM} />
      </G>
      {/* Bail — flying right */}
      <G origin="33 8" rotation={25}>
        <Rect x="27" y="5" width="14" height="4" rx="2" fill={CREAM} />
      </G>
      {/* Cricket ball */}
      <Circle cx="9" cy="37" r="9" fill={RED} />
      <Path d="M 5,30 C 2,34 2,40 5,44" stroke={CREAM} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.6} />
      <Path d="M 13,30 C 16,34 16,40 13,44" stroke={CREAM} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}

// ── Stats pill — bold bar chart ───────────────────────────────────────────────
export function BarChartStats({ size = 18 }: { size?: number }) {
  const h = (size / 18) * 15;
  return (
    <Svg width={size} height={h} viewBox="0 0 18 15">
      <Rect x="0"    y="9"   width="5" height="6" rx="1.5" fill={RED} opacity={0.4} />
      <Rect x="6.5"  y="4.5" width="5" height="10.5" rx="1.5" fill={RED} opacity={0.7} />
      <Rect x="13"   y="0"   width="5" height="15"   rx="1.5" fill={RED} />
    </Svg>
  );
}

// ── Targets pill — bold bullseye ──────────────────────────────────────────────
export function BullseyeTarget({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Circle cx="10" cy="10" r="9"   fill="none" stroke={RED} strokeWidth="2"   opacity={0.35} />
      <Circle cx="10" cy="10" r="5.5" fill="none" stroke={RED} strokeWidth="2.5" opacity={0.65} />
      <Circle cx="10" cy="10" r="2.5" fill={RED} />
    </Svg>
  );
}

// ── Form pill — bold rising arrow ─────────────────────────────────────────────
export function TrendLine({ size = 18 }: { size?: number }) {
  const h = (size / 20) * 16;
  return (
    <Svg width={size} height={h} viewBox="0 0 20 16">
      <Path
        d="M 1.5,14 L 7,8.5 L 12,10.5 L 18,2"
        stroke={RED} strokeWidth="2.8" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Polygon points="18,0  21,4.5  14.5,5" fill={RED} />
      <Circle cx="1.5"  cy="14"   r="2"   fill={RED} />
      <Circle cx="7"    cy="8.5"  r="2"   fill={RED} />
      <Circle cx="12"   cy="10.5" r="2"   fill={RED} />
      <Circle cx="18"   cy="2"    r="2"   fill={RED} />
    </Svg>
  );
}

// ── Recent pill — bold stacked cards ─────────────────────────────────────────
export function StackedCards({ size = 18 }: { size?: number }) {
  const h = (size / 18) * 16;
  return (
    <Svg width={size} height={h} viewBox="0 0 18 16">
      {/* Back card */}
      <Rect x="3.5" y="0.5" width="14" height="10" rx="2" fill="none" stroke={RED} strokeWidth="1.8" opacity={0.3} />
      {/* Front card */}
      <Rect x="0.5" y="4"   width="14" height="11.5" rx="2" fill="white" stroke={RED} strokeWidth="2" />
      <Rect x="2.5" y="7.5" width="9"  height="2"    rx="1" fill={RED} opacity={0.9} />
      <Rect x="2.5" y="11"  width="6"  height="1.5"  rx="0.75" fill={RED} opacity={0.5} />
    </Svg>
  );
}

// ── Dismissals pill — bold stumps splaying apart ──────────────────────────────
export function StumpsExploding({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22">
      {/* Left stump — tilted left */}
      <G origin="5 19" rotation={-22}>
        <Rect x="3"  y="5" width="4" height="14" rx="2" fill={CREAM} />
      </G>
      {/* Centre stump — straight */}
      <Rect x="9" y="4" width="4" height="15" rx="2" fill={CREAM} />
      {/* Right stump — tilted right */}
      <G origin="17 19" rotation={22}>
        <Rect x="15" y="5" width="4" height="14" rx="2" fill={CREAM} />
      </G>
      {/* Bail left — flying */}
      <G origin="6 5" rotation={-30}>
        <Rect x="2" y="3" width="7" height="2.5" rx="1.25" fill={CREAM} />
      </G>
      {/* Bail right — flying */}
      <G origin="16 5" rotation={30}>
        <Rect x="13" y="3" width="7" height="2.5" rx="1.25" fill={CREAM} />
      </G>
      {/* Cricket ball */}
      <Circle cx="3" cy="18" r="3.5" fill={RED} />
    </Svg>
  );
}

// ── Match Types pill — top-down pitch ────────────────────────────────────────
export function CricketPitch({ size = 20 }: { size?: number }) {
  const w = (size / 24) * 14;
  return (
    <Svg width={w} height={size} viewBox="0 0 14 24">
      {/* Outfield */}
      <Rect x="0" y="0" width="14" height="24" rx="2" fill="#7f1d1d" />
      {/* Pitch strip */}
      <Rect x="4" y="0" width="6" height="24" fill="#C8A84B" />
      {/* Creases */}
      <Rect x="4" y="5"  width="6" height="1" fill="white" opacity={0.8} />
      <Rect x="4" y="18" width="6" height="1" fill="white" opacity={0.8} />
      {/* Top stumps — 3 bold lines */}
      <Rect x="4.8" y="1"  width="1.2" height="3.5" rx="0.6" fill={CREAM} />
      <Rect x="6.4" y="1"  width="1.2" height="3.5" rx="0.6" fill={CREAM} />
      <Rect x="8.0" y="1"  width="1.2" height="3.5" rx="0.6" fill={CREAM} />
      {/* Bottom stumps */}
      <Rect x="4.8" y="19.5" width="1.2" height="3.5" rx="0.6" fill={CREAM} />
      <Rect x="6.4" y="19.5" width="1.2" height="3.5" rx="0.6" fill={CREAM} />
      <Rect x="8.0" y="19.5" width="1.2" height="3.5" rx="0.6" fill={CREAM} />
    </Svg>
  );
}

// ── Head-to-Head pill — two bold caps facing inward ───────────────────────────
export function TwoCricketCaps({ size = 22 }: { size?: number }) {
  const h = (size / 32) * 16;
  return (
    <Svg width={size} height={h} viewBox="0 0 32 16">
      {/* Left cap dome — solid bold shape */}
      <Path d="M 1,13 C 1,3 4,0.5 8.5,1 C 13,1.5 14.5,6 14.5,13 Z" fill={RED} />
      {/* Left brim */}
      <Path d="M 13,13 L 17.5,14.5 L 16,15.8 L 13,14.5 Z" fill="#96281B" />
      {/* Right cap dome */}
      <Path d="M 31,13 C 31,3 28,0.5 23.5,1 C 19,1.5 17.5,6 17.5,13 Z" fill={RED} />
      {/* Right brim */}
      <Path d="M 19,13 L 14.5,14.5 L 16,15.8 L 19,14.5 Z" fill="#96281B" />
      {/* Left badge dot */}
      <Circle cx="12"  cy="7.5" r="1.8" fill={CREAM} />
      {/* Right badge dot */}
      <Circle cx="20"  cy="7.5" r="1.8" fill={CREAM} />
    </Svg>
  );
}
