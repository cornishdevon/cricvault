import React, { useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Ellipse, Line, G, Text as SvgText } from "react-native-svg";

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

const FIELD_LABELS: { label: string; angle: number; r: number }[] = [
  { label: "Fine Leg",   angle: 160, r: 0.76 },
  { label: "Square Leg", angle: 130, r: 0.76 },
  { label: "Mid-wicket", angle: 105, r: 0.76 },
  { label: "Mid-on",     angle:  80, r: 0.76 },
  { label: "Mid-off",    angle:  60, r: 0.76 },
  { label: "Cover",      angle:  40, r: 0.76 },
  { label: "Point",      angle:  15, r: 0.76 },
  { label: "Gully",      angle:  -5, r: 0.70 },
  { label: "Slip",       angle: -20, r: 0.60 },
  { label: "Third Man",  angle: -40, r: 0.74 },
];

function shotColor(runs: 1 | 2 | 4 | 6): string {
  if (runs === 6) return "#FFB300";
  if (runs === 4) return "#1B5E2B";
  if (runs === 2) return "#1565C0";
  return "#757575";
}

function deg2rad(deg: number) { return (deg * Math.PI) / 180; }

function labelPos(angle: number, r: number) {
  const rad = deg2rad(angle);
  return { x: CX + FIELD_R * r * Math.cos(rad), y: CY - FIELD_R * r * Math.sin(rad) };
}

interface Props {
  shots: WheelShot[];
  onShotsChange: (shots: WheelShot[]) => void;
}

const RUN_OPTS: (1 | 2 | 4 | 6)[] = [1, 2, 4, 6];
const RUN_LABELS: Record<number, string> = { 1: "1 run", 2: "2 runs", 4: "Four", 6: "Six" };

export function WagonWheel({ shots, onShotsChange }: Props) {
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number; tappedDist: number } | null>(null);
  const [chooseOpen, setChooseOpen]     = useState(false);

  // Refs so PanResponder handlers never capture stale values
  const shotsRef         = useRef(shots);
  shotsRef.current       = shots;
  const onChangeRef      = useRef(onShotsChange);
  onChangeRef.current    = onShotsChange;

  const draggingIdx      = useRef<number | null>(null);
  const touchStart       = useRef<{ x: number; y: number } | null>(null);
  const didDrag          = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: (evt) => {
        const { locationX: lx, locationY: ly } = evt.nativeEvent;
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
        const idx = draggingIdx.current;
        if (idx === null) return;

        const { locationX: lx, locationY: ly } = evt.nativeEvent;
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
        onChangeRef.current(newShots);
      },

      onPanResponderRelease: (evt) => {
        const { locationX: lx, locationY: ly } = evt.nativeEvent;
        const idx  = draggingIdx.current;
        const drag = didDrag.current;
        draggingIdx.current = null;
        didDrag.current     = false;

        if (idx !== null) {
          // Tap (no drag) on an existing shot → delete it
          if (!drag) {
            onChangeRef.current(shotsRef.current.filter((_, i) => i !== idx));
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
    if (!pendingPoint) return;
    const dx    = pendingPoint.x * FIELD_SIZE - CX;
    const dy    = pendingPoint.y * FIELD_SIZE - CY;
    const angle = Math.atan2(dy, dx);
    const dist  = snapDist(runs, pendingPoint.tappedDist);
    onShotsChange([...shots, {
      x: (CX + Math.cos(angle) * dist) / FIELD_SIZE,
      y: (CY + Math.sin(angle) * dist) / FIELD_SIZE,
      runs,
    }]);
    setChooseOpen(false);
    setPendingPoint(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.legend}>
        {RUN_OPTS.map((r) => (
          <View key={r} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: shotColor(r) }]} />
            <Text style={styles.legendText}>{RUN_LABELS[r]}</Text>
          </View>
        ))}
      </View>

      {/* PanResponder View wraps the SVG */}
      <View {...panResponder.panHandlers}>
        <Svg width={FIELD_SIZE} height={FIELD_SIZE} overflow="visible">
          {/* Six-zone shading just beyond boundary */}
          <Ellipse cx={CX} cy={CY} rx={SIX_MAX} ry={SIX_MAX} fill="#FFB30008" stroke="#FFB30030" strokeWidth={1} strokeDasharray="3 4" />
          {/* Outfield */}
          <Ellipse cx={CX} cy={CY} rx={FIELD_R} ry={FIELD_R} fill="#4CAF5022" stroke="#4CAF50" strokeWidth={1.5} />
          {/* Inner circle */}
          <Ellipse cx={CX} cy={CY} rx={FIELD_R * 0.5} ry={FIELD_R * 0.5} fill="none" stroke="#4CAF5055" strokeWidth={1} strokeDasharray="4 3" />
          {/* Pitch */}
          <Circle cx={CX} cy={CY} r={PITCH_R} fill="#C8A96E" stroke="#A07040" strokeWidth={1} />
          <Line x1={CX - PITCH_R + 2} y1={CY - 5} x2={CX + PITCH_R - 2} y2={CY - 5} stroke="#A07040" strokeWidth={1} />
          <Line x1={CX - PITCH_R + 2} y1={CY + 5} x2={CX + PITCH_R - 2} y2={CY + 5} stroke="#A07040" strokeWidth={1} />

          {/* Field labels */}
          {FIELD_LABELS.map(({ label, angle, r }) => {
            const pos = labelPos(angle, r);
            return (
              <SvgText key={label} x={pos.x} y={pos.y} textAnchor="middle" fontSize={7.5} fill="#33691E" fontWeight="500">
                {label}
              </SvgText>
            );
          })}

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
        </Svg>
      </View>

      <Text style={styles.hint}>
        Tap field to add · Drag dot to lengthen · Tap dot to remove
      </Text>

      {shots.length > 0 && (
        <TouchableOpacity onPress={() => onShotsChange([])} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Clear all shots</Text>
        </TouchableOpacity>
      )}

      {/* Run picker modal */}
      <Modal
        visible={chooseOpen}
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
  container:      { alignItems: "center", paddingVertical: 8 },
  legend:         { flexDirection: "row", gap: 12, marginBottom: 10, flexWrap: "wrap", justifyContent: "center" },
  legendItem:     { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:      { width: 10, height: 10, borderRadius: 5 },
  legendText:     { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555" },
  hint:           { marginTop: 8, fontSize: 11, fontFamily: "Inter_400Regular", color: "#888", textAlign: "center" },
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
