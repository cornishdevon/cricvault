import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAudioPlayer } from "expo-audio";
import Svg, { Circle, ClipPath, Defs, Ellipse, LinearGradient, RadialGradient, Stop, Line, Rect, G, TSpan, Text as SvgText } from "react-native-svg";
import type { BattingHand } from "@/contexts/PlayerNameContext";

export type WheelShot = { x: number; y: number; runs: 1 | 2 | 4 | 6 };

// Slightly larger canvas so sixes that exceed the boundary don't get clipped
const FIELD_SIZE = 310;
const CX = FIELD_SIZE / 2;
const CY = FIELD_SIZE / 2;
const FIELD_R  = FIELD_SIZE / 2 - 14;   // boundary radius
const PITCH_R  = 14;
const DOT_R    = 8;                      // endpoint circle radius
const HIT_R    = 18;                     // drag/tap hit-test radius
const SIX_MAX  = FIELD_R * 1.18;        // sixes go just beyond the rope
// Pad the viewport, not the stored coordinate system, so six handles remain visible.
const VIEW_PADDING = 24;
const VIEW_SIZE = FIELD_SIZE + VIEW_PADDING * 2;

// Max reach per run type
function maxDist(runs: 1 | 2 | 4 | 6): number {
  if (runs === 6) return SIX_MAX;
  if (runs === 4) return FIELD_R;
  if (runs === 2) return FIELD_R * 0.72;
  return FIELD_R * 0.52;
}

// Where a new shot's endpoint is snapped to on placement
function snapDist(runs: 1 | 2 | 4 | 6, tapped: number): number {
  if (runs === 6) return SIX_MAX;
  if (runs === 4) return FIELD_R;
  return Math.min(maxDist(runs), Math.max(PITCH_R + 8, tapped));
}

function shotColor(runs: 1 | 2 | 4 | 6): string {
  if (runs === 6) return "#7C3AED";
  if (runs === 4) return "#EB6B3D";
  if (runs === 2) return "#3686C5";
  return "#839197";
}

interface Props {
  shots: WheelShot[];
  onShotsChange?: (shots: WheelShot[]) => void;
  battingHand?: BattingHand;
  readOnly?: boolean;
}

const RUN_OPTS: (1 | 2 | 4 | 6)[] = [1, 2, 4, 6];
const RUN_LABELS: Record<number, string> = { 1: "1 run", 2: "2 runs", 4: "Four", 6: "Six" };

// Right-handed batter at the top facing down the pitch: off side on the left.
const SHOT_LABELS = [
  { label: "Lucky edge", x: 155, y: 44 },
  { label: "Scoop", x: 195, y: 29 },
  { label: "Reverse sweep", x: 112, y: 40 },
  { label: "Leg glance", x: 213, y: 58 },
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

const BATTING_ORIGIN = { x: CX, y: CY - 25 };

function angularDistance(a: number, b: number): number {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

function getShotLabels(battingHand: BattingHand) {
  if (battingHand === "right") return SHOT_LABELS;
  return SHOT_LABELS.map((label) => ({ ...label, x: 2 * CX - label.x }));
}

function getNearestShotLabel(x: number, y: number, shotLabels: typeof SHOT_LABELS): string {
  const shotAngle = Math.atan2(y - BATTING_ORIGIN.y, x - BATTING_ORIGIN.x);
  let nearestLabel = "";
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const label of shotLabels) {
    const labelAngle = Math.atan2(label.y - BATTING_ORIGIN.y, label.x - BATTING_ORIGIN.x);
    const distance = angularDistance(shotAngle, labelAngle);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestLabel = label.label;
    }
  }

  return nearestLabel;
}

// Bisect the label directions at the top batting crease, then intersect
// each dividing ray with the circular boundary.
function getShotSectionEdges(shotLabels: typeof SHOT_LABELS) {
  const originY = CY - 25;
  const angles = shotLabels.map(({ x, y }) => Math.atan2(y - originY, x - CX))
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
}

