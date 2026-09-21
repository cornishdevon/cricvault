import React, { useId, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, RadialGradient, Stop, Line, Rect, Text as SvgText } from "react-native-svg";

export type BowlingWicket = {
  id: string;
  kind: "caught" | "bowled" | "lbw";
  x: number;
  y: number;
  batter?: string;
  over?: string;
  note?: string;
  /** Present only on aggregated maps; never written to a per-match wicket map. */
  sourceMatchId?: number;
  sourceOpponent?: string;
  sourceDate?: string;
};

export { parseWicketMap } from "../utils/wicket-map-parser";

const SIZE = 320;
const CENTER = 160;
const RADIUS = 144;

function CricketBall({ x, y, number, scale = 1, selected }: {
  x: number;
  y: number;
  number: number;
  scale?: number;
  selected?: boolean;
}) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      {selected && <Circle cx={0} cy={0} r={12} fill="none" stroke="#FFF" strokeWidth={2} />}
      <Circle cx={1} cy={2} r={10} fill="#671A1D" opacity={0.2} />
      <Circle cx={0} cy={0} r={9} fill="#BC2938" stroke="#801521" strokeWidth={1} />
      <Line x1={-3} y1={-8} x2={-3} y2={8} stroke="#FAD8CD" strokeWidth={1} strokeDasharray="1 2" />
      <SvgText x={0} y={2.5} textAnchor="middle" fontSize={8} fontWeight="700" fill="#FFF">{number}</SvgText>
    </G>
  );
}

