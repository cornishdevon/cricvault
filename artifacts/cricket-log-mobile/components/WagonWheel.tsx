import React, { useRef, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Ellipse, Line, G, Text as SvgText } from "react-native-svg";

export type WheelShot = { x: number; y: number; runs: 1 | 2 | 4 | 6 };

const FIELD_SIZE = 290;
const CX = FIELD_SIZE / 2;
const CY = FIELD_SIZE / 2;
const FIELD_RX = FIELD_SIZE / 2 - 8;
const FIELD_RY = FIELD_SIZE / 2 - 8;
const PITCH_R = 14;

const FIELD_LABELS: { label: string; angle: number; r: number }[] = [
  { label: "Fine Leg", angle: 160, r: 0.78 },
  { label: "Square Leg", angle: 130, r: 0.78 },
  { label: "Mid-wicket", angle: 105, r: 0.78 },
  { label: "Mid-on", angle: 80, r: 0.78 },
  { label: "Mid-off", angle: 60, r: 0.78 },
  { label: "Cover", angle: 40, r: 0.78 },
  { label: "Point", angle: 15, r: 0.78 },
  { label: "Gully", angle: -5, r: 0.72 },
  { label: "Slip", angle: -20, r: 0.62 },
  { label: "Third Man", angle: -40, r: 0.76 },
];

function shotColor(runs: 1 | 2 | 4 | 6): string {
  if (runs === 6) return "#FFB300";
  if (runs === 4) return "#1B5E2B";
  if (runs === 2) return "#1565C0";
  return "#757575";
}

function deg2rad(deg: number) {
  return (deg * Math.PI) / 180;
}

function labelPos(angle: number, r: number) {
  const rad = deg2rad(angle);
  return {
    x: CX + FIELD_RX * r * Math.cos(rad),
    y: CY - FIELD_RY * r * Math.sin(rad),
  };
}

interface Props {
  shots: WheelShot[];
  onChange: (shots: WheelShot[]) => void;
}

const RUN_OPTS: (1 | 2 | 4 | 6)[] = [1, 2, 4, 6];
const RUN_LABELS: Record<number, string> = { 1: "1 run", 2: "2 runs", 4: "Four", 6: "Six" };

export function WagonWheel({ shots, onChange }: Props) {
  const [pendingRuns, setPendingRuns] = useState<1 | 2 | 4 | 6>(1);
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);
  const [chooseOpen, setChooseOpen] = useState(false);

  function handleFieldTouch(evt: { nativeEvent: { locationX: number; locationY: number } }) {
    const lx = evt.nativeEvent.locationX;
    const ly = evt.nativeEvent.locationY;
    const dx = lx - CX;
    const dy = ly - CY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < PITCH_R + 4) return;
    if (dist > Math.max(FIELD_RX, FIELD_RY) + 4) return;
    setPendingPoint({ x: lx / FIELD_SIZE, y: ly / FIELD_SIZE });
    setChooseOpen(true);
  }

  function confirmShot(runs: 1 | 2 | 4 | 6) {
    if (!pendingPoint) return;
    onChange([...shots, { x: pendingPoint.x, y: pendingPoint.y, runs }]);
    setChooseOpen(false);
    setPendingPoint(null);
  }

  function removeShot(idx: number) {
    onChange(shots.filter((_, i) => i !== idx));
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

      <TouchableOpacity activeOpacity={1} onPress={handleFieldTouch}>
        <Svg width={FIELD_SIZE} height={FIELD_SIZE}>
          {/* Outfield */}
          <Ellipse cx={CX} cy={CY} rx={FIELD_RX} ry={FIELD_RY} fill="#4CAF5022" stroke="#4CAF50" strokeWidth={1.5} />
          {/* Inner circle */}
          <Ellipse cx={CX} cy={CY} rx={FIELD_RX * 0.5} ry={FIELD_RY * 0.5} fill="none" stroke="#4CAF5055" strokeWidth={1} strokeDasharray="4 3" />
          {/* Pitch */}
          <Circle cx={CX} cy={CY} r={PITCH_R} fill="#C8A96E" stroke="#A07040" strokeWidth={1} />

          {/* Crease line */}
          <Line x1={CX - PITCH_R + 2} y1={CY - 5} x2={CX + PITCH_R - 2} y2={CY - 5} stroke="#A07040" strokeWidth={1} />
          <Line x1={CX - PITCH_R + 2} y1={CY + 5} x2={CX + PITCH_R - 2} y2={CY + 5} stroke="#A07040" strokeWidth={1} />

          {/* Field labels */}
          {FIELD_LABELS.map(({ label, angle, r }) => {
            const pos = labelPos(angle, r);
            return (
              <SvgText
                key={label}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                fontSize={7.5}
                fill="#33691E"
                fontWeight="500"
              >
                {label}
              </SvgText>
            );
          })}

          {/* Shot spokes */}
          {shots.map((shot, i) => {
            const sx = shot.x * FIELD_SIZE;
            const sy = shot.y * FIELD_SIZE;
            const dx = sx - CX;
            const dy = sy - CY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const startX = CX + (dx / dist) * PITCH_R;
            const startY = CY + (dy / dist) * PITCH_R;
            const color = shotColor(shot.runs);
            return (
              <G key={i}>
                <Line x1={startX} y1={startY} x2={sx} y2={sy} stroke={color} strokeWidth={2} strokeOpacity={0.85} />
                <Circle
                  cx={sx}
                  cy={sy}
                  r={7}
                  fill={color}
                  fillOpacity={0.9}
                  onPress={() => removeShot(i)}
                />
                <SvgText x={sx} y={sy + 3.5} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="700">
                  {shot.runs}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Tap the field to add a shot · Tap a circle to remove it
      </Text>

      {shots.length > 0 && (
        <TouchableOpacity onPress={() => onChange([])} style={styles.clearBtn}>
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
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => { setChooseOpen(false); setPendingPoint(null); }}>
          <View style={styles.picker}>
            <Text style={styles.pickerTitle}>How many runs?</Text>
            <View style={styles.pickerRow}>
              {RUN_OPTS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.pickerBtn, { backgroundColor: shotColor(r) }]}
                  onPress={() => confirmShot(r)}
                >
                  <Text style={styles.pickerBtnLabel}>{r === 4 ? "4" : r === 6 ? "6" : String(r)}</Text>
                  <Text style={styles.pickerBtnSub}>{RUN_LABELS[r]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 8 },
  legend: { flexDirection: "row", gap: 12, marginBottom: 10, flexWrap: "wrap", justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555" },
  hint: { marginTop: 8, fontSize: 11, fontFamily: "Inter_400Regular", color: "#888", textAlign: "center" },
  clearBtn: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#ccc" },
  clearBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#888" },
  overlay: {
    flex: 1,
    backgroundColor: "#00000055",
    alignItems: "center",
    justifyContent: "center",
  },
  picker: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: 280,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#1A2520",
    marginBottom: 14,
  },
  pickerRow: { flexDirection: "row", gap: 10 },
  pickerBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerBtnLabel: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: "#fff" },
  pickerBtnSub: { fontSize: 8, fontFamily: "Inter_400Regular", color: "#ffffffCC" },
});
