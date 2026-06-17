import {
  useCreateMatch,
  useCreateBattingStats,
  useCreateBowlingStats,
  useCreateFieldingStats,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type MatchForm = {
  date: string;
  opponent: string;
  venue: string;
  matchType: string;
  result: string;
  playerOfTheMatch: boolean;
};

type BattingForm = {
  runs: string;
  ballsFaced: string;
  fours: string;
  sixes: string;
  battingPosition: string;
  howOut: string;
  badUmpireDecision: boolean;
};

type BowlingForm = {
  overs: string;
  maidens: string;
  runsConceded: string;
  wickets: string;
  noBalls: string;
  wides: string;
  hatTrick: boolean;
  bowledWickets: string;
  lbwWickets: string;
  wouldHaveReferred: boolean;
};

type FieldingForm = {
  catches: string;
  droppedCatches: string;
  runOuts: string;
  stumpings: string;
  missedStumpings: string;
};

const MATCH_TYPES = ["Club", "T20", "ODI", "Test", "Friendly", "Tournament"];
const HOW_OUT_OPTIONS = [
  "Not Out",
  "Caught",
  "Bowled",
  "LBW",
  "Run Out",
  "Stumped",
  "Hit Wicket",
  "Retired",
];

function SectionHeader({
  title,
  step,
  total,
  colors,
}: {
  title: string;
  step: number;
  total: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.stepNum}>{step}</Text>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.stepOf, { color: colors.mutedForeground }]}>
        Step {step} of {total}
      </Text>
    </View>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      {children}
    </View>
  );
}

function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
}) {
  const colors = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      placeholderTextColor={colors.mutedForeground}
      style={[
        styles.input,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          color: colors.foreground,
          fontFamily: "Inter_400Regular",
        },
      ]}
    />
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.toggleRow, { borderColor: colors.border }]}>
      <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

function ChipGroup({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.chipGroup}>
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.card,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.chipText, { color: active ? "#fff" : colors.foreground }]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const defaultMatch: MatchForm = {
  date: new Date().toISOString().split("T")[0],
  opponent: "",
  venue: "",
  matchType: "Club",
  result: "",
  playerOfTheMatch: false,
};

const defaultBatting: BattingForm = {
  runs: "",
  ballsFaced: "",
  fours: "",
  sixes: "",
  battingPosition: "",
  howOut: "",
  badUmpireDecision: false,
};

const defaultBowling: BowlingForm = {
  overs: "",
  maidens: "",
  runsConceded: "",
  wickets: "",
  noBalls: "",
  wides: "",
  hatTrick: false,
  bowledWickets: "",
  lbwWickets: "",
  wouldHaveReferred: false,
};

const defaultFielding: FieldingForm = {
  catches: "",
  droppedCatches: "",
  runOuts: "",
  stumpings: "",
  missedStumpings: "",
};

