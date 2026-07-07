import {
  useGetStatsSummary,
  useGetPerMatchStats,
  useListMatches,
  useListFixtures,
  useDeleteFixture,
  getListFixturesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useFocusEffect } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SeasonTargets } from "@/components/SeasonTargets";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSeasonContext } from "@/contexts/SeasonContext";
import { useColors } from "@/hooks/useColors";
import { usePlayerName } from "@/hooks/usePlayerName";
import { SplitFlapDisplay } from "@/components/SplitFlapDisplay";
import { ScoreboardCard } from "@/components/ScoreboardCard";
import { NextMatchCard } from "@/components/NextMatchCard";
import { AddFixtureModal } from "@/components/AddFixtureModal";
import { BallHitsStumps, StumpsExploding, CricketPitch, TwoCricketCaps, BarChartStats, BullseyeTarget, TrendLine, StackedCards, CricketBallSvg } from "@/components/CricketIcons";

// ── Season list builder ────────────────────────────────────────────────────────
type SeasonDef = { label: string; startDate: string; endDate: string };

function buildSeasonList(dates: string[], region: "england" | "subcontinent"): SeasonDef[] {
  const now = new Date();
  const y = now.getFullYear();
  const mon = now.getMonth();
  if (region === "england") {
    const years = new Set<string>(dates.map((d) => d.slice(0, 4)).filter(Boolean));
    years.add(String(y));
    return [...years].sort().reverse().map((yr) => ({
      label: yr,
      startDate: `${yr}-01-01`,
      endDate: `${yr}-12-31`,
    }));
  } else {
    const keys = new Set<number>();
    keys.add(mon >= 9 ? y : y - 1);
    for (const d of dates) {
      if (!d || d.length < 7) continue;
      const dy = parseInt(d.slice(0, 4), 10);
      const dm = parseInt(d.slice(5, 7), 10) - 1;
      keys.add(dm >= 9 ? dy : dy - 1);
    }
    return [...keys].sort((a, b) => b - a).map((startY) => ({
      label: `${startY}/${String(startY + 1).slice(2)}`,
      startDate: `${startY}-10-01`,
      endDate: `${startY + 1}-09-30`,
    }));
  }
}

// ── Bar Chart (pure View — fixed pixel heights, works on web + native) ──────────

const BAR_AREA_H = 120;
const X_LABEL_H = 22;
const Y_LABEL_W = 30;

function BarChart({
  data,
  barColor,
  colors,
}: {
  data: { label: string; value: number }[];
  barColor: string;
  colors: ReturnType<typeof useColors>;
}) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const gridTops = [0, BAR_AREA_H / 2, BAR_AREA_H];

  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: Y_LABEL_W, height: BAR_AREA_H, justifyContent: "space-between", alignItems: "flex-end", paddingRight: 4 }}>
          <Text style={[styles.yLabel, { color: colors.mutedForeground }]}>{maxVal}</Text>
          <Text style={[styles.yLabel, { color: colors.mutedForeground }]}>{Math.round(maxVal / 2)}</Text>
          <Text style={[styles.yLabel, { color: colors.mutedForeground }]}>0</Text>
        </View>

        <View style={{ flex: 1, height: BAR_AREA_H, position: "relative" }}>
          {gridTops.map((top, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top,
                height: StyleSheet.hairlineWidth,
                backgroundColor: colors.border,
              }}
            />
          ))}

          <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", paddingBottom: 1 }}>
            {data.map((d, i) => {
              const pct = maxVal > 0 ? d.value / maxVal : 0;
              const barH = Math.max(Math.round(pct * BAR_AREA_H), d.value > 0 ? 2 : 0);
              return (
                <View key={i} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: BAR_AREA_H }}>
                  {d.value > 0 && barH > 18 && (
                    <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: barColor, marginBottom: 2 }}>
                      {d.value}
                    </Text>
                  )}
                  <View
                    style={{
                      width: "60%",
                      height: barH,
                      backgroundColor: barColor,
                      borderRadius: 3,
                      opacity: 0.88,
                    }}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", marginLeft: Y_LABEL_W, height: X_LABEL_H, marginTop: 4 }}>
        {data.map((d, i) => (
          <Text key={i} style={[styles.xLabel, { color: colors.mutedForeground, flex: 1 }]} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  colors,
}: {
  label: string;
  value: string | number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.foreground }]}>{label}</Text>
    </View>
  );
}

function ResultBadge({
  result,
  colors,
}: {
  result?: string | null;
  colors: ReturnType<typeof useColors>;
}) {
  if (!result) return null;
  const isWin = result.toLowerCase().startsWith("w");
  const isLoss = result.toLowerCase().startsWith("l");
  const bg = isWin ? "#dcf5e3" : isLoss ? "#fde8e8" : "#f0f0f0";
  const fg = isWin ? "#1a7340" : isLoss ? "#c0392b" : "#555";
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{result}</Text>
    </View>
  );
}

// ── Form Guide ─────────────────────────────────────────────────────────────────

type PerMatchStat = {
  matchId: number;
  date: string;
  opponent: string;
  matchType?: string | null;
  runs?: number | null;
  ballsFaced?: number | null;
  wickets?: number | null;
  overs?: number | null;
  runsConceded?: number | null;
  howOut?: string | null;
  result?: string | null;
  catches?: number | null;
  runOuts?: number | null;
  stumpings?: number | null;
  droppedCatches?: number | null;
  battingPosition?: number | null;
};

