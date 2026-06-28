import React from "react";
import Svg, { Circle, G, Line, Path, Polygon, Rect } from "react-native-svg";

// ── Standalone cricket ball ───────────────────────────────────────────────────
export function CricketBallSvg({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx="20" cy="20" r="19" fill={RED} />
      {/* Upper seam arc */}
      <Path d="M 6,18 C 10,12 30,12 34,18" stroke={CREAM} strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.8} />
      {/* Lower seam arc */}
      <Path d="M 6,22 C 10,28 30,28 34,22" stroke={CREAM} strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.8} />
      {/* Stitch marks upper */}
      <Line x1="11" y1="15" x2="11" y2="18" stroke={CREAM} strokeWidth="1.3" opacity={0.65} strokeLinecap="round" />
      <Line x1="17" y1="13" x2="17" y2="16" stroke={CREAM} strokeWidth="1.3" opacity={0.65} strokeLinecap="round" />
      <Line x1="23" y1="13" x2="23" y2="16" stroke={CREAM} strokeWidth="1.3" opacity={0.65} strokeLinecap="round" />
      <Line x1="29" y1="15" x2="29" y2="18" stroke={CREAM} strokeWidth="1.3" opacity={0.65} strokeLinecap="round" />
      {/* Stitch marks lower */}
      <Line x1="11" y1="22" x2="11" y2="25" stroke={CREAM} strokeWidth="1.3" opacity={0.65} strokeLinecap="round" />
      <Line x1="17" y1="24" x2="17" y2="27" stroke={CREAM} strokeWidth="1.3" opacity={0.65} strokeLinecap="round" />
      <Line x1="23" y1="24" x2="23" y2="27" stroke={CREAM} strokeWidth="1.3" opacity={0.65} strokeLinecap="round" />
      <Line x1="29" y1="22" x2="29" y2="25" stroke={CREAM} strokeWidth="1.3" opacity={0.65} strokeLinecap="round" />
    </Svg>
  );
}

// ── Hands about to catch a cricket ball ───────────────────────────────────────
export function CatchingHandsSvg({ size = 24 }: { size?: number }) {
  const SKIN = "#C89060";
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* Ball dropping */}
      <Circle cx="24" cy="9" r="8" fill={RED} />
      <Path d="M 17,9 C 19,6 29,6 31,9"  stroke={CREAM} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.75} />
      <Path d="M 17,9 C 19,12 29,12 31,9" stroke={CREAM} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.75} />
      {/* Left hand — palm arc */}
      <Path d="M 3,44 C 3,36 7,28 14,26" stroke={SKIN} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      {/* Left fingers */}
      <Path d="M 14,26 L 11,19" stroke={SKIN} strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M 16,25 L 15,18" stroke={SKIN} strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M 18,24.5 L 18,17" stroke={SKIN} strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M 20,24.5 L 21,18" stroke={SKIN} strokeWidth="3.5" strokeLinecap="round" />
      {/* Right hand — palm arc */}
      <Path d="M 45,44 C 45,36 41,28 34,26" stroke={SKIN} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      {/* Right fingers */}
      <Path d="M 34,26 L 37,19" stroke={SKIN} strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M 32,25 L 33,18" stroke={SKIN} strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M 30,24.5 L 30,17" stroke={SKIN} strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M 28,24.5 L 27,18" stroke={SKIN} strokeWidth="3.5" strokeLinecap="round" />
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