export function WagonWheel({
  shots,
  onShotsChange,
  battingHand = "right",
  readOnly = false,
}: Props) {
  const svgId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const stageWidth = useRef(VIEW_SIZE);
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number; tappedDist: number } | null>(null);
  const [chooseOpen, setChooseOpen]     = useState(false);
  const [mooVisible, setMooVisible]     = useState(false);
  const [mooRuns, setMooRuns] = useState<4 | 6>(6);
  const [fourVisible, setFourVisible] = useState(false);
  const [fourMessage, setFourMessage] = useState("FOUR!");
  const [boundaryRuns, setBoundaryRuns] = useState<4 | 6>(4);
  const fourAnim = useRef(new Animated.Value(0)).current;
  const fourTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fourSequence = useRef(0);
  const mooAnim = useRef(new Animated.Value(0)).current;
  const mooTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mooSequence = useRef(0);
  const mooPlayer = useAudioPlayer(require("../assets/sounds/cow-moo.mp3"));
  const shotLabels = useMemo(() => getShotLabels(battingHand), [battingHand]);
  const shotSectionEdges = useMemo(() => getShotSectionEdges(shotLabels), [shotLabels]);

  useEffect(() => () => {
    fourSequence.current += 1;
    if (fourTimer.current) clearTimeout(fourTimer.current);
    fourAnim.stopAnimation();
    mooSequence.current += 1;
    if (mooTimer.current) clearTimeout(mooTimer.current);
    mooAnim.stopAnimation();
  }, []);

  useEffect(() => {
    if (readOnly) {
      setChooseOpen(false);
      setPendingPoint(null);
      fourSequence.current += 1;
      if (fourTimer.current) clearTimeout(fourTimer.current);
      fourAnim.stopAnimation();
      setFourVisible(false);
      mooSequence.current += 1;
      if (mooTimer.current) clearTimeout(mooTimer.current);
      mooAnim.stopAnimation();
      setMooVisible(false);
      mooPlayer.pause();
    }
  }, [readOnly]);

  function celebrateBoundary(message: string, runs: 4 | 6) {
    setFourMessage(message);
    setBoundaryRuns(runs);
    const sequence = ++fourSequence.current;
    if (fourTimer.current) clearTimeout(fourTimer.current);
    fourAnim.stopAnimation();
    fourAnim.setValue(0);
    setFourVisible(true);
    Animated.spring(fourAnim, {
      toValue: 1,
      friction: 5,
      tension: 130,
      useNativeDriver: true,
    }).start();
    fourTimer.current = setTimeout(() => {
      Animated.timing(fourAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && sequence === fourSequence.current) setFourVisible(false);
      });
    }, 1500);
  }

  async function celebrateCowCorner(runs: 4 | 6) {
    setMooRuns(runs);
    const sequence = ++mooSequence.current;
    if (mooTimer.current) clearTimeout(mooTimer.current);
    mooAnim.stopAnimation();
    mooAnim.setValue(0);
    try {
      mooPlayer.pause();
      await mooPlayer.seekTo(0);
      if (sequence !== mooSequence.current) return;
      mooPlayer.play();
    } catch (error) {
      console.warn("Cow-corner audio could not play", error);
    }
    if (sequence !== mooSequence.current) return;
    setMooVisible(true);
    Animated.spring(mooAnim, {
      toValue: 1,
      friction: 5,
      tension: 130,
      useNativeDriver: true,
    }).start();
    mooTimer.current = setTimeout(() => {
      Animated.timing(mooAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && sequence === mooSequence.current) setMooVisible(false);
      });
    }, 1800);
  }

  // Refs so PanResponder handlers never capture stale values
  const shotsRef         = useRef(shots);
  shotsRef.current       = shots;
  const onChangeRef      = useRef<Props["onShotsChange"]>(onShotsChange);
  onChangeRef.current    = onShotsChange;
  const readOnlyRef      = useRef(readOnly);
  readOnlyRef.current    = readOnly;
  const editable          = !readOnly && !!onShotsChange;

  const draggingIdx      = useRef<number | null>(null);
  const touchStart       = useRef<{ x: number; y: number } | null>(null);
  const didDrag          = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: (evt) => {
        if (readOnlyRef.current || !onChangeRef.current) return;
        const lx = evt.nativeEvent.locationX * VIEW_SIZE / stageWidth.current - VIEW_PADDING;
        const ly = evt.nativeEvent.locationY * VIEW_SIZE / stageWidth.current - VIEW_PADDING;
        touchStart.current  = { x: lx, y: ly };
        didDrag.current     = false;
        draggingIdx.current = null;

        // Find nearest shot endpoint within hit radius
        const current = shotsRef.current;
        for (let i = 0; i < current.length; i++) {
          const sx = current[i].x * FIELD_SIZE;
          const sy = current[i].y * FIELD_SIZE;
          if (Math.sqrt((lx - sx) ** 2 + (ly - sy) ** 2) < HIT_R) {
            draggingIdx.current = i;
            return;
          }
        }
      },

      onPanResponderMove: (evt) => {
        if (readOnlyRef.current || !onChangeRef.current) return;
        const idx = draggingIdx.current;
        if (idx === null) return;

        const lx = evt.nativeEvent.locationX * VIEW_SIZE / stageWidth.current - VIEW_PADDING;
        const ly = evt.nativeEvent.locationY * VIEW_SIZE / stageWidth.current - VIEW_PADDING;
        const start = touchStart.current;
        if (start && Math.sqrt((lx - start.x) ** 2 + (ly - start.y) ** 2) > 4) {
          didDrag.current = true;
        }

        const shot  = shotsRef.current[idx];
        const dx    = lx - CX;
        const dy    = ly - CY;
        const angle = Math.atan2(dy, dx);
        const raw   = Math.sqrt(dx * dx + dy * dy);
        const dist  = Math.min(maxDist(shot.runs), Math.max(PITCH_R + 6, raw));

        const newShots = [...shotsRef.current];
        newShots[idx]  = {
          ...shot,
          x: (CX + Math.cos(angle) * dist) / FIELD_SIZE,
          y: (CY + Math.sin(angle) * dist) / FIELD_SIZE,
        };
        onChangeRef.current?.(newShots);
      },

      onPanResponderRelease: (evt) => {
        if (readOnlyRef.current || !onChangeRef.current) return;
        const lx = evt.nativeEvent.locationX * VIEW_SIZE / stageWidth.current - VIEW_PADDING;
        const ly = evt.nativeEvent.locationY * VIEW_SIZE / stageWidth.current - VIEW_PADDING;
        const idx  = draggingIdx.current;
        const drag = didDrag.current;
        draggingIdx.current = null;
        didDrag.current     = false;

        if (idx !== null) {
          // Tap (no drag) on an existing shot → delete it
          if (!drag) {
            onChangeRef.current?.(shotsRef.current.filter((_, i) => i !== idx));
          }
          return;
        }

        // Tap on empty field → new shot
        const start = touchStart.current;
        if (start && Math.sqrt((lx - start.x) ** 2 + (ly - start.y) ** 2) > 8) return;

        const dx   = lx - CX;
        const dy   = ly - CY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < PITCH_R + 4 || dist > SIX_MAX + 6) return;

        setPendingPoint({ x: lx / FIELD_SIZE, y: ly / FIELD_SIZE, tappedDist: dist });
        setChooseOpen(true);
      },
    })
  ).current;

  function confirmShot(runs: 1 | 2 | 4 | 6) {
    if (readOnly || !onChangeRef.current || !pendingPoint) return;
    const dx    = pendingPoint.x * FIELD_SIZE - CX;
    const dy    = pendingPoint.y * FIELD_SIZE - CY;
    const angle = Math.atan2(dy, dx);
    const dist  = snapDist(runs, pendingPoint.tappedDist);
    const x = CX + Math.cos(angle) * dist;
    const y = CY + Math.sin(angle) * dist;
    onChangeRef.current?.([...shotsRef.current, {
      x: x / FIELD_SIZE,
      y: y / FIELD_SIZE,
      runs,
    }]);
    const cowCorner = getNearestShotLabel(x, y, shotLabels) === "Slog";
    if ((runs === 4 || runs === 6) && !cowCorner) {
      // Match the deliberately narrow, directly-behind Lucky Edge sector.
      // This sector is centred behind the crease for either batting hand.
      const angleFromCrease = Math.atan2(y - BATTING_ORIGIN.y, x - BATTING_ORIGIN.x);
      const luckyEdge = angularDistance(angleFromCrease, -Math.PI / 2) <= 0.28;
      const shotLabel = getNearestShotLabel(x, y, shotLabels);
      const messages: Record<string, string> = {
        "On drive": "classy!",
        "Straight drive": "beautiful shot!",
        "Cover drive": "fine shot!",
        "Leg glance": "delicately played!",
        "Scoop": "show off!",
        "Reverse sweep": "cheeky!",
        "Pull / Hook": "can't bowl there",
        "Flick": "well played",
        "Leading edge": "jammy thing!",
        "Late cut": "touch of class",
        "Cut": "awesome",
        "Square drive": "lovely stroke",
        "Sweep": "dominating",
      };
      const sixMessages = [
        "powerful shot!",
        "good bat you have there",
        "right out of the middle",
      ];
      const message = runs === 6
        ? shotLabel === "Straight drive"
          ? "that's huge!"
          : sixMessages[Math.floor(Math.random() * sixMessages.length)]
        : luckyEdge ? "says 4 in the book!" : messages[shotLabel] ?? "FOUR!";
      celebrateBoundary(message, runs);
    }
    if ((runs === 4 || runs === 6) && cowCorner) void celebrateCowCorner(runs);
    setChooseOpen(false);
    setPendingPoint(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>CRICVAULT · SHOT MAP</Text>
        <Text style={styles.hand}>{battingHand === "left" ? "Left-handed" : "Right-handed"}</Text>
      </View>
      <View style={styles.legend}>
        {RUN_OPTS.map((r) => (
          <View key={r} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: shotColor(r) }]} />
            <Text style={styles.legendText}>{RUN_LABELS[r]}</Text>
          </View>
        ))}
      </View>

      {/* PanResponder View wraps the SVG */}
      <View
        style={styles.stage}
        onLayout={(event) => { stageWidth.current = event.nativeEvent.layout.width; }}
        {...(editable ? panResponder.panHandlers : {})}
      >
        <Svg pointerEvents="none" width="100%" height="100%" viewBox={`${-VIEW_PADDING} ${-VIEW_PADDING} ${VIEW_SIZE} ${VIEW_SIZE}`}>
          <Defs>
            <RadialGradient id={`${svgId}grass`} cx="42%" cy="32%" r="74%">
              <Stop offset="0%" stopColor="#8BB957" />
              <Stop offset="62%" stopColor="#528D45" />
              <Stop offset="100%" stopColor="#2F6841" />
            </RadialGradient>
            <LinearGradient id={`${svgId}pitch`} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#B6854F" />
              <Stop offset="43%" stopColor="#E2BB7B" />
              <Stop offset="100%" stopColor="#A87342" />
            </LinearGradient>
            <ClipPath id={`${svgId}field`}>
              <Circle cx={CX} cy={CY} r={FIELD_R} />
            </ClipPath>
          </Defs>
          {/* Six-zone shading just beyond boundary */}
          <Circle cx={CX} cy={CY} r={SIX_MAX} fill="#7C3AED" fillOpacity={0.04} stroke="#7C3AED" strokeWidth={1} strokeDasharray="2 4" />
          {/* Outfield */}
          <Circle cx={CX} cy={CY + 5} r={FIELD_R + 3} fill="#2A5432" opacity={0.18} />
          <Circle cx={CX} cy={CY} r={FIELD_R} fill={`url(#${svgId}grass)`} />
          <G clipPath={`url(#${svgId}field)`}>
            {Array.from({ length: 9 }, (_, i) => (
              <Rect key={i} x={i * 36} y={0} width={18} height={FIELD_SIZE} fill="#D6EB8C" opacity={0.1} />
            ))}
            <Ellipse cx={CX - 58} cy={CY - 72} rx={106} ry={35} fill="#D7ED9C" opacity={0.09} rotation={-25} origin={`${CX - 58}, ${CY - 72}`} />
            <Ellipse cx={CX + 68} cy={CY + 85} rx={130} ry={40} fill="#183F31" opacity={0.13} rotation={-25} origin={`${CX + 68}, ${CY + 85}`} />
          </G>
          {/* Layered cream rope with alternating twists around the boundary. */}
          <Circle cx={CX} cy={CY} r={FIELD_R} fill="none" stroke="#76502E" strokeWidth={6.5} opacity={0.8} />
          <Circle cx={CX} cy={CY} r={FIELD_R} fill="none" stroke="#F5DD9C" strokeWidth={4.3} />
          <Circle cx={CX} cy={CY} r={FIELD_R} fill="none" stroke="#B78B52" strokeWidth={2} strokeDasharray="1 4.2" />
          {/* Inner circle */}
          <Ellipse cx={CX} cy={CY} rx={FIELD_R * 0.6} ry={FIELD_R * 0.6} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
          {shotSectionEdges.map(({ x, y }, i) => (
            <Line key={`section-${i}`} x1={CX} y1={CY - 25} x2={x} y2={y}
              stroke="#F6BC7D" strokeWidth={1} strokeOpacity={0.9} />
          ))}
          {shotLabels.map(({ label, x, y }) => (
            <SvgText key={label} x={x} y={y} textAnchor="middle" fontSize={8.7} fill="#000000" fontWeight="700">
              {label === "Lucky edge" || label === "Leg glance" || label === "Leading edge" || label === "Reverse sweep" ? (
                <>
                  <TSpan x={x} y={y - 5}>{label.split(" ")[0]}</TSpan>
                  <TSpan x={x} y={y + 5}>{label.split(" ")[1]}</TSpan>
                </>
              ) : label}
            </SvgText>
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
              <G key={i}>
                {/* Dashed extension line for sixes beyond boundary */}
                {isSix && (
                  <Line
                    x1={sx0} y1={sy0} x2={sx} y2={sy}
                    stroke={color} strokeWidth={1.5} strokeOpacity={0.35}
                    strokeDasharray="4 3"
                  />
                )}
                <Line x1={sx0} y1={sy0} x2={sx} y2={sy} stroke={color} strokeWidth={2.5} strokeOpacity={isSix ? 0.7 : 0.85} />
                {/* Endpoint dot (drag handle) */}
                <Circle cx={sx} cy={sy} r={DOT_R + 2} fill={color} fillOpacity={0.18} />
                <Circle cx={sx} cy={sy} r={DOT_R} fill={color} fillOpacity={0.95} />
                <SvgText x={sx} y={sy + 3.5} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="700">
                  {shot.runs}
                </SvgText>
              </G>
            );
          })}
          {/* Centred vertical pitch, drawn above shots to keep wickets visible. */}
          <Rect x={CX - 11} y={CY - 30} width={24} height={66} rx={3} fill="#34472A" opacity={0.3} />
          <Rect x={CX - 10} y={CY - 32} width={20} height={64} rx={2} fill={`url(#${svgId}pitch)`} stroke="#8C5E32" strokeWidth={1} />
          {[-1, 1].map((end) => (
            <G key={end}>
              <Line x1={CX - 13} y1={CY + end * 22} x2={CX + 13} y2={CY + end * 22} stroke="#FFFFFF" strokeWidth={1.5} />
              {[-3, 0, 3].map((offset) => (
                <Line key={offset} x1={CX + offset} y1={CY + end * 25} x2={CX + offset} y2={CY + end * 30} stroke="#54351D" strokeWidth={1.5} />
              ))}
              <Line x1={CX - 4} y1={CY + (end === 1 ? 25 : -30)} x2={CX + 4} y2={CY + (end === 1 ? 25 : -30)} stroke="#54351D" strokeWidth={1.5} />
            </G>
          ))}
        </Svg>
        {fourVisible && (
          <Animated.View
            pointerEvents="none"
            accessibilityLiveRegion="polite"
            accessibilityLabel={`${fourMessage} ${boundaryRuns === 6 ? "Six" : "Four"}`}
            style={[
              styles.fourBadge,
              {
                opacity: fourAnim,
                transform: [
                  { scale: fourAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
                  { translateY: fourAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
                ],
              },
            ]}
          >
            <Text style={[styles.fourText, fourMessage !== "FOUR!" && styles.fourMessage]}>{fourMessage}</Text>
            <Text style={styles.fourSubtext}>{boundaryRuns === 6 ? "SIX" : "BOUNDARY"}</Text>
          </Animated.View>
        )}
        {mooVisible && (
          <Animated.View
            pointerEvents="none"
            accessibilityLiveRegion="assertive"
            accessibilityLabel={`Moo! ${mooRuns === 4 ? "Four" : "Six"} into cow corner`}
            style={[
              styles.mooBadge,
              {
                opacity: mooAnim,
                transform: [
                  { scale: mooAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
                  { rotate: "-5deg" },
                ],
              },
            ]}
          >
            <Text style={styles.mooCow}>🐄</Text>
            <View>
              <Text style={styles.mooText}>MOO!</Text>
              <Text style={styles.mooSubtext}>COW CORNER {mooRuns === 4 ? "FOUR" : "SIX"}</Text>
            </View>
          </Animated.View>
        )}
      </View>

      <Text style={styles.caption}>From the crease, every inning has its own story.</Text>
      {editable && (
        <Text style={styles.hint}>
          Tap field to add · Drag dot to lengthen · Tap dot to remove
        </Text>
      )}

      {editable && shots.length > 0 && (
        <TouchableOpacity onPress={() => onChangeRef.current?.([])} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Clear all shots</Text>
        </TouchableOpacity>
      )}

      {/* Run picker modal */}
      <Modal
        visible={chooseOpen && editable}
        transparent
        animationType="fade"
        onRequestClose={() => { setChooseOpen(false); setPendingPoint(null); }}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => { setChooseOpen(false); setPendingPoint(null); }}
        >
          <View style={styles.picker}>
            <Text style={styles.pickerTitle}>How many runs?</Text>
            <View style={styles.pickerRow}>
              {RUN_OPTS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.pickerBtn, { backgroundColor: shotColor(r) }]}
                  onPress={() => confirmShot(r)}
                >
                  <Text style={styles.pickerBtnLabel}>{String(r)}</Text>
                  <Text style={styles.pickerBtnSub}>{RUN_LABELS[r]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.pickerHint}>Fours snap to boundary · Sixes go beyond</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { alignItems: "center", paddingVertical: 16, paddingHorizontal: 8, backgroundColor: "#F0E5C7", borderRadius: 20, borderWidth: 1, borderColor: "#E0D2AC", width: "100%" },
  heading:        { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, paddingHorizontal: 4 },
  eyebrow:        { fontSize: 8, letterSpacing: 0.8, color: "#53705A", fontFamily: "Inter_600SemiBold" },
  hand:           { fontSize: 10, color: "#53705A", fontFamily: "Inter_400Regular" },
  stage:          { width: "100%", maxWidth: VIEW_SIZE, aspectRatio: 1 },
  fourBadge:      { position: "absolute", top: "17%", alignSelf: "center", alignItems: "center", paddingVertical: 10, paddingHorizontal: 26, borderRadius: 18, backgroundColor: "#FFF3CF", borderWidth: 2, borderColor: "#EB6B3D", elevation: 6 },
  fourText:       { color: "#A53715", fontSize: 30, lineHeight: 34, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  fourMessage:    { fontSize: 18, lineHeight: 24, letterSpacing: 0, textAlign: "center" },
  fourSubtext:    { color: "#A53715", fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  caption:        { fontSize: 10, color: "#5C7051", textAlign: "center", fontFamily: "Inter_400Regular", marginTop: 4 },
  legend:         { flexDirection: "row", gap: 12, marginBottom: 10, flexWrap: "wrap", justifyContent: "center" },
  mooBadge:       { position: "absolute", top: 134, left: 62, right: 62, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, backgroundColor: "#FFF3CF", borderWidth: 2, borderColor: "#8B5E24", shadowColor: "#2A1808", shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  mooCow:         { fontSize: 28 },
  mooText:        { color: "#5A3516", fontSize: 20, lineHeight: 21, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  mooSubtext:     { color: "#7A5125", fontSize: 8, lineHeight: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  legendItem:     { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:      { width: 10, height: 10, borderRadius: 5 },
  legendText:     { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555" },
  hint:           { marginTop: 8, fontSize: 10, fontFamily: "Inter_400Regular", color: "#56664D", textAlign: "center" },
  clearBtn:       { marginTop: 8, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#ccc" },
  clearBtnText:   { fontSize: 12, fontFamily: "Inter_500Medium", color: "#888" },
  overlay:        { flex: 1, backgroundColor: "#00000055", alignItems: "center", justifyContent: "center" },
  picker:         { backgroundColor: "#fff", borderRadius: 16, padding: 20, width: 290, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  pickerTitle:    { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#1A2520", marginBottom: 14 },
  pickerRow:      { flexDirection: "row", gap: 10 },
  pickerBtn:      { width: 56, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  pickerBtnLabel: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: "#fff" },
  pickerBtnSub:   { fontSize: 8, fontFamily: "Inter_400Regular", color: "#ffffffCC" },
  pickerHint:     { marginTop: 12, fontSize: 10, fontFamily: "Inter_400Regular", color: "#999" },
});
