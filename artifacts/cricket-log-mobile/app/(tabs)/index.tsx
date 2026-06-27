import {
  useGetStatsSummary,
  useGetPerMatchStats,
  useListMatches,
} from "@workspace/api-client-react";
import { useRouter, useFocusEffect } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SeasonTargets } from "@/components/SeasonTargets";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { usePlayerName } from "@/hooks/usePlayerName";
import { SplitFlapDisplay } from "@/components/SplitFlapDisplay";
import { BallHitsStumps, StumpsExploding, CricketPitch, TwoCricketCaps, BarChartStats, BullseyeTarget, TrendLine, StackedCards } from "@/components/CricketIcons";

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
    if (runs >= 25) return "#d97706";
    return "#ef4444";
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
                <Text style={[styles.formWkts, { color: "#7c3aed" }]}>{wkts}w</Text>
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
            <Text style={[styles.bestValue, { color: "#7c3aed" }]}>
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

const DISMISSAL_COLORS_M = ["#16a34a","#2563eb","#7c3aed","#d97706","#dc2626","#0891b2","#db2777","#475569"];

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

  const isLoading = summaryLoading || matchesLoading;

  const currentYear = new Date().getFullYear().toString();
  const allPerMatchEarly = perMatch ?? [];
  const seasonRuns = allPerMatchEarly
    .filter((m) => m.date?.startsWith(currentYear) && m.runs != null)
    .reduce((s, m) => s + (m.runs ?? 0), 0);
  const seasonWickets = allPerMatchEarly
    .filter((m) => m.date?.startsWith(currentYear) && m.wickets != null)
    .reduce((s, m) => s + (m.wickets ?? 0), 0);
  const seasonMatches = allPerMatchEarly.filter((m) => m.date?.startsWith(currentYear)).length;

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

  useFocusEffect(
    useCallback(() => {
      triggerCountUp(seasonRuns);
      return () => {
        if (flapIntervalRef.current) clearInterval(flapIntervalRef.current);
      };
    }, [seasonRuns, triggerCountUp])
  );

  useEffect(() => {
    if (seasonRuns > 0) triggerCountUp(seasonRuns);
  }, [seasonRuns]);

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

  const RUN_MILESTONES = [50, 100, 250, 500, 1000, 2000, 5000];
  const WICKET_MILESTONES = [10, 25, 50, 100, 200];
  const nextRunTarget = RUN_MILESTONES.find((m) => m > (summary?.batting.totalRuns ?? 0)) ?? 5000;
  const nextWicketTarget = WICKET_MILESTONES.find((m) => m > (summary?.bowling.totalWickets ?? 0)) ?? 200;
  const runsPct = Math.min(100, Math.round(((summary?.batting.totalRuns ?? 0) / nextRunTarget) * 100));
  const wicketsPct = Math.min(100, Math.round(((summary?.bowling.totalWickets ?? 0) / nextWicketTarget) * 100));

  const chartMatches = (perMatch ?? []).slice(-12);

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
    <ScrollView
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: colors.background }]}
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
        style={styles.pavilion}
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
            <View style={styles.splitFlapRow}>
              <SplitFlapDisplay value={flapValue} />
              <Text style={[styles.runsLabel, { color: colors.pavilionForeground }]}>Runs</Text>
            </View>
          ) : (
            <Text style={[styles.heroTitle, { color: colors.pavilionForeground }]}>
              {isLoading ? "Loading…" : "No data yet"}
            </Text>
          )}
          {summary ? (
            <Text style={[styles.heroSub, { color: colors.pavilionMuted }]}>
              {currentYear} Season · {seasonMatches} matches · {seasonWickets} wkts
            </Text>
          ) : null}
        </View>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : summary ? (
        <>
          <View onLayout={measureSection("stats")} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Batting</Text>
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

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Bowling</Text>
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
            <StatCard
              label="Overs"
              value={summary.bowling.totalOvers.toFixed(1)}
              colors={colors}
            />
            <StatCard label="Maidens" value={totalMaidens} colors={colors} />
            <StatCard label="5-Wkt Hauls" value={fiveWicketHauls} colors={colors} />
            <StatCard label="No Balls" value={totalNoBalls} colors={colors} />
            <StatCard label="Wides" value={totalWides} colors={colors} />
          </View>

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
              <View style={[styles.progressFill, { width: `${wicketsPct}%` as any, backgroundColor: "#3b82f6" }]} />
            </View>
            <Text style={[styles.milestoneSub, { color: colors.mutedForeground }]}>
              {nextWicketTarget - summary.bowling.totalWickets} wickets to next milestone
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fielding</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Catches" value={summary.fielding.totalCatches} colors={colors} />
            <StatCard label="Run Outs" value={summary.fielding.totalRunOuts} colors={colors} />
            <StatCard label="Stumpings" value={summary.fielding.totalStumpings} colors={colors} />
            <StatCard
              label="Dropped"
              value={summary.fielding.totalDroppedCatches}
              colors={colors}
            />
          </View>

          {/* ── Season Targets ── */}
          <View onLayout={measureSection("goals")} />
          <SeasonTargets
            currentRuns={seasonRuns}
            currentWickets={seasonWickets}
            season={currentYear}
            colors={colors}
          />

          {/* ── Form Guide ── */}
          <View onLayout={measureSection("form")} />
          {allPerMatch.length > 0 && (
            <FormGuideSection data={allPerMatch} colors={colors} onPress={handleMatchPress} />
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
                <BarChart data={wicketsData} barColor="#8b5cf6" colors={colors} />
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
