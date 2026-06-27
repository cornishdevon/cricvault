import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Colors = {
  foreground: string;
  mutedForeground: string;
  background: string;
  card: string;
  border: string;
  primary: string;
};

type Targets = {
  runs: number;
  wickets: number;
  season: string;
};

const STORAGE_KEY = "cricvault_season_targets";

async function getStoredTargets(): Promise<Targets | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveTargets(t: Targets) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  } catch {}
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={styles.barBg}>
      <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

export function SeasonTargets({
  currentRuns,
  currentWickets,
  season,
  colors,
}: {
  currentRuns: number;
  currentWickets: number;
  season: string;
  colors: Colors;
}) {
  const [targets, setTargets] = useState<Targets | null>(null);
  const [editing, setEditing] = useState(false);
  const [runsInput, setRunsInput] = useState("");
  const [wicketsInput, setWicketsInput] = useState("");

  useEffect(() => {
    getStoredTargets().then((stored) => {
      if (stored && stored.season === season) setTargets(stored);
    });
  }, [season]);

  const handleSave = async () => {
    const t: Targets = {
      runs: Number(runsInput) || 0,
      wickets: Number(wicketsInput) || 0,
      season,
    };
    await saveTargets(t);
    setTargets(t);
    setEditing(false);
  };

  if (editing) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary + "44" }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>🎯 Set Season Targets</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Runs target</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              keyboardType="number-pad"
              placeholder="e.g. 800"
              placeholderTextColor={colors.mutedForeground}
              value={runsInput}
              onChangeText={setRunsInput}
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Wickets target</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              keyboardType="number-pad"
              placeholder="e.g. 25"
              placeholderTextColor={colors.mutedForeground}
              value={wicketsInput}
              onChangeText={setWicketsInput}
            />
          </View>
        </View>
        <View style={styles.btnRow}>
          <TouchableOpacity onPress={handleSave} style={[styles.btn, { backgroundColor: colors.primary }]}>
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditing(false)} style={[styles.btnGhost, { borderColor: colors.border }]}>
            <Text style={[styles.btnGhostText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!targets || (targets.runs === 0 && targets.wickets === 0)) {
    return (
      <View style={[styles.emptyCard, { borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>🎯 Set season targets to track your progress</Text>
        <TouchableOpacity onPress={() => { setRunsInput(""); setWicketsInput(""); setEditing(true); }} style={[styles.btnSmall, { borderColor: colors.border }]}>
          <Text style={[styles.btnSmallText, { color: colors.primary }]}>Set goals</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const runsLeft = Math.max(targets.runs - currentRuns, 0);
  const wktsLeft = Math.max(targets.wickets - currentWickets, 0);
  const runsDone = currentRuns >= targets.runs;
  const wktsDone = currentWickets >= targets.wickets;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.title, { color: colors.foreground }]}>🎯 {season} Goals</Text>
        <TouchableOpacity onPress={() => { setRunsInput(String(targets.runs)); setWicketsInput(String(targets.wickets)); setEditing(true); }}>
          <Text style={[styles.editLink, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      {targets.runs > 0 && (
        <View style={styles.goalRow}>
          <View style={styles.goalMeta}>
            <Text style={[styles.goalLabel, { color: colors.foreground }]}>🏏 Runs {runsDone ? "✅" : ""}</Text>
            <Text style={[styles.goalCount, { color: colors.mutedForeground }]}>
              {currentRuns}/{targets.runs}{!runsDone ? `  (${runsLeft} to go)` : ""}
            </Text>
          </View>
          <ProgressBar value={currentRuns} max={targets.runs} color={runsDone ? "#22c55e" : colors.primary} />
        </View>
      )}

      {targets.wickets > 0 && (
        <View style={styles.goalRow}>
          <View style={styles.goalMeta}>
            <Text style={[styles.goalLabel, { color: colors.foreground }]}>🎳 Wickets {wktsDone ? "✅" : ""}</Text>
            <Text style={[styles.goalCount, { color: colors.mutedForeground }]}>
              {currentWickets}/{targets.wickets}{!wktsDone ? `  (${wktsLeft} to go)` : ""}
            </Text>
          </View>
          <ProgressBar value={currentWickets} max={targets.wickets} color={wktsDone ? "#22c55e" : "#8b5cf6"} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  editLink: { fontSize: 13, fontFamily: "Inter_500Medium" },
  goalRow: { gap: 6 },
  goalMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  goalLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  goalCount: { fontSize: 11, fontFamily: "Inter_400Regular" },
  barBg: { height: 8, borderRadius: 4, backgroundColor: "#e5e7eb", overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },

  emptyCard: {
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  emptyText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  btnSmall: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnSmallText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  inputRow: { flexDirection: "row", gap: 10 },
  inputWrap: { flex: 1, gap: 4 },
  label: { fontSize: 11, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  btnRow: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  btnGhost: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center", borderWidth: 1 },
  btnGhostText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
