import {
  useGetMatch,
  useGetBattingStats,
  useGetBowlingStats,
  useGetFieldingStats,
  useGetMatchReport,
  useDeleteMatch,
  getGetPerMatchStatsQueryKey,
  getGetStatsSummaryQueryKey,
  getListMatchesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

function StatRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string | number | null | undefined;
  colors: ReturnType<typeof useColors>;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function Card({
  title,
  icon,
  children,
  colors,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
          <Feather name={icon as any} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: match, isLoading: matchLoading, refetch } = useGetMatch(matchId);
  const { data: batting } = useGetBattingStats(matchId);
  const { data: bowling } = useGetBowlingStats(matchId);
  const { data: fielding } = useGetFieldingStats(matchId);
  const { data: report } = useGetMatchReport(matchId);
  const { mutate: deleteMatch } = useDeleteMatch();

  const handleDelete = () => {
    const label = match ? `vs ${match.opponent}` : "this match";
    Alert.alert("Delete Match", `Remove ${label}?\n\nThis cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteMatch(
            { matchId },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetPerMatchStatsQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
                router.back();
              },
            },
          ),
      },
    ]);
  };

  useEffect(() => {
    if (match) {
      navigation.setOptions({
        title: `vs ${match.opponent}`,
        headerRight: () => (
          <TouchableOpacity
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginRight: 4 }}
          >
            <Feather name="trash-2" size={18} color="#ef4444" />
          </TouchableOpacity>
        ),
      });
    }
  }, [match, navigation]);

  if (matchLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Match not found</Text>
      </View>
    );
  }

  const isWin = match.result?.toLowerCase().startsWith("w");
  const isLoss = match.result?.toLowerCase().startsWith("l");
  const resultBg = isWin ? "#1a7340" : isLoss ? "#c0392b" : colors.primary;

  const sr = batting ? Number(batting.strikeRate).toFixed(1) : null;
  const econ = bowling ? Number(bowling.economyRate).toFixed(2) : null;
  const overs = bowling ? Number(bowling.overs).toFixed(1) : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />
      }
    >
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: resultBg }]}>
        <Text style={styles.heroOpponent}>vs {match.opponent}</Text>
        <Text style={styles.heroMeta}>
          {match.date} · {match.matchType}
        </Text>
        {match.venue ? <Text style={styles.heroVenue}>{match.venue}</Text> : null}
        {match.result ? (
          <View style={styles.resultPill}>
            <Text style={styles.resultPillText}>{match.result}</Text>
          </View>
        ) : null}
        {match.playerOfTheMatch ? (
          <Text style={styles.potm}>⭐ Player of the Match</Text>
        ) : null}
      </View>

      {/* Batting */}
      {batting ? (
        <Card title="Batting" icon="trending-up" colors={colors}>
          <StatRow label="Runs" value={batting.runs} colors={colors} />
          <StatRow label="Balls Faced" value={batting.ballsFaced} colors={colors} />
          <StatRow label="Strike Rate" value={sr} colors={colors} />
          <StatRow label="Fours (4s)" value={batting.fours} colors={colors} />
          <StatRow label="Sixes (6s)" value={batting.sixes} colors={colors} />
          <StatRow label="Batting Position" value={batting.battingPosition ?? undefined} colors={colors} />
          <StatRow label="How Out" value={batting.howOut ?? undefined} colors={colors} />
          {batting.badUmpireDecision ? (
            <StatRow label="Bad Umpire Decision" value="Yes" colors={colors} />
          ) : null}
          <StatRow label="Balls to 50" value={batting.ballsToFifty ?? undefined} colors={colors} />
          <StatRow label="Balls to 100" value={batting.ballsToHundred ?? undefined} colors={colors} />
          <StatRow label="Balls to 150" value={batting.ballsToHundredFifty ?? undefined} colors={colors} />
        </Card>
      ) : null}

      {/* Bowling */}
      {bowling ? (
        <Card title="Bowling" icon="activity" colors={colors}>
          <StatRow label="Wickets" value={bowling.wickets} colors={colors} />
          <StatRow label="Overs" value={overs} colors={colors} />
          <StatRow label="Runs Conceded" value={bowling.runsConceded} colors={colors} />
          <StatRow label="Economy Rate" value={econ} colors={colors} />
          <StatRow label="Maidens" value={bowling.maidens} colors={colors} />
          <StatRow label="No Balls" value={bowling.noBalls} colors={colors} />
          <StatRow label="Wides" value={bowling.wides} colors={colors} />
          <StatRow label="Bowled" value={bowling.bowledWickets} colors={colors} />
          <StatRow label="LBW" value={bowling.lbwWickets} colors={colors} />
          {bowling.hatTrick ? (
            <StatRow label="Hat Trick" value="Yes 🎩" colors={colors} />
          ) : null}
          {bowling.wouldHaveReferred ? (
            <StatRow label="Would Have Referred" value="Yes" colors={colors} />
          ) : null}
        </Card>
      ) : null}

      {/* Fielding */}
      {fielding ? (
        <Card title="Fielding" icon="shield" colors={colors}>
          <StatRow label="Catches" value={fielding.catches} colors={colors} />
          <StatRow label="Dropped Catches" value={fielding.droppedCatches} colors={colors} />
          <StatRow label="Run Outs" value={fielding.runOuts} colors={colors} />
          <StatRow label="Stumpings" value={fielding.stumpings} colors={colors} />
          <StatRow label="Missed Stumpings" value={fielding.missedStumpings} colors={colors} />
        </Card>
      ) : null}

      {/* Match Report */}
      {report ? (
        <Card title="Match Report" icon="file-text" colors={colors}>
          {report.notes ? (
            <View style={styles.reportSection}>
              <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>Notes</Text>
              <Text style={[styles.reportText, { color: colors.foreground }]}>{report.notes}</Text>
            </View>
          ) : null}
          {report.areasToImprove ? (
            <View style={styles.reportSection}>
              <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>
                Areas to Improve
              </Text>
              <Text style={[styles.reportText, { color: colors.foreground }]}>
                {report.areasToImprove}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {!batting && !bowling && !fielding && !report ? (
        <View style={styles.noStats}>
          <Feather name="info" size={24} color={colors.mutedForeground} />
          <Text style={[styles.noStatsText, { color: colors.mutedForeground }]}>
            No detailed stats recorded for this match.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  hero: {
    padding: 24,
    paddingTop: 28,
    paddingBottom: 28,
    alignItems: "center",
    gap: 6,
  },
  heroOpponent: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  heroMeta: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_400Regular" },
  heroVenue: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular" },
  resultPill: {
    marginTop: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
  },
  resultPillText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  potm: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  card: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    paddingBottom: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardBody: {},
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  noStats: { alignItems: "center", gap: 10, marginTop: 40, paddingHorizontal: 40 },
  noStatsText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  reportSection: { padding: 14, paddingTop: 0 },
  reportSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reportText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