function FormGuideSection({ data, colors, onPress }: {
  data: PerMatchStat[];
  colors: ReturnType<typeof useColors>;
  onPress: (id: number) => void;
}) {
  const last5 = data.slice(-5).reverse();
  if (last5.length === 0) return null;

  const getRunColor = (runs: number | null | undefined) => {
    if (runs == null) return colors.border;
    if (runs >= 50) return "#16a34a";
    if (runs >= 25) return "#4A9E61";
    return "#C0392B";
  };

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Form</Text>
      <View style={styles.formRow}>
        {last5.map((m) => {
          const runs = m.runs;
          const wkts = m.wickets;
          const isWin = m.result?.toLowerCase().startsWith("w");
          const isLoss = m.result?.toLowerCase().startsWith("l");
          const dotColor = isWin ? "#16a34a" : isLoss ? "#ef4444" : colors.mutedForeground;

          return (
            <TouchableOpacity
              key={m.matchId}
              onPress={() => onPress(m.matchId)}
              style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.formResultDot, { backgroundColor: dotColor }]} />
              {runs != null && (
                <Text style={[styles.formStat, { color: getRunColor(runs) }]}>{runs}</Text>
              )}
              {wkts != null && (
                <Text style={[styles.formWkts, { color: colors.accent }]}>{wkts}w</Text>
              )}
              <Text style={[styles.formOpponent, { color: colors.mutedForeground }]} numberOfLines={1}>
                {m.opponent.slice(0, 4)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Best Performances ─────────────────────────────────────────────────────────

function BestPerformancesSection({ data, colors, onPress }: {
  data: PerMatchStat[];
  colors: ReturnType<typeof useColors>;
  onPress: (id: number) => void;
}) {
  const bestBat = useMemo(() => {
    const innings = data.filter((m) => m.runs != null);
    return innings.reduce<PerMatchStat | null>((best, m) => {
      if (!best || (m.runs ?? 0) > (best.runs ?? 0)) return m;
      return best;
    }, null);
  }, [data]);

  const bestBowl = useMemo(() => {
    const spells = data.filter((m) => m.wickets != null);
    return spells.reduce<PerMatchStat | null>((best, m) => {
      if (!best) return m;
      const w = m.wickets ?? 0;
      const bw = best.wickets ?? 0;
      if (w > bw) return m;
      if (w === bw && (m.runsConceded ?? 999) < (best.runsConceded ?? 999)) return m;
      return best;
    }, null);
  }, [data]);

  if (!bestBat && !bestBowl) return null;

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Best Performances</Text>
      <View style={styles.bestRow}>
        {bestBat && (
          <TouchableOpacity
            onPress={() => onPress(bestBat.matchId)}
            style={[styles.bestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.bestIcon]}>🏏</Text>
            <Text style={[styles.bestValue, { color: colors.primary }]}>
              {`${bestBat.runs}${!bestBat.howOut || bestBat.howOut.toLowerCase() === 'not out' ? '*' : ''}`}
            </Text>
            <Text style={[styles.bestLabel, { color: colors.foreground }]}>Top Score</Text>
            <Text style={[styles.bestSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              vs {bestBat.opponent}
            </Text>
          </TouchableOpacity>
        )}
        {bestBowl && (
          <TouchableOpacity
            onPress={() => onPress(bestBowl.matchId)}
            style={[styles.bestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <BallHitsStumps size={32} />
            <Text style={[styles.bestValue, { color: colors.accent }]}>
              {bestBowl.wickets}/{bestBowl.runsConceded ?? 0}
            </Text>
            <Text style={[styles.bestLabel, { color: colors.foreground }]}>Best Bowling</Text>
            <Text style={[styles.bestSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              vs {bestBowl.opponent}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Dismissal Breakdown ────────────────────────────────────────────────────────

const DISMISSAL_COLORS_M = ["#1B5E2B","#C0392B","#4A9E61","#922B21","#2D7D45","#E55A4A","#7A6E5F","#0A3018"];

function DismissalSection({ data, colors }: {
  data: PerMatchStat[];
  colors: ReturnType<typeof useColors>;
}) {
  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const m of data) {
      if (m.howOut) {
        const key = m.howOut.trim();
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  if (counts.length === 0) return null;

  const total = counts.reduce((s, c) => s + c.value, 0);
  const maxVal = Math.max(...counts.map((c) => c.value), 1);

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dismissal Breakdown</Text>
      <View style={[styles.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {counts.map((c, i) => {
          const barPct = c.value / maxVal;
          const pct = total > 0 ? Math.round((c.value / total) * 100) : 0;
          return (
            <View key={c.name} style={styles.dismissalRow}>
              <Text style={[styles.dismissalName, { color: colors.foreground }]} numberOfLines={1}>
                {c.name}
              </Text>
              <View style={styles.dismissalBarWrap}>
                <View style={[styles.dismissalBarBg, { backgroundColor: colors.border }]}>
                  <View
                    style={[styles.dismissalBarFill, {
                      width: `${barPct * 100}%` as any,
                      backgroundColor: DISMISSAL_COLORS_M[i % DISMISSAL_COLORS_M.length],
                    }]}
                  />
                </View>
              </View>
              <Text style={[styles.dismissalCount, { color: colors.mutedForeground }]}>
                {c.value} <Text style={{ fontSize: 9 }}>({pct}%)</Text>
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Match Type Breakdown ───────────────────────────────────────────────────────

function MatchTypeSection({ data, colors }: {
  data: PerMatchStat[];
  colors: ReturnType<typeof useColors>;
}) {
  const rows = React.useMemo(() => {
    const map = new Map<string, PerMatchStat[]>();
    for (const m of data) {
      const key = m.matchType ?? "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    if (map.size < 2) return [];
    return Array.from(map.entries())
      .map(([type, ms]) => {
        const innings = ms.filter((m) => m.runs != null);
        const runs = innings.reduce((s, m) => s + (m.runs ?? 0), 0);
        const wkts = ms.filter((m) => m.wickets != null).reduce((s, m) => s + (m.wickets ?? 0), 0);
        return {
          type,
          matches: ms.length,
          runs,
          avg: innings.length > 0 ? (runs / innings.length).toFixed(1) : "—",
          wickets: wkts,
          wins: ms.filter((m) => m.result === "Win").length,
        };
      })
      .sort((a, b) => b.matches - a.matches);
  }, [data]);

  if (rows.length === 0) return null;

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>By Match Type</Text>
      <View style={[styles.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          {["Type","M","Runs","Avg","Wkts","W"].map(h => (
            <Text key={h} style={[styles.tableHead, { color: colors.mutedForeground, flex: h === "Type" ? 2 : 1 }]}>{h}</Text>
          ))}
        </View>
        {rows.map((r, i) => (
          <View key={r.type} style={[styles.tableRow, i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
            <Text style={[styles.tableCell, { color: colors.foreground, fontFamily: "Inter_600SemiBold", flex: 2 }]} numberOfLines={1}>{r.type}</Text>
            <Text style={[styles.tableCell, { color: colors.mutedForeground, flex: 1 }]}>{r.matches}</Text>
            <Text style={[styles.tableCell, { color: colors.foreground, fontFamily: "Inter_600SemiBold", flex: 1 }]}>{r.runs}</Text>
            <Text style={[styles.tableCell, { color: colors.mutedForeground, flex: 1 }]}>{r.avg}</Text>
            <Text style={[styles.tableCell, { color: colors.foreground, flex: 1 }]}>{r.wickets}</Text>
            <Text style={[styles.tableCell, { color: colors.primary, fontFamily: "Inter_600SemiBold", flex: 1 }]}>{r.wins}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Head-to-Head ──────────────────────────────────────────────────────────────

function HeadToHeadSection({ data, colors, onPress }: {
  data: PerMatchStat[];
  colors: ReturnType<typeof useColors>;
  onPress: (id: number) => void;
}) {
  const records = useMemo(() => {
    const map = new Map<string, { played: number; wins: number; losses: number; avgRuns: number | null; lastMatchId: number }>();
    for (const m of data) {
      if (!map.has(m.opponent)) map.set(m.opponent, { played: 0, wins: 0, losses: 0, avgRuns: null, lastMatchId: m.matchId });
      const rec = map.get(m.opponent)!;
      rec.played++;
      rec.lastMatchId = m.matchId;
      if (m.result === "Win") rec.wins++;
      else if (m.result === "Loss") rec.losses++;
    }
    for (const [opp, rec] of map.entries()) {
      const innings = data.filter((m) => m.opponent === opp && m.runs != null);
      rec.avgRuns = innings.length > 0
        ? Math.round(innings.reduce((s, m) => s + (m.runs ?? 0), 0) / innings.length)
        : null;
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b.played - a.played)
      .slice(0, 6);
  }, [data]);

  if (records.length === 0) return null;

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>vs Opponents</Text>
      <View style={[styles.h2hCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Header */}
        <View style={[styles.h2hRow, styles.h2hHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.h2hOpponent, styles.h2hHeaderText, { color: colors.mutedForeground }]}>Opponent</Text>
          <Text style={[styles.h2hCell, styles.h2hHeaderText, { color: colors.mutedForeground }]}>P</Text>
          <Text style={[styles.h2hCell, styles.h2hHeaderText, { color: colors.mutedForeground }]}>W</Text>
          <Text style={[styles.h2hCell, styles.h2hHeaderText, { color: colors.mutedForeground }]}>L</Text>
          <Text style={[styles.h2hCell, styles.h2hHeaderText, { color: colors.mutedForeground }]}>Avg</Text>
        </View>
        {records.map(([opp, rec], i) => (
          <TouchableOpacity
            key={opp}
            onPress={() => onPress(rec.lastMatchId)}
            style={[
              styles.h2hRow,
              i < records.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
            ]}
          >
            <Text style={[styles.h2hOpponent, { color: colors.foreground }]} numberOfLines={1}>{opp}</Text>
            <Text style={[styles.h2hCell, { color: colors.mutedForeground }]}>{rec.played}</Text>
            <Text style={[styles.h2hCell, { color: "#16a34a" }]}>{rec.wins}</Text>
            <Text style={[styles.h2hCell, { color: "#ef4444" }]}>{rec.losses}</Text>
            <Text style={[styles.h2hCell, { color: colors.foreground }]}>{rec.avgRuns ?? "—"}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Shortcut Pills ─────────────────────────────────────────────────────────────

const SHORTCUTS = [
  { label: "Stats", key: "stats" },
  { label: "Targets", key: "goals" },
  { label: "Form", key: "form" },
  { label: "Dismissals", key: "dismissals" },
  { label: "Match Types", key: "matchtype" },
  { label: "Head-to-Head", key: "h2h" },
  { label: "Recent", key: "recent" },
];

function ShortcutPills({
  colors,
  onPress,
}: {
  colors: ReturnType<typeof useColors>;
  onPress: (key: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pillsRow}
      style={{ flexShrink: 0 }}
    >
      {SHORTCUTS.map((s) => (
        <TouchableOpacity
          key={s.key}
          onPress={() => onPress(s.key)}
          style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          {s.key === "stats" ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <BarChartStats size={18} />
              <Text style={[styles.pillText, { color: colors.foreground }]}>{s.label}</Text>
            </View>
          ) : s.key === "goals" ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <BullseyeTarget size={17} />
              <Text style={[styles.pillText, { color: colors.foreground }]}>{s.label}</Text>
            </View>
          ) : s.key === "form" ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <TrendLine size={18} />
              <Text style={[styles.pillText, { color: colors.foreground }]}>{s.label}</Text>
            </View>
          ) : s.key === "dismissals" ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <StumpsExploding size={15} />
              <Text style={[styles.pillText, { color: colors.foreground }]}>{s.label}</Text>
            </View>
          ) : s.key === "matchtype" ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <CricketPitch size={20} />
              <Text style={[styles.pillText, { color: colors.foreground }]}>{s.label}</Text>
            </View>
          ) : s.key === "h2h" ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <TwoCricketCaps size={22} />
              <Text style={[styles.pillText, { color: colors.foreground }]}>{s.label}</Text>
            </View>
          ) : s.key === "recent" ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <StackedCards size={18} />
              <Text style={[styles.pillText, { color: colors.foreground }]}>{s.label}</Text>
            </View>
          ) : (
            <Text style={[styles.pillText, { color: colors.foreground }]}>{s.label}</Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { playerName } = usePlayerName();
  const router = useRouter();

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
    isRefetching: summaryRefetching,
  } = useGetStatsSummary();

  const {
    data: matches,
    isLoading: matchesLoading,
    refetch: refetchMatches,
    isRefetching: matchesRefetching,
  } = useListMatches();

  const {
    data: perMatch,
    refetch: refetchPerMatch,
    isRefetching: perMatchRefetching,
  } = useGetPerMatchStats();

  const { data: fixtures = [] } = useListFixtures();
  const { mutateAsync: deleteFixtureMutation } = useDeleteFixture();
  const qc = useQueryClient();
  const [showAddFixture, setShowAddFixture] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextFixture = fixtures
    .filter((f) => new Date(f.date + "T00:00:00") >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;

  const handleDeleteFixture = async (id: number) => {
    await deleteFixtureMutation(id);
    await qc.invalidateQueries({ queryKey: getListFixturesQueryKey() });
  };

  const isLoading = summaryLoading || matchesLoading;

  const { seasonLabel, isMatchInSeason, region } = useSeasonContext();
  const allPerMatchEarly = perMatch ?? [];

  // ── Season selector ────────────────────────────────────────────────────────
  const availableSeasons = useMemo(
    () => buildSeasonList(allPerMatchEarly.map((m) => m.date ?? "").filter(Boolean), region),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [perMatch, region]
  );
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);
  const activeSeason: SeasonDef | undefined = availableSeasons[selectedSeasonIdx] ?? availableSeasons[0];
  const activeSeasonLabel = activeSeason?.label ?? seasonLabel;
  const activeIsMatchInSeason = (date: string | null | undefined): boolean => {
    if (!date || !activeSeason) return false;
    return date >= activeSeason.startDate && date <= activeSeason.endDate;
  };
  const seasonRuns = allPerMatchEarly
    .filter((m) => activeIsMatchInSeason(m.date) && m.runs != null)
    .reduce((s, m) => s + (m.runs ?? 0), 0);
  const seasonWickets = allPerMatchEarly
    .filter((m) => activeIsMatchInSeason(m.date) && m.wickets != null)
    .reduce((s, m) => s + (m.wickets ?? 0), 0);
  const seasonMatches = allPerMatchEarly.filter((m) => activeIsMatchInSeason(m.date)).length;

  // ── Detailed season batting stats ──────────────────────────────────────────
  const seasonBatted = allPerMatchEarly.filter((m) => activeIsMatchInSeason(m.date) && m.runs != null);
  const seasonHS = seasonBatted.reduce((max, m) => Math.max(max, m.runs ?? 0), 0);
  const seasonFifties = seasonBatted.filter((m) => (m.runs ?? 0) >= 50 && (m.runs ?? 0) < 100).length;
  const seasonCenturies = seasonBatted.filter((m) => (m.runs ?? 0) >= 100).length;
  const seasonInnings = seasonBatted.length;
  const seasonNotOuts = seasonBatted.filter(
    (m) => !m.howOut || m.howOut.toLowerCase() === "not out"
  ).length;
  const seasonBattingDismissals = seasonInnings - seasonNotOuts;
  const seasonBattingAvg =
    seasonBattingDismissals > 0
      ? (seasonRuns / seasonBattingDismissals).toFixed(1)
      : "—";
  const seasonBallsFaced = seasonBatted.reduce((s, m) => s + (m.ballsFaced ?? 0), 0);
  const seasonSR =
    seasonBallsFaced > 0
      ? ((seasonRuns / seasonBallsFaced) * 100).toFixed(1)
      : "—";

  // ── Detailed season bowling stats ──────────────────────────────────────────
  const seasonCatches = allPerMatchEarly
    .filter((m) => activeIsMatchInSeason(m.date))
    .reduce((s, m) => s + (m.catches ?? 0), 0);
  const seasonBowled = allPerMatchEarly.filter((m) => activeIsMatchInSeason(m.date) && m.wickets != null);
  const seasonRunsConceded = seasonBowled.reduce((s, m) => s + (m.runsConceded ?? 0), 0);
  const seasonOvers = seasonBowled.reduce((s, m) => s + (m.overs ?? 0), 0);
  const seasonEconomy = seasonOvers > 0 ? (seasonRunsConceded / seasonOvers).toFixed(2) : "—";
  const seasonBowlingAvg =
    seasonWickets > 0 ? (seasonRunsConceded / seasonWickets).toFixed(1) : "—";
  const seasonBestBowling = seasonBowled
    .slice()
    .sort(
      (a, b) =>
        (b.wickets ?? 0) - (a.wickets ?? 0) ||
        (a.runsConceded ?? 999) - (b.runsConceded ?? 999)
    )[0];
  const seasonBest = seasonBestBowling
    ? `${seasonBestBowling.wickets}/${seasonBestBowling.runsConceded ?? "?"}`
    : "—";

  // ── Season comparison deltas ────────────────────────────────────────────────
  const prevSeason = availableSeasons[selectedSeasonIdx + 1];
  const prevSeasonFiltered = prevSeason
    ? allPerMatchEarly.filter((m) => !!m.date && m.date >= prevSeason.startDate && m.date <= prevSeason.endDate)
    : [];
  const prevSeasonRuns = prevSeasonFiltered.filter((m) => m.runs != null).reduce((s, m) => s + (m.runs ?? 0), 0);
  const prevSeasonWickets = prevSeasonFiltered.filter((m) => m.wickets != null).reduce((s, m) => s + (m.wickets ?? 0), 0);
  const prevSeasonCatches = prevSeasonFiltered.reduce((s, m) => s + (m.catches ?? 0), 0);
  const runsDelta = prevSeason != null ? seasonRuns - prevSeasonRuns : null;
  const wicketsDelta = prevSeason != null ? seasonWickets - prevSeasonWickets : null;
  const catchesDelta = prevSeason != null ? seasonCatches - prevSeasonCatches : null;

  // ── Form streak ─────────────────────────────────────────────────────────────
  const sortedForStreak = [...allPerMatchEarly]
    .filter((m) => activeIsMatchInSeason(m.date))
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  let runStreak = 0;
  for (let i = sortedForStreak.length - 1; i >= 0; i--) {
    const m = sortedForStreak[i];
    if (m.runs == null) continue;
    if ((m.runs ?? 0) >= 30) { runStreak++; } else { break; }
  }

  // ── Batting position breakdown ───────────────────────────────────────────────
  const positionAccum: Record<string, { runs: number; innings: number; notOuts: number }> = {};
  for (const m of allPerMatchEarly) {
    if (m.runs == null || !m.battingPosition) continue;
    const p = String(m.battingPosition);
    if (!positionAccum[p]) positionAccum[p] = { runs: 0, innings: 0, notOuts: 0 };
    positionAccum[p].runs += m.runs ?? 0;
    positionAccum[p].innings++;
    if (!m.howOut || m.howOut.toLowerCase() === "not out") positionAccum[p].notOuts++;
  }
  const positionRows = Object.entries(positionAccum)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([pos, { runs, innings, notOuts }]) => {
      const p = Number(pos);
      const label = p <= 2 ? "Opener" : p <= 4 ? "Top Order" : p <= 7 ? "Middle Order" : "Lower Order";
      const dismissals = innings - notOuts;
      return { pos: p, label, runs, innings, avg: dismissals > 0 ? (runs / dismissals).toFixed(1) : "—" };
    });

  // ── Season pace projection ───────────────────────────────────────────────────
  let projectedRuns: number | null = null;
  let projectedWickets: number | null = null;
  if (activeSeason && seasonMatches > 0) {
    const today = new Date();
    const start = new Date(activeSeason.startDate);
    const end = new Date(activeSeason.endDate);
    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = Math.min(today.getTime() - start.getTime(), totalMs);
    const pct = totalMs > 0 ? elapsedMs / totalMs : 0;
    if (pct > 0.05 && pct < 0.95) {
      projectedRuns = Math.round(seasonRuns / pct);
      projectedWickets = Math.round(seasonWickets / pct);
    }
  }

  // ── Career runs flip (hero) ────────────────────────────────────────────────
  const [flapValue, setFlapValue] = useState(0);
  const flapIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerCountUp = useCallback((target: number) => {
    if (flapIntervalRef.current) clearInterval(flapIntervalRef.current);
    if (target === 0) { setFlapValue(0); return; }
    setFlapValue(0);
    const DURATION = 1600;
    const STEPS = 45;
    const INTERVAL = DURATION / STEPS;
    let step = 0;
    flapIntervalRef.current = setInterval(() => {
      step++;
      const t = step / STEPS;
      const eased = 1 - Math.pow(1 - t, 3);
      setFlapValue(Math.round(eased * target));
      if (step >= STEPS) {
        clearInterval(flapIntervalRef.current!);
        flapIntervalRef.current = null;
        setFlapValue(target);
      }
    }, INTERVAL);
  }, []);

  // ── Season scoreboard flaps ────────────────────────────────────────────────
  const [seasonFlapRuns,    setSeasonFlapRuns]    = useState(0);
  const [seasonFlapWickets, setSeasonFlapWickets] = useState(0);
  const [seasonFlapCatches, setSeasonFlapCatches] = useState(0);
  const [seasonFlapMatches, setSeasonFlapMatches] = useState(0);
  const seasonFlapRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim  = useRef(new Animated.Value(0)).current;

  const triggerSeasonFlaps = useCallback((runs: number, wickets: number, catches: number, matches: number) => {
    if (seasonFlapRef.current) clearInterval(seasonFlapRef.current);
    setSeasonFlapRuns(0);
    setSeasonFlapWickets(0);
    setSeasonFlapCatches(0);
    setSeasonFlapMatches(0);
    if (runs === 0 && wickets === 0 && catches === 0 && matches === 0) return;
    const DURATION = 1400;
    const STEPS = 40;
    const INTERVAL = DURATION / STEPS;
    let step = 0;
    seasonFlapRef.current = setInterval(() => {
      step++;
      const t = step / STEPS;
      const eased = 1 - Math.pow(1 - t, 3);
      setSeasonFlapRuns(Math.round(eased * runs));
      setSeasonFlapWickets(Math.round(eased * wickets));
      setSeasonFlapCatches(Math.round(eased * catches));
      setSeasonFlapMatches(Math.round(eased * matches));
      if (step >= STEPS) {
        clearInterval(seasonFlapRef.current!);
        seasonFlapRef.current = null;
        setSeasonFlapRuns(runs);
        setSeasonFlapWickets(wickets);
        setSeasonFlapCatches(catches);
        setSeasonFlapMatches(matches);
      }
    }, INTERVAL);
  }, []);

  const careerRuns = summary?.batting.totalRuns ?? 0;

  const animateProgress = useCallback((pct: number) => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: pct / 100,
      duration: 1100,
      delay: 350,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const RUN_MILESTONES = [50, 100, 250, 500, 1000, 2000, 5000];
  const WICKET_MILESTONES = [10, 25, 50, 100, 200];
  const nextRunTarget = RUN_MILESTONES.find((m) => m > (summary?.batting.totalRuns ?? 0)) ?? 5000;
  const prevRunTarget = (() => {
    const idx = RUN_MILESTONES.indexOf(nextRunTarget);
    return idx > 0 ? RUN_MILESTONES[idx - 1] : 0;
  })();
  const nextWicketTarget = WICKET_MILESTONES.find((m) => m > (summary?.bowling.totalWickets ?? 0)) ?? 200;
  const runsPct = Math.min(100, Math.round((((summary?.batting.totalRuns ?? 0) - prevRunTarget) / (nextRunTarget - prevRunTarget)) * 100));
  const wicketsPct = Math.min(100, Math.round(((summary?.bowling.totalWickets ?? 0) / nextWicketTarget) * 100));

  useFocusEffect(
    useCallback(() => {
      triggerCountUp(careerRuns);
      triggerSeasonFlaps(seasonRuns, seasonWickets, seasonCatches, seasonMatches);
      animateProgress(runsPct);
      return () => {
        if (flapIntervalRef.current) clearInterval(flapIntervalRef.current);
        if (seasonFlapRef.current)   clearInterval(seasonFlapRef.current);
      };
    }, [careerRuns, seasonRuns, seasonWickets, seasonCatches, seasonMatches, triggerCountUp, triggerSeasonFlaps, animateProgress, runsPct])
  );

  useEffect(() => {
    if (careerRuns > 0) { triggerCountUp(careerRuns); animateProgress(runsPct); }
  }, [careerRuns, runsPct]);

  useEffect(() => {
    triggerSeasonFlaps(seasonRuns, seasonWickets, seasonCatches, seasonMatches);
  }, [seasonRuns, seasonWickets, seasonCatches, seasonMatches]);

  const isRefreshing = summaryRefetching || matchesRefetching || perMatchRefetching;

  const recentMatches = matches?.slice(0, 5) ?? [];

  const battingAvg =
    summary && (summary.batting as any).battingAverage != null
      ? Number((summary.batting as any).battingAverage).toFixed(1)
      : summary && summary.batting.innings > 0
      ? (summary.batting.totalRuns / summary.batting.innings).toFixed(1)
      : "—";

  const centuries = (summary?.batting as any)?.centuries ?? 0;
  const fifties = (summary?.batting as any)?.fifties ?? 0;
  const ducks = (summary?.batting as any)?.ducks ?? 0;
  const notOuts = (summary?.batting as any)?.notOuts ?? 0;
  const fiveWicketHauls = (summary?.bowling as any)?.fiveWicketHauls ?? 0;
  const totalMaidens = (summary?.bowling as any)?.totalMaidens ?? 0;
  const totalNoBalls = (summary?.bowling as any)?.totalNoBalls ?? 0;
  const totalWides = (summary?.bowling as any)?.totalWides ?? 0;
  const potmCount = (summary as any)?.potmCount ?? 0;
  const bowlingAverage = (summary?.bowling as any)?.bowlingAverage ?? 0;

  const careerLevel = (() => {
    const xp = careerRuns
      + (summary?.batting.innings ?? 0) * 5
      + (summary?.bowling.totalWickets ?? 0) * 15
      + centuries * 300 + fifties * 100
      + potmCount * 75;
    if (xp >= 25000) return { label: "Legend",   color: "#FFB300", next: null };
    if (xp >= 10000) return { label: "Elite",    color: "#A78BFA", next: 25000 - xp };
    if (xp >= 4000)  return { label: "Semi-Pro", color: "#60A5FA", next: 10000 - xp };
    if (xp >= 1500)  return { label: "Amateur",  color: "#34D399", next: 4000  - xp };
    if (xp >= 500)   return { label: "Club",     color: "#FBBF24", next: 1500  - xp };
    return              { label: "Novice",    color: "#9CA3AF", next: 500   - xp };
  })();

  const chartMatches = (perMatch ?? []).filter((m) => activeIsMatchInSeason(m.date)).slice(-12);

  const runsData = chartMatches.map((m) => ({
    label: m.opponent.slice(0, 3).toUpperCase(),
    value: m.runs ?? 0,
  }));

  const wicketsData = chartMatches.map((m) => ({
    label: m.opponent.slice(0, 3).toUpperCase(),
    value: m.wickets ?? 0,
  }));

  const hasChartData = chartMatches.length > 0;
  const allPerMatch = perMatch ?? [];

  const handleMatchPress = (id: number) => router.push(`/match/${id}`);

  const handleShare = async () => {
    const lines = [
      `📊 ${activeSeasonLabel} Season — CricVault`,
      `🏏 ${seasonRuns} runs · Avg ${seasonBattingAvg} · HS ${seasonHS}`,
      `🎳 ${seasonWickets} wickets · Best ${seasonBest}`,
      `🧤 ${seasonCatches} catches · ${seasonMatches} matches`,
    ].join("\n");
    try { await Share.share({ message: lines }); } catch (_) {}
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<Record<string, number>>({});

  const handleShortcut = (key: string) => {
    const y = sectionRefs.current[key];
    if (y != null) scrollViewRef.current?.scrollTo({ y, animated: true });
  };

  const measureSection = (key: string) => (event: any) => {
    sectionRefs.current[key] = event.nativeEvent.layout.y;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
    <ScrollView
      ref={scrollViewRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            refetchSummary();
            refetchMatches();
            refetchPerMatch();
          }}
          tintColor={colors.primary}
        />
      }
    >
      {/* ── Pavilion hero — dark cricket green scoreboard section ── */}
      <LinearGradient
        colors={["#1F4028", "#152C1E", "#0E1A12"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.pavilion, { paddingTop: insets.top }]}
      >
        <ShortcutPills colors={colors} onPress={handleShortcut} />

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={[styles.greeting, { color: colors.pavilionMuted }]}>
              Hi, {playerName || "Cricketer"}
            </Text>
            {isLiquidGlassAvailable() && (
              <TouchableOpacity
                onPress={() => router.push("/settings-modal")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="settings" size={20} color={colors.pavilionMuted} />
              </TouchableOpacity>
            )}
          </View>
          {summary ? (
            <BlurView
              intensity={22}
              tint="dark"
              style={{
                marginTop: 14,
                marginBottom: 4,
                borderRadius: 20,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.13)",
              }}
            >
              <View style={{ backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 }}>

                {/* ── Top row: flap + label + level badge ── */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <SplitFlapDisplay
                    value={flapValue}
                    tileColor="rgba(255,255,255,0.08)"
                    inkColor="#FFFDF8"
                    borderColor="rgba(255,255,255,0.22)"
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Text style={[styles.runsLabel, { color: "#FFFDF8" }]}>Career Runs</Text>
                      <View style={{
                        paddingHorizontal: 8, paddingVertical: 2,
                        borderRadius: 20,
                        backgroundColor: careerLevel.color + "28",
                        borderWidth: 1,
                        borderColor: careerLevel.color + "66",
                      }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 9, color: careerLevel.color, letterSpacing: 1.2, textTransform: "uppercase" }}>
                          {careerLevel.label}
                        </Text>
                      </View>
                    </View>

                    {/* ── Micro-stat chips ── */}
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      {[
                        { label: "Avg",  value: battingAvg,                          color: "#6ee7b7" },
                        { label: "100s", value: String(centuries),                   color: "#fbbf24" },
                        { label: "Wkts", value: String(summary.bowling.totalWickets ?? 0), color: "#f87171" },
                      ].map(({ label, value, color }) => (
                        <View key={label} style={{ alignItems: "center" }}>
                          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color, lineHeight: 19 }}>{value}</Text>
                          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 0.8, textTransform: "uppercase" }}>{label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* ── Milestone progress bar ── */}
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                    <Text style={{ fontFamily: "Inter_500Medium", fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
                      {careerRuns} runs
                    </Text>
                    <Text style={{ fontFamily: "Inter_500Medium", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                      {nextRunTarget} milestone
                    </Text>
                  </View>
                  <View style={{ height: 4, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
                    <Animated.View style={{
                      height: 4,
                      borderRadius: 4,
                      backgroundColor: "#f59e0b",
                      width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                    }} />
                  </View>
                  {careerLevel.next != null && (
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4, textAlign: "right" }}>
                      {careerLevel.next} XP to {
                        careerLevel.label === "Novice"   ? "Club" :
                        careerLevel.label === "Club"     ? "Amateur" :
                        careerLevel.label === "Amateur"  ? "Semi-Pro" :
                        careerLevel.label === "Semi-Pro" ? "Elite" : "Legend"
                      }
                    </Text>
                  )}
                </View>

              </View>
            </BlurView>
          ) : (
            <Text style={[styles.heroTitle, { color: colors.pavilionForeground }]}>
              {isLoading ? "Loading…" : "No data yet"}
            </Text>
          )}
        </View>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : summary ? (
        <>
          {/* ── Layout anchor ── */}
          <View onLayout={measureSection("stats")} />

          {/* ── Next Match card ── */}
          <NextMatchCard
            fixture={nextFixture}
            onAddFixture={() => setShowAddFixture(true)}
            onDelete={handleDeleteFixture}
          />

          {/* ── Career milestone strip ── */}
          <View style={[styles.milestoneStrip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.milestoneStripItem, { color: colors.primary }]}>
              🏏 {nextRunTarget - summary.batting.totalRuns} to {nextRunTarget} runs
            </Text>
            <Text style={[styles.milestoneStripSep, { color: colors.border }]}> · </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <CricketBallSvg size={13} />
              <Text style={[styles.milestoneStripItem, { color: colors.accent }]}>
                {nextWicketTarget - summary.bowling.totalWickets} to {nextWicketTarget} wickets
              </Text>
            </View>
          </View>

          {/* ── Season scoreboard card ── */}
          <ScoreboardCard
            seasonLabel={activeSeasonLabel}
            availableSeasons={availableSeasons}
            selectedSeasonIdx={selectedSeasonIdx}
            onSeasonChange={setSelectedSeasonIdx}
            runsFlap={seasonFlapRuns}
            wicketsFlap={seasonFlapWickets}
            catchesFlap={seasonFlapCatches}
            matchesFlap={seasonFlapMatches}
            battingAvg={seasonBattingAvg}
            nextRunTarget={nextRunTarget}
            runsDelta={runsDelta}
            prevSeasonLabel={prevSeason?.label}
          />

          {/* ── Share button ── */}
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.shareBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          >
            <Feather name="share-2" size={13} color={colors.mutedForeground} />
            <Text style={[styles.shareBtnText, { color: colors.mutedForeground }]}>Share {activeSeasonLabel} stats</Text>
          </TouchableOpacity>

          {/* ── Current Season ── */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{activeSeasonLabel} — Batting</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Runs" value={seasonRuns} colors={colors} />
            <StatCard label="Innings" value={seasonInnings} colors={colors} />
            <StatCard label="Average" value={seasonBattingAvg} colors={colors} />
            <StatCard label="High Score" value={seasonHS} colors={colors} />
            <StatCard label="Strike Rate" value={seasonSR} colors={colors} />
            <StatCard label="50s" value={seasonFifties} colors={colors} />
            <StatCard label="100s" value={seasonCenturies} colors={colors} />
            <StatCard label="Not Outs" value={seasonNotOuts} colors={colors} />
            <StatCard label="Matches" value={seasonMatches} colors={colors} />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{activeSeasonLabel} — Bowling</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Wickets" value={seasonWickets} colors={colors} />
            <StatCard label="Best" value={seasonBest} colors={colors} />
            <StatCard label="Average" value={seasonBowlingAvg} colors={colors} />
            <StatCard label="Economy" value={seasonEconomy} colors={colors} />
            <StatCard label="Overs" value={seasonOvers > 0 ? seasonOvers.toFixed(1) : "—"} colors={colors} />
          </View>

          {/* ── Season Projection ── */}
          {projectedRuns !== null && (
            <View style={[styles.projectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.projectionTitle, { color: colors.foreground }]}>📈 Season Projection</Text>
              <Text style={[styles.projectionSub, { color: colors.mutedForeground }]}>
                At your current rate — ~{projectedRuns} runs and ~{projectedWickets} wickets by season end
              </Text>
            </View>
          )}

          {/* ── Career Totals ── */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Career — Batting</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Total Runs" value={summary.batting.totalRuns} colors={colors} />
            <StatCard label="High Score" value={summary.batting.highScore} colors={colors} />
            <StatCard label="Average" value={battingAvg} colors={colors} />
            <StatCard
              label="Strike Rate"
              value={summary.batting.averageStrikeRate.toFixed(1)}
              colors={colors}
            />
            <StatCard label="100s" value={centuries} colors={colors} />
            <StatCard label="50s" value={fifties} colors={colors} />
            <StatCard label="Fours" value={summary.batting.totalFours} colors={colors} />
            <StatCard label="Sixes" value={summary.batting.totalSixes} colors={colors} />
            <StatCard label="Not Outs" value={notOuts} colors={colors} />
            <StatCard label="Ducks" value={ducks} colors={colors} />
            <StatCard label="POTM" value={potmCount} colors={colors} />
            <StatCard label="Innings" value={summary.batting.innings} colors={colors} />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Career — Bowling</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Wickets" value={summary.bowling.totalWickets} colors={colors} />
            <StatCard label="Best" value={summary.bowling.bestFigures} colors={colors} />
            <StatCard
              label="Average"
              value={bowlingAverage > 0 ? Number(bowlingAverage).toFixed(1) : "—"}
              colors={colors}
            />
            <StatCard
              label="Economy"
              value={summary.bowling.averageEconomyRate.toFixed(2)}
              colors={colors}
            />
            <StatCard label="Overs" value={summary.bowling.totalOvers.toFixed(1)} colors={colors} />
            <StatCard label="Maidens" value={totalMaidens} colors={colors} />
            <StatCard label="5-Wkt Hauls" value={fiveWicketHauls} colors={colors} />
            <StatCard label="No Balls" value={totalNoBalls} colors={colors} />
            <StatCard label="Wides" value={totalWides} colors={colors} />
          </View>

          {/* ── Batting Position Breakdown ── */}
          {positionRows.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>By Batting Position</Text>
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {positionRows.map((row) => (
                  <View key={row.pos} style={styles.posRow}>
                    <View style={styles.posLabelGroup}>
                      <Text style={[styles.posNum, { color: colors.primary }]}>#{row.pos}</Text>
                      <Text style={[styles.posName, { color: colors.mutedForeground }]}> {row.label}</Text>
                    </View>
                    <Text style={[styles.posStat, { color: colors.mutedForeground }]}>{row.innings} inn</Text>
                    <Text style={[styles.posStat, { color: colors.foreground }]}>{row.runs} runs</Text>
                    <Text style={[styles.posAvg, { color: colors.primary }]}>avg {row.avg}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── Milestone Progress ── */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Milestones</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.milestoneLabel, { color: colors.foreground }]}>
              Runs — {summary.batting.totalRuns} / {nextRunTarget}
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, { width: `${runsPct}%` as any, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.milestoneSub, { color: colors.mutedForeground }]}>
              {nextRunTarget - summary.batting.totalRuns} runs to next milestone
            </Text>
            <View style={styles.milestoneSpacer} />
            <Text style={[styles.milestoneLabel, { color: colors.foreground }]}>
              Wickets — {summary.bowling.totalWickets} / {nextWicketTarget}
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, { width: `${wicketsPct}%` as any, backgroundColor: colors.accent }]} />
            </View>
            <Text style={[styles.milestoneSub, { color: colors.mutedForeground }]}>
              {nextWicketTarget - summary.bowling.totalWickets} wickets to next milestone
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Career — Fielding</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Catches" value={summary.fielding.totalCatches} colors={colors} />
            <StatCard label="Run Outs" value={summary.fielding.totalRunOuts} colors={colors} />
            <StatCard label="Stumpings" value={summary.fielding.totalStumpings} colors={colors} />
            <StatCard label="Dropped" value={summary.fielding.totalDroppedCatches} colors={colors} />
          </View>

          {/* ── Season Targets ── */}
          <View onLayout={measureSection("goals")} />
          <SeasonTargets
            currentRuns={seasonRuns}
            currentWickets={seasonWickets}
            currentCatches={seasonCatches}
            season={activeSeasonLabel}
            colors={colors}
          />

          {/* ── Form Guide ── */}
          <View onLayout={measureSection("form")} />
          {runStreak >= 4 && (
            <View style={[styles.streakBanner, { backgroundColor: colors.accent + "22", borderColor: colors.accent + "55" }]}>
              <Text style={[styles.streakBannerText, { color: colors.accent }]}>
                🔥 On a roll — {runStreak} innings in a row with 30+
              </Text>
            </View>
          )}
          {allPerMatch.length > 0 && (
            <FormGuideSection
              data={allPerMatch.filter((m) => activeIsMatchInSeason(m.date))}
              colors={colors}
              onPress={handleMatchPress}
            />
          )}

          {/* ── Best Performances ── */}
          {allPerMatch.length > 0 && (
            <BestPerformancesSection data={allPerMatch} colors={colors} onPress={handleMatchPress} />
          )}

          {/* ── Charts ── */}
          {hasChartData && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Runs Scored
              </Text>
              <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <BarChart data={runsData} barColor={colors.primary} colors={colors} />
              </View>

              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Wickets Taken
              </Text>
              <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <BarChart data={wicketsData} barColor={colors.primary} colors={colors} />
              </View>
            </>
          )}

          {/* ── Dismissal Breakdown ── */}
          <View onLayout={measureSection("dismissals")} />
          {allPerMatch.length > 0 && (
            <DismissalSection data={allPerMatch} colors={colors} />
          )}

          {/* ── Match Type Breakdown ── */}
          <View onLayout={measureSection("matchtype")} />
          {allPerMatch.length > 0 && (
            <MatchTypeSection data={allPerMatch} colors={colors} />
          )}

          {/* ── Head-to-Head ── */}
          <View onLayout={measureSection("h2h")} />
          {allPerMatch.length > 0 && (
            <HeadToHeadSection data={allPerMatch} colors={colors} onPress={handleMatchPress} />
          )}
        </>
      ) : null}

      <View onLayout={measureSection("recent")} />
      {recentMatches.length > 0 ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Matches</Text>
          {recentMatches.map((match) => (
            <TouchableOpacity
              key={match.id}
              style={[
                styles.matchRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push(`/match/${match.id}`)}
            >
              <View style={styles.matchRowLeft}>
                <Text style={[styles.matchOpponent, { color: colors.foreground }]}>
                  vs {match.opponent}
                </Text>
                <Text style={[styles.matchMeta, { color: colors.mutedForeground }]}>
                  {match.date} · {match.matchType}
                </Text>
              </View>
              <ResultBadge result={match.result} colors={colors} />
            </TouchableOpacity>
          ))}
        </>
      ) : !isLoading ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matches yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Tap "Log Match" to record your first match
          </Text>
        </View>
      ) : null}
    </ScrollView>

    <AddFixtureModal visible={showAddFixture} onClose={() => setShowAddFixture(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pavilion: { paddingBottom: 20 },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  greeting: { fontSize: 13, fontFamily: "Inter_500Medium" },
  splitFlapRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 10, marginBottom: 2 },
  runsLabel: { fontSize: 22, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  heroTitle: { fontSize: 32, fontFamily: "Georgia", letterSpacing: 0 },
  heroSub: { fontSize: 13, fontFamily: "Georgia", fontStyle: "italic", marginTop: 6, letterSpacing: 0.2 },

  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
    opacity: 0.6,
  },
  seasonPickerScroll: { marginTop: 16 },
  seasonPickerContent: { paddingHorizontal: 16, gap: 8 },
  seasonPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  seasonPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  milestoneStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  milestoneStripItem: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  milestoneStripSep: { fontSize: 12, fontFamily: "Inter_400Regular" },

  headlineDelta: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
    opacity: 0.9,
  },

  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  shareBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  projectionCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  projectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  projectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  posRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#D4CCBA40",
  },
  posLabelGroup: { flex: 1, flexDirection: "row", alignItems: "center" },
  posNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  posName: { fontSize: 11, fontFamily: "Inter_400Regular" },
  posStat: { fontSize: 12, fontFamily: "Inter_500Medium", marginRight: 10 },
  posAvg: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  streakBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  streakBannerText: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },

  headlineCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  headlineStat: { flex: 1, alignItems: "center" },
  headlineValue: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#FFFDF8" },
  headlineLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.65)", marginTop: 2, letterSpacing: 0.8, textTransform: "uppercase" },
  headlineDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 4 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    width: "30%",
    flexGrow: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2, textAlign: "center" },

  // Chart
  chartCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  yLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    lineHeight: 12,
  },
  xLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 9,
    fontFamily: "Inter_400Regular",
  },

  // Form Guide
  formRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
  },
  formCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 3,
  },
  formResultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  formStat: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    width: "100%",
  },
  formWkts: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  formOpponent: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  // Best Performances
  bestRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
  },
  bestCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 3,
  },
  bestIcon: {
    fontSize: 22,
  },
  bestValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  bestLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  bestSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  // Head-to-Head
  h2hCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  h2hRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  h2hHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  h2hHeaderText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  h2hOpponent: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  h2hCell: {
    width: 36,
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  // Recent matches
  matchRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matchRowLeft: { flex: 1 },
  matchOpponent: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  matchMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  badgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  emptyState: { alignItems: "center", marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },

  // Shortcut pills
  pillsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  pillText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    whiteSpace: "nowrap",
  },

  // Analysis cards
  analysisCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  // Dismissal breakdown
  dismissalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
  },
  dismissalName: {
    width: 100,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  dismissalBarWrap: {
    flex: 1,
  },
  dismissalBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  dismissalBarFill: {
    height: 8,
    borderRadius: 4,
  },
  dismissalCount: {
    width: 44,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },

  // Milestone progress
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  milestoneLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  milestoneSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  milestoneSpacer: {
    height: 14,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },

  // Match type table
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  tableHead: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  tableCell: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
