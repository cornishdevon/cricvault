import {
  useCreateMatch,
  useCreateBattingStats,
  useCreateBowlingStats,
  useCreateFieldingStats,
  getListMatchesQueryKey,
  getGetPerMatchStatsQueryKey,
  getGetStatsSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  PanResponder,
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
import { computeBadges, type PerMatchStat } from "@/utils/computeBadges";

// ── Types ─────────────────────────────────────────────────────────────────────

type MatchForm = {
  date: string;
  opponent: string;
  venue: string;
  matchType: string;
  playingFor: string;
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
  ballsToFifty: string;
  ballsToHundred: string;
  ballsToHundredFifty: string;
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

// ── Constants ─────────────────────────────────────────────────────────────────

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

const defaultMatch: MatchForm = {
  date: new Date().toISOString().split("T")[0],
  opponent: "",
  venue: "",
  matchType: "",
  playingFor: "",
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
  ballsToFifty: "",
  ballsToHundred: "",
  ballsToHundredFifty: "",
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

// ── Shared UI components ──────────────────────────────────────────────────────

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

function Field({
  label,
  children,
  half,
}: {
  label: string;
  children: React.ReactNode;
  half?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.field, half && { flex: 1 }]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function ToggleRow({
  label,
  value,
  onValueChange,
  sublabel,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  sublabel?: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.toggleRow, { borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
        {sublabel ? (
          <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>{sublabel}</Text>
        ) : null}
      </View>
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
            onPress={() => onSelect(active ? "" : opt)}
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

function SectionCard({
  icon,
  title,
  enabled,
  onToggle,
  children,
  alwaysOpen,
}: {
  icon: string;
  title: string;
  enabled: boolean;
  onToggle?: (v: boolean) => void;
  children: React.ReactNode;
  alwaysOpen?: boolean;
}) {
  const colors = useColors();
  const isOpen = alwaysOpen || enabled;

  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header row */}
      <View style={styles.sectionCardHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        {onToggle && (
          <Switch
            value={enabled}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        )}
      </View>

      {isOpen && (
        <View style={[styles.sectionBody, { borderTopColor: colors.border }]}>
          {children}
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function LogMatchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [popupBadges, setPopupBadges] = useState<{ id: string; icon: string; label: string; imageKey?: string }[]>([]);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Ref so PanResponder (created once) can call the latest dismiss fn
  const dismissRef = useRef<(() => void) | null>(null);

  const dismissPopup = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -160, duration: 280, useNativeDriver: true }),
    ]).start(() => {
      setPopupBadges([]);
      router.replace("/");
    });
  }, [fadeAnim, slideAnim, router]);

  useEffect(() => { dismissRef.current = dismissPopup; }, [dismissPopup]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 4,
      onPanResponderMove: (_, gs) => {
        if (gs.dy < 0) slideAnim.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy < -50 || gs.vy < -0.6) {
          dismissRef.current?.();
        } else {
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const [matchForm, setMatchForm] = useState<MatchForm>(defaultMatch);
  const [battingForm, setBattingForm] = useState<BattingForm>(defaultBatting);
  const [bowlingForm, setBowlingForm] = useState<BowlingForm>(defaultBowling);
  const [fieldingForm, setFieldingForm] = useState<FieldingForm>(defaultFielding);

  const [hasBatting, setHasBatting] = useState(true);
  const [hasBowling, setHasBowling] = useState(false);
  const [hasFielding, setHasFielding] = useState(false);
  const [isWicketKeeper, setIsWicketKeeper] = useState(false);

  const { mutateAsync: createMatch, isPending } = useCreateMatch();
  const { mutateAsync: createBattingStats } = useCreateBattingStats();
  const { mutateAsync: createBowlingStats } = useCreateBowlingStats();
  const { mutateAsync: createFieldingStats } = useCreateFieldingStats();

  const updateMatch   = (k: keyof MatchForm,   v: string | boolean) => setMatchForm(p => ({ ...p, [k]: v }));
  const updateBatting = (k: keyof BattingForm, v: string | boolean) => setBattingForm(p => ({ ...p, [k]: v }));
  const updateBowling = (k: keyof BowlingForm, v: string | boolean) => setBowlingForm(p => ({ ...p, [k]: v }));
  const updateFielding= (k: keyof FieldingForm,v: string)           => setFieldingForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!matchForm.opponent.trim()) {
      Alert.alert("Required", "Please enter an opponent name.");
      return;
    }

    // Duplicate detection — same date + opponent (case-insensitive) already saved
    const cachedMatches = (queryClient.getQueryData(getListMatchesQueryKey()) ?? []) as Array<{ date: string; opponent: string }>;
    const duplicate = cachedMatches.find(
      (m) =>
        m.date === matchForm.date &&
        m.opponent.trim().toLowerCase() === matchForm.opponent.trim().toLowerCase(),
    );

    if (duplicate) {
      Alert.alert(
        "Already Saved?",
        `You already have a match vs ${duplicate.opponent} on ${duplicate.date}.\n\nSave another anyway?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Save Anyway", style: "default", onPress: () => void doSave() },
        ],
      );
      return;
    }

    void doSave();
  };

  const doSave = async () => {
    try {
      // Snapshot badges earned before this match so we can diff afterwards
      const prevData = (queryClient.getQueryData(getGetPerMatchStatsQueryKey()) ?? []) as PerMatchStat[];
      const prevEarned = new Set(computeBadges(prevData).filter((b) => b.earned).map((b) => b.id));

      const match = await createMatch({
        data: {
          date: matchForm.date,
          opponent: matchForm.opponent,
          venue: matchForm.venue || undefined,
          matchType: matchForm.matchType,
          playingFor: matchForm.playingFor || undefined,
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
              battingPosition: battingForm.battingPosition ? Number(battingForm.battingPosition) : undefined,
              howOut: battingForm.howOut || undefined,
              badUmpireDecision: battingForm.badUmpireDecision,
              ballsToFifty: battingForm.ballsToFifty ? Number(battingForm.ballsToFifty) : undefined,
              ballsToHundred: battingForm.ballsToHundred ? Number(battingForm.ballsToHundred) : undefined,
              ballsToHundredFifty: battingForm.ballsToHundredFifty ? Number(battingForm.ballsToHundredFifty) : undefined,
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

      // Refetch all queries and compute newly earned badges
      await Promise.all([
        queryClient.refetchQueries({ queryKey: getGetPerMatchStatsQueryKey() }),
        queryClient.refetchQueries({ queryKey: getListMatchesQueryKey() }),
        queryClient.refetchQueries({ queryKey: getGetStatsSummaryQueryKey() }),
      ]);

      const freshData = (queryClient.getQueryData(getGetPerMatchStatsQueryKey()) ?? []) as PerMatchStat[];

      // Career badges earned for the first time this match
      const gained = computeBadges(freshData).filter((b) => b.earned && !b.isNegative && !prevEarned.has(b.id));

      // Per-match milestone celebrations — fire every time the event occurs
      type PopupBadge = { id: string; icon: string; label: string; imageKey?: string };
      const matchEvents: PopupBadge[] = [];

      if (hasBatting && battingForm.runs !== "") {
        const runs  = Number(battingForm.runs) || 0;
        const balls = Number(battingForm.ballsFaced) || 0;
        const sixes = Number(battingForm.sixes) || 0;
        const fours = Number(battingForm.fours) || 0;

        if (runs >= 150)      matchEvents.push({ id: "first150",    icon: "💎", label: "150 Club" });
        else if (runs >= 100) matchEvents.push({ id: "first100",    icon: "💯", label: "Century", imageKey: "century" });
        else if (runs >= 50)  matchEvents.push({ id: "first50",     icon: "🏏", label: "Half-Century" });

        if (runs >= 50 && balls > 0 && balls < 20)
          matchEvents.push({ id: "pinchHitter", icon: "⚡", label: "Pinch Hitter", imageKey: "pinch-hitter" });
        if (sixes >= 5)  matchEvents.push({ id: "bighitter", icon: "💥", label: "Big Hitter" });
        if (fours >= 10) matchEvents.push({ id: "boundary",  icon: "🏅", label: "Boundary Getter" });
      }

      if (hasBowling && bowlingForm.overs !== "") {
        const wickets = Number(bowlingForm.wickets) || 0;
        if (wickets >= 5)      matchEvents.push({ id: "fivewkt",  icon: "🔥", label: "Five-For" });
        if (bowlingForm.hatTrick) matchEvents.push({ id: "magician", icon: "🪄", label: "Magician" });
      }

      if (matchForm.playerOfTheMatch)
        matchEvents.push({ id: "potm", icon: "⭐", label: "Player of the Match" });

      if (hasFielding) {
        const catches = Number(fieldingForm.catches) || 0;
        if (catches >= 3) matchEvents.push({ id: "buckethands", icon: "🧤", label: "Bucket Hands" });
      }

      // Merge: career first-earns take priority, then per-match events (deduplicated)
      const gainedIds = new Set(gained.map((b) => b.id));
      const allCelebrations: PopupBadge[] = [
        ...gained.map((b) => ({ id: b.id, icon: b.icon, label: b.label, imageKey: b.imageKey })),
        ...matchEvents.filter((e) => !gainedIds.has(e.id)),
      ];

      // Reset form
      setMatchForm(defaultMatch);
      setBattingForm(defaultBatting);
      setBowlingForm(defaultBowling);
      setFieldingForm(defaultFielding);
      setHasBatting(true);
      setHasBowling(false);
      setHasFielding(false);
      setIsWicketKeeper(false);

      if (allCelebrations.length > 0) {
        setPopupBadges(allCelebrations);
        fadeAnim.setValue(0);
        slideAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      } else {
        router.replace("/");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      Alert.alert("Error", `Failed to save: ${msg}`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {popupBadges.length > 0 && (
        <Animated.View
          style={[
            styles.badgePopup,
            {
              opacity: fadeAnim,
              top: insets.top + 24,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.popupHandle} />
          <Text style={styles.popupTitle}>
            🎉 Badge{popupBadges.length > 1 ? "s" : ""} Unlocked!
          </Text>
          {popupBadges.map((b) => (
            <View key={b.id} style={styles.popupRow}>
              <Text style={styles.popupIcon}>{b.icon}</Text>
              <Text style={styles.popupLabel}>{b.label}</Text>
            </View>
          ))}
          <Text style={styles.popupHint}>Swipe up to dismiss</Text>
        </Animated.View>
      )}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 180 : 140) }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Match Info ── */}
        <SectionCard icon="🏏" title="Match Info" enabled alwaysOpen>
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

          <Field label="Playing For">
            <Input
              value={matchForm.playingFor}
              onChangeText={(v) => updateMatch("playingFor", v)}
              placeholder="e.g. City CC, School XI"
            />
          </Field>

          <Row>
            <Field label="Venue" half>
              <Input
                value={matchForm.venue}
                onChangeText={(v) => updateMatch("venue", v)}
                placeholder="Optional"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label="Match Type" half>
              <Input
                value={matchForm.matchType}
                onChangeText={(v) => updateMatch("matchType", v)}
                placeholder="e.g. Cup, Club…"
              />
            </Field>
          </Row>

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
        </SectionCard>

        {/* ── Batting ── */}
        <SectionCard
          icon="🏏"
          title="Batting"
          enabled={hasBatting}
          onToggle={setHasBatting}
        >
          <Row>
            <Field label="Runs Scored" half>
              <Input
                value={battingForm.runs}
                onChangeText={(v) => updateBatting("runs", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label="Balls Faced" half>
              <Input
                value={battingForm.ballsFaced}
                onChangeText={(v) => updateBatting("ballsFaced", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
          </Row>

          <Row>
            <Field label="Fours" half>
              <Input
                value={battingForm.fours}
                onChangeText={(v) => updateBatting("fours", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label="Sixes" half>
              <Input
                value={battingForm.sixes}
                onChangeText={(v) => updateBatting("sixes", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
          </Row>

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
            sublabel="Were you given out incorrectly?"
            value={battingForm.badUmpireDecision}
            onValueChange={(v) => updateBatting("badUmpireDecision", v)}
          />

          <Field label="Balls to Reach 50">
            <Input
              value={battingForm.ballsToFifty}
              onChangeText={(v) => updateBatting("ballsToFifty", v)}
              placeholder="e.g. 48"
              keyboardType="numeric"
            />
          </Field>

          <Field label="Balls to Reach 100">
            <Input
              value={battingForm.ballsToHundred}
              onChangeText={(v) => updateBatting("ballsToHundred", v)}
              placeholder="e.g. 82"
              keyboardType="numeric"
            />
          </Field>

          <Field label="Balls to Reach 150">
            <Input
              value={battingForm.ballsToHundredFifty}
              onChangeText={(v) => updateBatting("ballsToHundredFifty", v)}
              placeholder="e.g. 121"
              keyboardType="numeric"
            />
          </Field>
        </SectionCard>

        {/* ── Bowling ── */}
        <SectionCard
          icon="🎳"
          title="Bowling"
          enabled={hasBowling}
          onToggle={setHasBowling}
        >
          <Row>
            <Field label="Wickets" half>
              <Input
                value={bowlingForm.wickets}
                onChangeText={(v) => updateBowling("wickets", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label="Overs" half>
              <Input
                value={bowlingForm.overs}
                onChangeText={(v) => updateBowling("overs", v)}
                placeholder="0.0"
                keyboardType="decimal-pad"
              />
            </Field>
          </Row>

          <Row>
            <Field label="Runs Conceded" half>
              <Input
                value={bowlingForm.runsConceded}
                onChangeText={(v) => updateBowling("runsConceded", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label="Maidens" half>
              <Input
                value={bowlingForm.maidens}
                onChangeText={(v) => updateBowling("maidens", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
          </Row>

          <Row>
            <Field label="No Balls" half>
              <Input
                value={bowlingForm.noBalls}
                onChangeText={(v) => updateBowling("noBalls", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label="Wides" half>
              <Input
                value={bowlingForm.wides}
                onChangeText={(v) => updateBowling("wides", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
          </Row>

          <Row>
            <Field label="Bowled Wkts" half>
              <Input
                value={bowlingForm.bowledWickets}
                onChangeText={(v) => updateBowling("bowledWickets", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label="LBW Wkts" half>
              <Input
                value={bowlingForm.lbwWickets}
                onChangeText={(v) => updateBowling("lbwWickets", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
          </Row>

          <ToggleRow
            label="Hat Trick!"
            value={bowlingForm.hatTrick}
            onValueChange={(v) => updateBowling("hatTrick", v)}
          />
          <ToggleRow
            label="Would Have Referred?"
            sublabel="Not-out that should have been given"
            value={bowlingForm.wouldHaveReferred}
            onValueChange={(v) => updateBowling("wouldHaveReferred", v)}
          />
        </SectionCard>

        {/* ── Fielding ── */}
        <SectionCard
          icon="🧤"
          title="Fielding"
          enabled={hasFielding}
          onToggle={setHasFielding}
        >
          <Row>
            <Field label="Catches" half>
              <Input
                value={fieldingForm.catches}
                onChangeText={(v) => updateFielding("catches", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label="Dropped" half>
              <Input
                value={fieldingForm.droppedCatches}
                onChangeText={(v) => updateFielding("droppedCatches", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
          </Row>

          <Field label="Run Outs">
            <Input
              value={fieldingForm.runOuts}
              onChangeText={(v) => updateFielding("runOuts", v)}
              placeholder="0"
              keyboardType="numeric"
            />
          </Field>

          <ToggleRow
            label="Wicket Keeper?"
            sublabel="Add stumpings for this match"
            value={isWicketKeeper}
            onValueChange={setIsWicketKeeper}
          />

          {isWicketKeeper && (
            <Row>
              <Field label="Stumpings" half>
                <Input
                  value={fieldingForm.stumpings}
                  onChangeText={(v) => updateFielding("stumpings", v)}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </Field>
              <View style={{ width: 10 }} />
              <Field label="Missed Stumpings" half>
                <Input
                  value={fieldingForm.missedStumpings}
                  onChangeText={(v) => updateFielding("missedStumpings", v)}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </Field>
            </Row>
          )}
        </SectionCard>

      </ScrollView>

      {/* Floating save bar — sits above the tab bar */}
      <View
        style={[
          styles.saveBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            bottom: insets.bottom + (Platform.OS === "web" ? 84 : 49),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isPending ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={isPending}
        >
          <Feather name="check-circle" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{isPending ? "Saving…" : "Save Match"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { padding: 12, gap: 12 },

  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { flex: 1, fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 4 },

  field: { marginBottom: 12 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },

  row: { flexDirection: "row", marginBottom: 0 },

  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 2,
  },
  toggleLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  toggleSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },

  chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  badgePopup: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: "#0f2218",
    borderColor: "#4ade80",
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  popupTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#4ade80",
    marginBottom: 14,
    textAlign: "center",
  },
  popupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  popupHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4ade8066",
    marginBottom: 14,
  },
  popupIcon: { fontSize: 26 },
  popupLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  popupHint: {
    fontSize: 11,
    color: "#4ade8066",
    fontFamily: "Inter_400Regular",
    marginTop: 10,
    letterSpacing: 0.3,
  },

  saveBar: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