export default function LogMatchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [matchForm, setMatchForm] = useState<MatchForm>(defaultMatch);
  const [battingForm, setBattingForm] = useState<BattingForm>(defaultBatting);
  const [bowlingForm, setBowlingForm] = useState<BowlingForm>(defaultBowling);
  const [fieldingForm, setFieldingForm] = useState<FieldingForm>(defaultFielding);
  const [hasBatting, setHasBatting] = useState(true);
  const [hasBowling, setHasBowling] = useState(false);
  const [hasFielding, setHasFielding] = useState(false);

  const { mutateAsync: createMatch, isPending: matchPending } = useCreateMatch();
  const { mutateAsync: createBattingStats } = useCreateBattingStats();
  const { mutateAsync: createBowlingStats } = useCreateBowlingStats();
  const { mutateAsync: createFieldingStats } = useCreateFieldingStats();

  const totalSteps =
    1 + (hasBatting ? 1 : 0) + (hasBowling ? 1 : 0) + (hasFielding ? 1 : 0) + 1;

  const updateMatch = (k: keyof MatchForm, v: string | boolean) =>
    setMatchForm((p) => ({ ...p, [k]: v }));
  const updateBatting = (k: keyof BattingForm, v: string | boolean) =>
    setBattingForm((p) => ({ ...p, [k]: v }));
  const updateBowling = (k: keyof BowlingForm, v: string | boolean) =>
    setBowlingForm((p) => ({ ...p, [k]: v }));
  const updateFielding = (k: keyof FieldingForm, v: string) =>
    setFieldingForm((p) => ({ ...p, [k]: v }));

  const reviewStep = 1 + (hasBatting ? 1 : 0) + (hasBowling ? 1 : 0) + (hasFielding ? 1 : 0) + 1;
  const isLastStep = step === reviewStep;
  const isFirstStep = step === 1;

  const handleNext = () => {
    if (step === 1) {
      if (!matchForm.opponent.trim()) {
        Alert.alert("Required", "Please enter an opponent name.");
        return;
      }
      if (!matchForm.date.trim()) {
        Alert.alert("Required", "Please enter a date.");
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    try {
      const match = await createMatch({
        data: {
          date: matchForm.date,
          opponent: matchForm.opponent,
          venue: matchForm.venue || undefined,
          matchType: matchForm.matchType,
          result: matchForm.result || undefined,
          playerOfTheMatch: matchForm.playerOfTheMatch,
        },
      });

      const matchId = match.id;

      const promises: Promise<unknown>[] = [];

      if (hasBatting && battingForm.runs !== "") {
        promises.push(
          createBattingStats({
            matchId,
            data: {
              runs: Number(battingForm.runs) || 0,
              ballsFaced: Number(battingForm.ballsFaced) || 0,
              fours: Number(battingForm.fours) || 0,
              sixes: Number(battingForm.sixes) || 0,
              battingPosition: battingForm.battingPosition
                ? Number(battingForm.battingPosition)
                : undefined,
              howOut: battingForm.howOut || undefined,
              badUmpireDecision: battingForm.badUmpireDecision,
            },
          })
        );
      }

      if (hasBowling && bowlingForm.overs !== "") {
        promises.push(
          createBowlingStats({
            matchId,
            data: {
              overs: Number(bowlingForm.overs) || 0,
              maidens: Number(bowlingForm.maidens) || 0,
              runsConceded: Number(bowlingForm.runsConceded) || 0,
              wickets: Number(bowlingForm.wickets) || 0,
              noBalls: Number(bowlingForm.noBalls) || 0,
              wides: Number(bowlingForm.wides) || 0,
              hatTrick: bowlingForm.hatTrick,
              bowledWickets: Number(bowlingForm.bowledWickets) || 0,
              lbwWickets: Number(bowlingForm.lbwWickets) || 0,
              wouldHaveReferred: bowlingForm.wouldHaveReferred,
            },
          })
        );
      }

      if (hasFielding) {
        promises.push(
          createFieldingStats({
            matchId,
            data: {
              catches: Number(fieldingForm.catches) || 0,
              droppedCatches: Number(fieldingForm.droppedCatches) || 0,
              runOuts: Number(fieldingForm.runOuts) || 0,
              stumpings: Number(fieldingForm.stumpings) || 0,
              missedStumpings: Number(fieldingForm.missedStumpings) || 0,
            },
          })
        );
      }

      await Promise.all(promises);

      setMatchForm(defaultMatch);
      setBattingForm(defaultBatting);
      setBowlingForm(defaultBowling);
      setFieldingForm(defaultFielding);
      setStep(1);
      setHasBatting(true);
      setHasBowling(false);
      setHasFielding(false);

      Alert.alert("Match Saved!", `Match vs ${match.opponent} has been logged.`, [
        { text: "View Match", onPress: () => router.push(`/match/${match.id}`) },
        { text: "OK" },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      Alert.alert("Error", `Failed to save match: ${msg}`);
    }
  };

  const battingStep = 2;
  const bowlingStep = hasBatting ? 3 : 2;
  const fieldingStep = (hasBatting ? 1 : 0) + (hasBowling ? 1 : 0) + 2;

  const showBatting = step === battingStep && hasBatting;
  const showBowling = step === bowlingStep && hasBowling;
  const showFielding = step === fieldingStep && hasFielding;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Match Info */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <SectionHeader title="Match Info" step={1} total={totalSteps} colors={colors} />

            <Field label="Date">
              <Input
                value={matchForm.date}
                onChangeText={(v) => updateMatch("date", v)}
                placeholder="YYYY-MM-DD"
              />
            </Field>

            <Field label="Opponent *">
              <Input
                value={matchForm.opponent}
                onChangeText={(v) => updateMatch("opponent", v)}
                placeholder="e.g. City CC"
              />
            </Field>

            <Field label="Venue">
              <Input
                value={matchForm.venue}
                onChangeText={(v) => updateMatch("venue", v)}
                placeholder="e.g. Home Ground"
              />
            </Field>

            <Field label="Match Type">
              <ChipGroup
                options={MATCH_TYPES}
                selected={matchForm.matchType}
                onSelect={(v) => updateMatch("matchType", v)}
              />
            </Field>

            <Field label="Result">
              <Input
                value={matchForm.result}
                onChangeText={(v) => updateMatch("result", v)}
                placeholder="e.g. Won by 5 wickets"
              />
            </Field>

            <ToggleRow
              label="Player of the Match"
              value={matchForm.playerOfTheMatch}
              onValueChange={(v) => updateMatch("playerOfTheMatch", v)}
            />

            <View style={[styles.divider, { borderColor: colors.border }]} />
            <Text style={[styles.includeLabel, { color: colors.foreground }]}>
              Include stats:
            </Text>
            <ToggleRow label="Batting" value={hasBatting} onValueChange={setHasBatting} />
            <ToggleRow label="Bowling" value={hasBowling} onValueChange={setHasBowling} />
            <ToggleRow label="Fielding" value={hasFielding} onValueChange={setHasFielding} />
          </View>
        )}

        {/* Batting Step */}
        {showBatting && (
          <View style={styles.stepContainer}>
            <SectionHeader
              title="Batting Stats"
              step={battingStep}
              total={totalSteps}
              colors={colors}
            />

            <Field label="Runs">
              <Input
                value={battingForm.runs}
                onChangeText={(v) => updateBatting("runs", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>

            <Field label="Balls Faced">
              <Input
                value={battingForm.ballsFaced}
                onChangeText={(v) => updateBatting("ballsFaced", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Fours">
                  <Input
                    value={battingForm.fours}
                    onChangeText={(v) => updateBatting("fours", v)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="Sixes">
                  <Input
                    value={battingForm.sixes}
                    onChangeText={(v) => updateBatting("sixes", v)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
            </View>

            <Field label="Batting Position">
              <Input
                value={battingForm.battingPosition}
                onChangeText={(v) => updateBatting("battingPosition", v)}
                placeholder="e.g. 3"
                keyboardType="numeric"
              />
            </Field>

            <Field label="How Out">
              <ChipGroup
                options={HOW_OUT_OPTIONS}
                selected={battingForm.howOut}
                onSelect={(v) => updateBatting("howOut", v)}
              />
            </Field>

            <ToggleRow
              label="Bad Umpire Decision?"
              value={battingForm.badUmpireDecision}
              onValueChange={(v) => updateBatting("badUmpireDecision", v)}
            />
          </View>
        )}

        {/* Bowling Step */}
        {showBowling && (
          <View style={styles.stepContainer}>
            <SectionHeader
              title="Bowling Stats"
              step={bowlingStep}
              total={totalSteps}
              colors={colors}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Overs">
                  <Input
                    value={bowlingForm.overs}
                    onChangeText={(v) => updateBowling("overs", v)}
                    placeholder="0.0"
                    keyboardType="decimal-pad"
                  />
                </Field>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="Maidens">
                  <Input
                    value={bowlingForm.maidens}
                    onChangeText={(v) => updateBowling("maidens", v)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Runs Conceded">
                  <Input
                    value={bowlingForm.runsConceded}
                    onChangeText={(v) => updateBowling("runsConceded", v)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="Wickets">
                  <Input
                    value={bowlingForm.wickets}
                    onChangeText={(v) => updateBowling("wickets", v)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="No Balls">
                  <Input
                    value={bowlingForm.noBalls}
                    onChangeText={(v) => updateBowling("noBalls", v)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="Wides">
                  <Input
                    value={bowlingForm.wides}
                    onChangeText={(v) => updateBowling("wides", v)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Bowled Wickets">
                  <Input
                    value={bowlingForm.bowledWickets}
                    onChangeText={(v) => updateBowling("bowledWickets", v)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="LBW Wickets">
                  <Input
                    value={bowlingForm.lbwWickets}
                    onChangeText={(v) => updateBowling("lbwWickets", v)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
            </View>

            <ToggleRow
              label="Hat Trick?"
              value={bowlingForm.hatTrick}
              onValueChange={(v) => updateBowling("hatTrick", v)}
            />
            <ToggleRow
              label="Would Have Referred?"
              value={bowlingForm.wouldHaveReferred}
              onValueChange={(v) => updateBowling("wouldHaveReferred", v)}
            />
          </View>
        )}

        {/* Fielding Step */}
        {showFielding && (
          <View style={styles.stepContainer}>
            <SectionHeader
              title="Fielding Stats"
              step={fieldingStep}
              total={totalSteps}
              colors={colors}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Catches">
                  <Input
                    value={fieldingForm.catches}
                    onChangeText={(v) => updateFielding("catches", v)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="Dropped">
                  <Input
                    value={fieldingForm.droppedCatches}
                    onChangeText={(v) => updateFielding("droppedCatches", v)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Run Outs">
                  <Input
                    value={fieldingForm.runOuts}
                    onChangeText={(v) => updateFielding("runOuts", v)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="Stumpings">
                  <Input
                    value={fieldingForm.stumpings}
                    onChangeText={(v) => updateFielding("stumpings", v)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
            </View>

            <Field label="Missed Stumpings">
              <Input
                value={fieldingForm.missedStumpings}
                onChangeText={(v) => updateFielding("missedStumpings", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
          </View>
        )}

        {/* Review Step */}
        {isLastStep && (
          <View style={styles.stepContainer}>
            <SectionHeader
              title="Review & Save"
              step={reviewStep}
              total={totalSteps}
              colors={colors}
            />
            <View
              style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <ReviewRow label="Opponent" value={`vs ${matchForm.opponent}`} />
              <ReviewRow label="Date" value={matchForm.date} />
              <ReviewRow label="Type" value={matchForm.matchType} />
              {matchForm.venue ? <ReviewRow label="Venue" value={matchForm.venue} /> : null}
              {matchForm.result ? <ReviewRow label="Result" value={matchForm.result} /> : null}
              {matchForm.playerOfTheMatch ? <ReviewRow label="POTM" value="Yes ⭐" /> : null}
              {hasBatting && battingForm.runs !== "" ? (
                <ReviewRow
                  label="Batting"
                  value={`${battingForm.runs} runs (${battingForm.ballsFaced}b)${battingForm.howOut ? ` · ${battingForm.howOut}` : ""}`}
                />
              ) : null}
              {hasBowling && bowlingForm.overs !== "" ? (
                <ReviewRow
                  label="Bowling"
                  value={`${bowlingForm.wickets}/${bowlingForm.runsConceded} in ${bowlingForm.overs} overs`}
                />
              ) : null}
              {hasFielding ? (
                <ReviewRow
                  label="Fielding"
                  value={`${fieldingForm.catches} catches · ${fieldingForm.runOuts} run outs`}
                />
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom navigation */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        {!isFirstStep && (
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={handleBack}
          >
            <Feather name="chevron-left" size={18} color={colors.foreground} />
            <Text style={[styles.backBtnText, { color: colors.foreground }]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextBtn,
            { backgroundColor: colors.primary },
            isFirstStep && { flex: 1 },
          ]}
          onPress={isLastStep ? handleSubmit : handleNext}
          disabled={matchPending}
        >
          <Text style={styles.nextBtnText}>
            {isLastStep ? (matchPending ? "Saving…" : "Save Match") : "Next"}
          </Text>
          {!isLastStep && <Feather name="chevron-right" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.reviewRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.reviewValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContainer: { padding: 16 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", flex: 1 },
  stepOf: { fontSize: 12, fontFamily: "Inter_400Regular" },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  row: { flexDirection: "row" },
  divider: { borderTopWidth: 1, marginVertical: 16 },
  includeLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  backBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 13,
  },
  nextBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  reviewCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  reviewValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "right",
  },
});
