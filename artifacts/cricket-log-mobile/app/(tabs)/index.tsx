import {
  useGetStatsSummary,
  useGetPerMatchStats,
  useListMatches,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
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
  runs?: number | null;
  wickets?: number | null;
  overs?: number | null;
  runsConceded?: number | null;
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
            <Text style={[styles.bestValue, { color: colors.primary }]}>{bestBat.runs}</Text>
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
            <Text style={[styles.bestIcon]}>🎳</Text>
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

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
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
  const isRefreshing = summaryRefetching || matchesRefetching || perMatchRefetching;

  const recentMatches = matches?.slice(0, 5) ?? [];

  const battingAvg =
    summary && summary.batting.innings > 0
      ? (summary.batting.totalRuns / summary.batting.innings).toFixed(1)
      : "—";

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

  return (
    <ScrollView
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
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Career Stats</Text>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>
          {summary
            ? `${summary.batting.totalRuns} Runs`
            : isLoading
            ? "Loading…"
            : "No data yet"}
        </Text>
        {summary ? (
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            {summary.totalMatches} matches · {summary.bowling.totalWickets} wickets
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : summary ? (
        <>
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
            <StatCard label="Fours" value={summary.batting.totalFours} colors={colors} />
            <StatCard label="Sixes" value={summary.batting.totalSixes} colors={colors} />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Bowling</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Wickets" value={summary.bowling.totalWickets} colors={colors} />
            <StatCard label="Best" value={summary.bowling.bestFigures} colors={colors} />
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

          {/* ── Form Guide ── */}
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

          {/* ── Head-to-Head ── */}
          {allPerMatch.length > 0 && (
            <HeadToHeadSection data={allPerMatch} colors={colors} onPress={handleMatchPress} />
          )}
        </>
      ) : null}

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
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  greeting: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  heroTitle: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  heroSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },

  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
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
});
