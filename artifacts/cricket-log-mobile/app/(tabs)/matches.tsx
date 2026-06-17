import {
  useListMatches,
  useDeleteMatch,
  getGetPerMatchStatsQueryKey,
  getGetStatsSummaryQueryKey,
  getListMatchesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type Match = {
  id: number;
  date: string;
  opponent: string;
  venue?: string | null;
  matchType: string;
  result?: string | null;
  playerOfTheMatch: boolean;
  createdAt: string;
};

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

function MatchItem({
  match,
  colors,
  onPress,
  onDelete,
}: {
  match: Match;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={[styles.opponent, { color: colors.foreground }]}>vs {match.opponent}</Text>
          {match.venue ? (
            <Text style={[styles.venue, { color: colors.mutedForeground }]}>{match.venue}</Text>
          ) : null}
        </View>
        <View style={styles.cardRight}>
          <ResultBadge result={match.result} colors={colors} />
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>{match.date}</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>{match.matchType}</Text>
        {match.playerOfTheMatch ? (
          <View style={[styles.potmBadge, { backgroundColor: "#fff8dc" }]}>
            <Text style={[styles.potmText, { color: "#b45309" }]}>⭐ POTM</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function MatchesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const queryClient = useQueryClient();
  const { data: matches, isLoading, refetch, isRefetching } = useListMatches();
  const { mutate: deleteMatch } = useDeleteMatch();

  const handleDelete = (id: number, opponent: string) => {
    Alert.alert("Delete Match", `Remove match vs ${opponent}?\n\nThis cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteMatch(
            { matchId: id },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetPerMatchStatsQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
              },
            },
          ),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: 12,
        paddingBottom: insets.bottom + 100,
        ...(!matches || matches.length === 0 ? { flex: 1 } : {}),
      }}
      data={matches ?? []}
      keyExtractor={(m) => String(m.id)}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Feather name="calendar" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matches yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Go to Log Match to add your first match
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <MatchItem
          match={item}
          colors={colors}
          onPress={() => router.push(`/match/${item.id}`)}
          onDelete={() => handleDelete(item.id, item.opponent)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardLeft: { flex: 1 },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 },
  opponent: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  venue: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
  },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  potmBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  potmText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  deleteBtn: { padding: 4 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
