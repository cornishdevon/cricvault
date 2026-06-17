import { useGetPerMatchStats } from "@workspace/api-client-react";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { computeBadges, type PerMatchStat, type Badge } from "@/utils/computeBadges";

const BADGE_IMAGES: Record<string, ReturnType<typeof require>> = {
  "pinch-hitter": require("@/assets/badges/pinch-hitter.png"),
};

function BadgeTile({ badge, colors }: { badge: Badge; colors: ReturnType<typeof useColors> }) {
  const isLocked = !badge.earned;
  const bgColor  = isLocked ? "#3f3f46" : badge.isNegative ? "#3d1515" : colors.card;
  const borderColor = isLocked ? "#52525b" : badge.isNegative ? "#7f1d1d66" : colors.primary + "50";
  const labelColor  = isLocked ? "#a1a1aa" : badge.isNegative ? "#f87171" : colors.foreground;
  const descColor   = isLocked ? "#71717a" : colors.mutedForeground;
  const detailColor = badge.isNegative ? "#f87171" : colors.primary;

  const imageSource = badge.imageKey ? BADGE_IMAGES[badge.imageKey] : null;

  return (
    <View style={[styles.tile, { backgroundColor: bgColor, borderColor }]}>
      {isLocked ? (
        <Text style={styles.icon}>🔒</Text>
      ) : imageSource ? (
        <Image source={imageSource} style={styles.badgeImage} resizeMode="contain" />
      ) : (
        <Text style={styles.icon}>{badge.icon}</Text>
      )}
      <Text style={[styles.tileLabel, { color: labelColor }]} numberOfLines={2}>
        {badge.label}
      </Text>
      <Text style={[styles.tileDesc, { color: descColor }]} numberOfLines={3}>
        {badge.description}
      </Text>
      {badge.earned && badge.detail ? (
        <Text style={[styles.tileDetail, { color: detailColor }]} numberOfLines={1}>
          {badge.detail}
        </Text>
      ) : null}
    </View>
  );
}

export default function AchievementsScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();

  const { data: perMatch, isLoading, isRefetching, refetch } = useGetPerMatchStats();

  const badges = useMemo(() => {
    if (!perMatch || perMatch.length === 0) return [];
    return computeBadges(perMatch as PerMatchStat[]);
  }, [perMatch]);

  const positive = badges.filter((b) => !b.isNegative);
  const negative = badges.filter((b) => b.isNegative);
  const earnedCount = badges.filter((b) => b.earned).length;

  const innings = (perMatch ?? []).filter((d) => d.runs !== null && d.runs !== undefined);
  const fifties  = innings.filter((d) => (d.runs ?? 0) >= 50).length;
  const hundreds = innings.filter((d) => (d.runs ?? 0) >= 100).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Achievements</Text>
        {badges.length > 0 && (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {earnedCount} / {badges.length} earned
          </Text>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      ) : badges.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏏</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matches yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Log your first match to start earning badges.
          </Text>
        </View>
      ) : (
        <>
          {/* Batting milestones bar */}
          {innings.length > 0 && (
            <View style={[styles.milestonesBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MilestonePip color="#84cc16" count={innings.filter((d) => (d.runs ?? 0) >= 25).length} label="25+" />
              <MilestonePip color={colors.primary} count={fifties} label="50+" />
              <MilestonePip color="#f59e0b" count={hundreds} label="100+" />
              <Text style={[styles.inningsTotal, { color: colors.mutedForeground }]}>
                {innings.length} innings
              </Text>
            </View>
          )}

          {/* Positive badges */}
          <View style={styles.grid}>
            {positive.map((badge) => (
              <BadgeTile key={badge.id} badge={badge} colors={colors} />
            ))}
          </View>

          {/* Hall of shame */}
          {negative.some((b) => b.earned) && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                Hall of Shame
              </Text>
              <View style={styles.grid}>
                {negative.filter((b) => b.earned).map((badge) => (
                  <BadgeTile key={badge.id} badge={badge} colors={colors} />
                ))}
              </View>
            </>
          )}

          {/* Locked shame badges (shown dimly) */}
          {negative.some((b) => !b.earned) && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                Shame badges (locked)
              </Text>
              <View style={styles.grid}>
                {negative.filter((b) => !b.earned).map((badge) => (
                  <BadgeTile key={badge.id} badge={badge} colors={colors} />
                ))}
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function MilestonePip({ color, count, label }: { color: string; count: number; label: string }) {
  return (
    <View style={styles.pip}>
      <View style={[styles.pipDot, { backgroundColor: color }]} />
      <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>{count}</Text>
      <Text style={{ fontSize: 12, color: "#aaa" }}>{label}</Text>
    </View>
  );
}

const TILE_SIZE = 108;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  title:    { fontSize: 26, fontWeight: "700" },
  subtitle: { fontSize: 13 },
  milestonesBar: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  pip: { flexDirection: "row", alignItems: "center", gap: 5 },
  pipDot: { width: 10, height: 10, borderRadius: 5 },
  inningsTotal: { marginLeft: "auto" as any, fontSize: 12 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  tile: {
    width: TILE_SIZE,
    minHeight: TILE_SIZE,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
  },
  icon:       { fontSize: 24, textAlign: "center" },
  badgeImage: { width: 44, height: 44, borderRadius: 22 },
  tileLabel:  { fontSize: 10, fontWeight: "700", textAlign: "center", lineHeight: 13 },
  tileDesc:   { fontSize: 9,  textAlign: "center", lineHeight: 12 },
  tileDetail: { fontSize: 9,  fontWeight: "700", textAlign: "center", marginTop: "auto" as any },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptyDesc:  { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
