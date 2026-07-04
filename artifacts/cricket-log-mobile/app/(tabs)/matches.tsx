import {
  useListMatches,
  useDeleteMatch,
  useGetPerMatchStats,
  getGetPerMatchStatsQueryKey,
  getGetStatsSummaryQueryKey,
  getListMatchesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { exportStatsCsv } from "@/utils/exportCsv";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const isWin  = (r?: string | null) => { const l = r?.toLowerCase() ?? ""; return l === "win" || l.startsWith("won"); };
const isLoss = (r?: string | null) => { const l = r?.toLowerCase() ?? ""; return l === "loss" || l.startsWith("lost"); };
const isDraw = (r?: string | null) => { const l = r?.toLowerCase() ?? ""; return l === "draw" || l.startsWith("drew"); };

function ResultBadge({
  result,
  colors,
}: {
  result?: string | null;
  colors: ReturnType<typeof useColors>;
}) {
  if (!result) return null;
  const win  = isWin(result);
  const loss = isLoss(result);
  const bg = win ? "#dcf5e3" : loss ? "#fde8e8" : "#f0f0f0";
  const fg = win ? "#1a7340" : loss ? "#c0392b" : "#555";
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]} numberOfLines={1}>{result}</Text>
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
          <View style={[styles.potmBadge, { backgroundColor: "#EDE8DC" }]}>
            <Text style={[styles.potmText, { color: "#C0392B" }]}>⭐ POTM</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

type ResultFilter = "all" | "win" | "loss" | "draw" | "pending";

const FILTER_OPTIONS: { key: ResultFilter; label: string }[] = [
  { key: "all",     label: "All" },
  { key: "win",     label: "Won" },
  { key: "loss",    label: "Lost" },
  { key: "draw",    label: "Draw" },
  { key: "pending", label: "Pending" },
];

export default function MatchesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const queryClient = useQueryClient();
  const { data: matches, isLoading, refetch, isRefetching } = useListMatches();
  const { data: perMatchData } = useGetPerMatchStats();
  const { mutate: deleteMatch } = useDeleteMatch();

  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!perMatchData || perMatchData.length === 0) {
      Alert.alert("No Data", "Log some matches first before exporting.");
      return;
    }
    setExporting(true);
    try {
      await exportStatsCsv(perMatchData as any);
    } catch (e: any) {
      Alert.alert("Export Failed", e?.message ?? "Could not export stats.");
    } finally {
      setExporting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!matches) return [];
    let list = [...matches];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.opponent.toLowerCase().includes(q) ||
          (m.venue?.toLowerCase() ?? "").includes(q) ||
          (m.matchType?.toLowerCase() ?? "").includes(q)
      );
    }

    if (resultFilter !== "all") {
      list = list.filter((m) => {
        if (resultFilter === "win")     return isWin(m.result);
        if (resultFilter === "loss")    return isLoss(m.result);
        if (resultFilter === "draw")    return isDraw(m.result);
        if (resultFilter === "pending") return !m.result;
        return true;
      });
    }

    return list;
  }, [matches, search, resultFilter]);

  const wins   = matches?.filter((m) => isWin(m.result)).length  ?? 0;
  const losses = matches?.filter((m) => isLoss(m.result)).length ?? 0;
  const draws  = matches?.filter((m) => isDraw(m.result)).length ?? 0;

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

  const Header = (
    <View style={{ backgroundColor: colors.background }}>
      {/* Win/Loss/Draw strip */}
      {matches && matches.length > 0 && (
        <View style={[styles.statsStrip, { borderBottomColor: colors.border }]}>
          <View style={styles.statPill}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{wins}</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Wins</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statPill}>
            <Text style={[styles.statNum, { color: "#ef4444" }]}>{losses}</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Losses</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statPill}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{draws}</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Draws</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statPill}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{matches.length}</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Total</Text>
          </View>
        </View>
      )}

      {/* Export button */}
      {matches && matches.length > 0 && (
        <TouchableOpacity
          onPress={handleExport}
          disabled={exporting}
          style={[styles.exportBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
        >
          <Feather name="download" size={13} color={colors.mutedForeground} />
          <Text style={[styles.exportBtnText, { color: colors.mutedForeground }]}>
            {exporting ? "Exporting…" : "Export CSV"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
          placeholder="Search opponent, venue, type…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Result filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_OPTIONS.map((opt) => {
          const active = resultFilter === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setResultFilter(opt.key)}
            >
              <Text style={[styles.chipText, { color: active ? "#fff" : colors.foreground }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {filtered.length === 0 && matches && matches.length > 0 && (
        <View style={styles.noResults}>
          <Text style={[styles.noResultsText, { color: colors.mutedForeground }]}>No matches match your filters.</Text>
          <TouchableOpacity onPress={() => { setSearch(""); setResultFilter("all"); }}>
            <Text style={[styles.clearLink, { color: colors.primary }]}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: 0,
        paddingBottom: insets.bottom + 100,
        ...(!filtered.length ? { flex: 1 } : {}),
      }}
      data={filtered}
      keyExtractor={(m) => String(m.id)}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
      }
      ListHeaderComponent={Header}
      ListEmptyComponent={
        !search && resultFilter === "all" ? (
          <View style={styles.empty}>
            <Feather name="calendar" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matches yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Go to Log Match to add your first match
            </Text>
          </View>
        ) : null
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

  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statPill: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32, marginHorizontal: 4 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },

  filterRow: { paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  noResults: { alignItems: "center", paddingVertical: 20, gap: 6 },
  noResultsText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  clearLink: { fontSize: 14, fontFamily: "Inter_500Medium" },

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
  cardLeft: { flex: 1, marginRight: 8 },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, maxWidth: 140 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  potmBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  potmText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  deleteBtn: { padding: 4 },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  exportBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
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