function WicketMarker({
  wicket,
  number,
  x,
  y,
  scale,
  selected,
  onSelect,
}: {
  wicket: BowlingWicket;
  number: number;
  x: number;
  y: number;
  scale?: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const kind = wicket.kind === "caught" ? "Caught" : wicket.kind === "lbw" ? "LBW" : "Bowled";
  const stopAndSelect = (event: { stopPropagation?: () => void }) => {
    event.stopPropagation?.();
    onSelect();
  };
  return (
    <G
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Wicket ${number}, ${kind}. Select to view details.`}
      accessibilityState={{ selected }}
      onPressIn={(event) => event.stopPropagation()}
      onPress={stopAndSelect}
    >
      <Circle cx={x} cy={y} r={16} fill="transparent" />
      <CricketBall x={x} y={y} number={number} scale={scale} selected={selected} />
    </G>
  );
}

export function BowlingWicketMap({ wickets, onChange, compactMarkers, hideList, scrollableList }: {
  wickets: BowlingWicket[];
  onChange?: (wickets: BowlingWicket[]) => void;
  compactMarkers?: boolean;
  hideList?: boolean;
  scrollableList?: boolean;
}) {
  const [placingCatch, setPlacingCatch] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const svgId = `bowling-${useId().replace(/:/g, "")}-`;
  const width = useRef(SIZE);
  const editable = !!onChange;
  const WicketList = scrollableList ? ScrollView : View;
  const compactSpacing = Math.min(12, 130 / (Math.ceil(Math.sqrt(wickets.filter((w) => w.kind !== "caught").length)) || 1));
  const compactScale = Math.min(0.75, (compactSpacing / 12) * 0.75);
  const caught = wickets.filter((w) => w.kind === "caught").length;
  const bowled = wickets.filter((w) => w.kind === "bowled").length;
  const lbw = wickets.filter((w) => w.kind === "lbw").length;
  const creaseWickets = wickets.map((wicket, index) => ({ wicket, number: index + 1 }))
    .filter(({ wicket }) => wicket.kind !== "caught");
  const creaseColumns = Math.ceil(Math.sqrt(creaseWickets.length));
  const creaseRows = Math.ceil(creaseWickets.length / (creaseColumns || 1));

  React.useEffect(() => {
    if (selectedId && !wickets.some((wicket) => wicket.id === selectedId)) {
      setSelectedId(null);
    }
  }, [selectedId, wickets]);

  function addWicket(kind: BowlingWicket["kind"], x: number, y: number) {
    if (!onChange || wickets.length >= 100) return;
    const wicket: BowlingWicket = {
      id: `wicket-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      kind, x, y,
    };
    onChange([...wickets, wicket]);
    setSelectedId(wicket.id);
    setPlacingCatch(false);
  }

  function updateSelectedWicket(field: "batter" | "over" | "note", value: string) {
    if (!onChange || !selectedId) return;
    const maxLength = field === "batter" ? 120 : field === "over" ? 8 : 1000;
    const boundedValue = value.slice(0, maxLength);
    onChange(wickets.map((wicket) => {
      if (wicket.id !== selectedId) return wicket;
      const updated = { ...wicket };
      if (boundedValue.length === 0) delete updated[field];
      else updated[field] = boundedValue;
      return updated;
    }));
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Bowler’s wicket map</Text>
      <Text style={styles.summary}>{caught} caught · {bowled} bowled · {lbw} LBW</Text>
      {editable && (
        <View style={styles.controls}>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: placingCatch }}
            onPress={() => setPlacingCatch(!placingCatch)}
            style={[styles.button, placingCatch && styles.selected]}>
            <Text style={[styles.buttonText, placingCatch && styles.selectedText]}>
              {placingCatch ? "Cancel catch" : "Mark a catch"}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => addWicket("bowled", 0.5, 0.4)} style={styles.button}>
            <Text style={styles.buttonText}>Bowled</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => addWicket("lbw", 0.5, 0.4)} style={styles.button}>
            <Text style={styles.buttonText}>LBW</Text>
          </Pressable>
        </View>
      )}
      <Text accessibilityLiveRegion="polite" style={styles.hint}>
        {placingCatch ? "Tap where the fielder took the catch."
          : editable ? "Mark catches on the field. Bowled and LBW add a ball at the wicket."
            : "Each numbered ball is one wicket. Bowled and LBW balls sit at the wicket."}
      </Text>
      <Pressable
        style={styles.field}
        onLayout={(event) => { width.current = event.nativeEvent.layout.width; }}
        disabled={!editable || !placingCatch}
        accessibilityLabel="Cricket field. Tap to place the catch."
        onPress={(event) => {
          const x = event.nativeEvent.locationX / width.current;
          const y = event.nativeEvent.locationY / width.current;
          if (Math.hypot(x * SIZE - CENTER, y * SIZE - CENTER) > RADIUS) return;
          addWicket("caught", x, y);
        }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${SIZE} ${SIZE}`}>
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
              <Circle cx={CENTER} cy={CENTER} r={RADIUS} />
            </ClipPath>
          </Defs>
          <Circle cx={CENTER} cy={CENTER + 5} r={RADIUS + 3} fill="#2A5432" opacity={0.18} />
          <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill={`url(#${svgId}grass)`} />
          <G clipPath={`url(#${svgId}field)`}>
            {Array.from({ length: 9 }, (_, i) => (
              <Rect key={i} x={i * 36} y={0} width={18} height={SIZE} fill="#D6EB8C" opacity={0.1} />
            ))}
            <Ellipse cx={CENTER - 58} cy={CENTER - 72} rx={106} ry={35} fill="#D7ED9C" opacity={0.09} rotation={-25} origin={`${CENTER - 58}, ${CENTER - 72}`} />
            <Ellipse cx={CENTER + 68} cy={CENTER + 85} rx={130} ry={40} fill="#183F31" opacity={0.13} rotation={-25} origin={`${CENTER + 68}, ${CENTER + 85}`} />
          </G>
          <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#76502E" strokeWidth={6.5} opacity={0.8} />
          <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#F5DD9C" strokeWidth={4.3} />
          <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#B78B52" strokeWidth={2} strokeDasharray="1 4.2" />
          <Circle cx={CENTER} cy={CENTER} r={85} fill="none" stroke="#FFF" strokeOpacity={0.85} strokeWidth={1.5} />
          <Rect x={150} y={124} width={20} height={72} rx={2} fill={`url(#${svgId}pitch)`} stroke="#8C5E32" strokeWidth={1} />
          {[130, 190].map((y) => (
            <G key={y}>
              <Line x1={144} x2={176} y1={y + (y === 130 ? 5 : -5)} y2={y + (y === 130 ? 5 : -5)} stroke="#FFF" strokeWidth={1.5} />
              {[-4, 0, 4].map((dx) => <Line key={dx} x1={CENTER + dx} x2={CENTER + dx} y1={y - 4} y2={y + 3} stroke="#654725" strokeWidth={1.5} />)}
              <Line x1={155} x2={165} y1={y - 4} y2={y - 4} stroke="#654725" strokeWidth={1.5} />
            </G>
          ))}
          {creaseWickets.map(({ wicket, number }, index) => (
            <WicketMarker key={wicket.id}
              wicket={wicket}
              x={CENTER + (index % creaseColumns - (creaseColumns - 1) / 2) * (compactMarkers ? compactSpacing : 22)}
              y={128 + (Math.floor(index / creaseColumns) - (creaseRows - 1) / 2) * (compactMarkers ? compactSpacing : 22)}
              number={number}
              scale={compactMarkers ? compactScale : undefined}
              selected={selectedId === wicket.id}
              onSelect={() => setSelectedId(wicket.id)} />
          ))}
          {wickets.map((w, i) => w.kind === "caught" && (
            <WicketMarker
              key={w.id}
              wicket={w}
              x={w.x * SIZE}
              y={w.y * SIZE}
              number={i + 1}
              scale={compactMarkers ? compactScale : undefined}
              selected={selectedId === w.id}
              onSelect={() => setSelectedId(w.id)}
            />
          ))}
        </Svg>
      </Pressable>
      <View style={styles.details}>
        <Text style={styles.detailsTitle}>Wicket information</Text>
        <Text style={styles.hint}>
          {editable
            ? wickets.length === 0
              ? "Add a catch, bowled or LBW wicket above, then enter the batter, over and how you got them out."
              : "Tap a numbered ball to enter the batter, over and how you got them out. Save your bowling stats or match to keep the details."
            : wickets.length === 0
              ? "No wickets mapped yet."
              : "Tap a numbered ball to read how that wicket was taken."}
        </Text>
        {!selectedId && wickets.length > 0 && (
          <Pressable accessibilityRole="button" onPress={() => setSelectedId(wickets[wickets.length - 1].id)}
            style={[styles.button, styles.selected, { marginTop: 8, flex: 0 }]}>
            <Text style={[styles.buttonText, styles.selectedText]}>
              {editable ? "Enter wicket information" : "View wicket information"}
            </Text>
          </Pressable>
        )}
      </View>
      {selectedId && (() => {
        const selectedWicket = wickets.find((wicket) => wicket.id === selectedId);
        if (!selectedWicket) return null;
        const selectedNumber = wickets.findIndex((wicket) => wicket.id === selectedWicket.id) + 1;
        const kind = selectedWicket.kind === "caught" ? "Caught" : selectedWicket.kind === "lbw" ? "LBW" : "Bowled";
        return (
          <View style={styles.details} accessibilityLiveRegion="polite">
            <View style={styles.detailsHeader}>
              <View>
                <Text style={styles.detailsTitle}>Wicket {selectedNumber} details</Text>
                <Text style={styles.detailsKind}>{kind}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close wicket details" onPress={() => setSelectedId(null)} style={styles.close}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            {editable ? (
              <View style={styles.detailsFields}>
                <Text style={styles.fieldLabel}>Batter</Text>
                <TextInput
                  value={selectedWicket.batter ?? ""}
                  maxLength={120}
                  onChangeText={(value) => updateSelectedWicket("batter", value)}
                  placeholder="Batter name"
                  placeholderTextColor="#879385"
                  style={styles.input}
                />
                <Text style={styles.fieldLabel}>Over</Text>
                <TextInput
                  value={selectedWicket.over ?? ""}
                  maxLength={8}
                  keyboardType="decimal-pad"
                  onChangeText={(value) => updateSelectedWicket("over", value)}
                  placeholder="e.g. 7.3"
                  placeholderTextColor="#879385"
                  style={styles.input}
                />
                <Text style={styles.overHelp}>Completed overs use .0 to .5 (for example 7.3).</Text>
                {!!selectedWicket.over && !/^(?:0|[1-9]\d*)(?:\.[0-5])?$/.test(selectedWicket.over) && (
                  <Text accessibilityRole="alert" style={[styles.overHelp, { color: "#B42318" }]}>
                    Invalid over. Enter a whole number or .0 to .5, such as 4.2. This wicket cannot be saved until corrected.
                  </Text>
                )}
                <Text style={styles.fieldLabel}>How did you get the wicket?</Text>
                <TextInput
                  value={selectedWicket.note ?? ""}
                  maxLength={1000}
                  multiline
                  onChangeText={(value) => updateSelectedWicket("note", value)}
                  placeholder="e.g. Inswinging yorker, or an edge caught at slip"
                  placeholderTextColor="#879385"
                  style={[styles.input, styles.noteInput]}
                />
              </View>
            ) : (
              <View style={styles.readonlyDetails}>
                <Text style={styles.detailText}><Text style={styles.detailLabel}>Batter: </Text>{selectedWicket.batter || "—"}</Text>
                <Text style={styles.detailText}><Text style={styles.detailLabel}>Over: </Text>{selectedWicket.over || "—"}</Text>
                <Text style={styles.detailText}><Text style={styles.detailLabel}>Note: </Text>{selectedWicket.note || "—"}</Text>
                {(selectedWicket.sourceOpponent || selectedWicket.sourceDate || selectedWicket.sourceMatchId !== undefined) && (
                  <Text style={[styles.detailText, styles.sourceText]}>
                    <Text style={styles.detailLabel}>Source match: </Text>
                    {selectedWicket.sourceOpponent || "Unknown opponent"}
                    {selectedWicket.sourceDate ? ` · ${selectedWicket.sourceDate}` : ""}
                    {selectedWicket.sourceMatchId !== undefined ? ` · #${selectedWicket.sourceMatchId}` : ""}
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      })()}
      {!hideList && (
        <WicketList
          {...(scrollableList
            ? { nestedScrollEnabled: true, contentContainerStyle: styles.wicketList }
            : {})}
          style={scrollableList ? styles.scrollableList : styles.wicketList}
        >
          {wickets.map((w, i) => (
            <View key={w.id} style={[styles.wicketRow, selectedId === w.id && styles.selectedRow]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View details for wicket ${i + 1}`}
                onPress={() => setSelectedId(w.id)}
                style={styles.wicketSelect}
              >
                <Text style={styles.wicketText}>Wicket {i + 1} · {w.kind === "caught" ? "Caught" : w.kind === "lbw" ? "LBW" : "Bowled"}</Text>
              </Pressable>
              {editable && <Pressable accessibilityRole="button" accessibilityLabel={`Remove wicket ${i + 1}`}
                hitSlop={6} onPress={() => onChange?.(wickets.filter((item) => item.id !== w.id))} style={styles.remove}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>}
            </View>
          ))}
        </WicketList>
      )}
      {editable && wickets.length > 0 && <Text style={styles.hint}>Removing a marker leaves your bowling totals unchanged.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#F6F1E5", padding: 12, borderRadius: 16, marginTop: 14 },
  title: { color: "#244E33", fontSize: 17, fontFamily: "Inter_700Bold" },
  summary: { color: "#56705B", fontSize: 12, marginTop: 4 },
  controls: { flexDirection: "row", gap: 10, marginTop: 12 },
  button: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: "#356343", paddingHorizontal: 8 },
  selected: { backgroundColor: "#356343" },
  buttonText: { color: "#244E33", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  selectedText: { color: "#FFF" },
  hint: { color: "#586758", fontSize: 11, lineHeight: 16, marginTop: 10, textAlign: "center" },
  field: { width: "100%", maxWidth: 400, aspectRatio: 1, alignSelf: "center", marginTop: 6 },
  details: { marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: "#D7D6C7", backgroundColor: "rgba(255,255,255,0.6)", padding: 12 },
  detailsHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  detailsTitle: { color: "#244E33", fontSize: 13, fontFamily: "Inter_700Bold" },
  detailsKind: { color: "#56705B", fontSize: 11, marginTop: 2 },
  close: { minHeight: 32, minWidth: 32, alignItems: "center", justifyContent: "center", borderRadius: 6 },
  closeText: { color: "#56705B", fontSize: 20, lineHeight: 22 },
  detailsFields: { marginTop: 10 },
  fieldLabel: { color: "#56705B", fontSize: 11, marginTop: 6, marginBottom: 4 },
  input: { minHeight: 36, borderRadius: 6, borderWidth: 1, borderColor: "#C9CCBD", backgroundColor: "#FFF", paddingHorizontal: 8, color: "#244E33", fontSize: 12 },
  noteInput: { minHeight: 64, paddingTop: 8, textAlignVertical: "top" },
  overHelp: { color: "#586758", fontSize: 10, lineHeight: 14, marginTop: 4 },
  readonlyDetails: { marginTop: 10, gap: 4 },
  detailText: { color: "#344D39", fontSize: 12, lineHeight: 17 },
  detailLabel: { fontFamily: "Inter_700Bold" },
  sourceText: { color: "#56705B", borderTopWidth: 1, borderColor: "#DDDCCB", paddingTop: 4, marginTop: 2 },
  wicketList: { marginTop: 8 },
  scrollableList: { maxHeight: 200 },
  wicketRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderColor: "#DDDCCB", paddingVertical: 2 },
  selectedRow: { backgroundColor: "#EAE9D9" },
  wicketSelect: { flex: 1, minHeight: 36, justifyContent: "center" },
  wicketText: { color: "#344D39", fontSize: 12 },
  remove: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  removeText: { color: "#A32C39", fontSize: 12 },
});