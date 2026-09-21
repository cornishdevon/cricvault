import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BowlingWicketMap } from "@/components/BowlingWicketMap";
import { WagonWheel } from "@/components/WagonWheel";
import type { BattingHand } from "@/contexts/PlayerNameContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useT";
import {
  aggregateWheelsData,
  filterCombinedMatches,
  type PerMatchData,
} from "@/utils/combined-maps";

type FilterKey = "year" | "matchType" | "opponent";
type Filters = Record<FilterKey, string>;
type MapView = "batting" | "bowling";

type CombinedWheelsProps = {
  data?: PerMatchData[];
  isLoading: boolean;
  error?: unknown;
  onRetry: () => void;
  battingHand: BattingHand;
};

export function CombinedWheels({
  data,
  isLoading,
  error,
  onRetry,
  battingHand,
}: CombinedWheelsProps) {
  const colors = useColors();
  const t = useT();
  const [filters, setFilters] = useState<Filters>({
    year: "all",
    matchType: "all",
    opponent: "all",
  });
  const [mapView, setMapView] = useState<MapView>("batting");
  const matches = data ?? [];

  const options = useMemo(() => ({
    year: Array.from(new Set(matches
      .map((match) => match.date.slice(0, 4))
      .filter((year) => /^\d{4}$/.test(year))))
      .sort((a, b) => b.localeCompare(a)),
    matchType: Array.from(new Set(matches.map((match) => match.matchType).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b)),
    opponent: Array.from(new Set(matches.map((match) => match.opponent).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b)),
  }), [matches]);

  const combined = useMemo(
    () => aggregateWheelsData(filterCombinedMatches(matches, filters)),
    [matches, filters],
  );

  const setFilter = (key: FilterKey, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const filterRows: Array<{
    key: FilterKey;
    label: string;
    allLabel: string;
    values: string[];
  }> = [
    { key: "year", label: t("combinedWheels.season"), allLabel: t("combinedWheels.allSeasons"), values: options.year },
    { key: "matchType", label: t("combinedWheels.format"), allLabel: t("combinedWheels.allFormats"), values: options.matchType },
    { key: "opponent", label: t("combinedWheels.opponent"), allLabel: t("combinedWheels.allOpponents"), values: options.opponent },
  ];

  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{t("combinedWheels.eyebrow")}</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>
            {t("combinedWheels.title")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t("combinedWheels.subtitle")}
          </Text>
        </View>
        <Feather name="target" size={24} color={colors.primary} />
      </View>

      {isLoading ? (
        <View style={styles.state} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
            {t("combinedWheels.loading")}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.state} accessibilityRole="alert">
          <Feather name="alert-circle" size={24} color={colors.destructive} />
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>
            {t("combinedWheels.errorTitle")}
          </Text>
          <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
            {t("combinedWheels.errorMessage")}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("combinedWheels.retryAccessibility")}
            onPress={onRetry}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Feather name="refresh-cw" size={15} color={colors.primaryForeground} />
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>{t("combinedWheels.retry")}</Text>
          </Pressable>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.state}>
          <Feather name="map" size={24} color={colors.mutedForeground} />
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>{t("combinedWheels.emptyTitle")}</Text>
          <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
            {t("combinedWheels.emptyMessage")}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.filters}>
            {filterRows.map((row) => (
              <View key={row.key}>
                <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {["all", ...row.values].map((value) => {
                    const selected = filters[row.key] === value;
                    const label = value === "all" ? row.allLabel : value;
                    return (
                      <Pressable
                        key={value}
                        accessibilityRole="button"
                        accessibilityLabel={t("combinedWheels.filterAccessibility", { filter: row.label, value: label })}
                        accessibilityState={{ selected }}
                        onPress={() => setFilter(row.key, value)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? colors.primary : colors.background,
                            borderColor: selected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.chipText,
                            { color: selected ? colors.primaryForeground : colors.foreground },
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ))}
          </View>

          {combined.totalMatches === 0 ? (
            <View style={[styles.filteredEmpty, { backgroundColor: colors.muted }]}>
              <Feather name="filter" size={20} color={colors.mutedForeground} />
              <Text style={[styles.stateTitle, { color: colors.foreground }]}>{t("combinedWheels.filteredEmptyTitle")}</Text>
              <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
                {t("combinedWheels.filteredEmptyMessage")}
              </Text>
            </View>
          ) : (
            <>
              <View
                accessibilityRole="tablist"
                style={[styles.segmented, { backgroundColor: colors.muted }]}
              >
                {([
                  { key: "batting" as const, label: t("combinedWheels.batting"), icon: "activity" as const },
                  { key: "bowling" as const, label: t("combinedWheels.bowling"), icon: "disc" as const },
                ]).map((item) => {
                  const selected = mapView === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      accessibilityRole="tab"
                      accessibilityState={{ selected }}
                      onPress={() => setMapView(item.key)}
                      style={[
                        styles.segment,
                        selected && { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <Feather
                        name={item.icon}
                        size={15}
                        color={selected ? colors.primary : colors.mutedForeground}
                      />
                      <Text style={[
                        styles.segmentText,
                        { color: selected ? colors.foreground : colors.mutedForeground },
                      ]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {mapView === "batting" ? (
                <View accessibilityLabel={t("combinedWheels.battingAccessibility")}>
                  <View style={styles.coverageRow}>
                    <Text style={[styles.coverageValue, { color: colors.primary }]}>
                      {combined.totalMappedRuns}
                    </Text>
                    <View style={styles.coverageCopy}>
                      <Text style={[styles.coverageTitle, { color: colors.foreground }]}>{t("combinedWheels.mappedRuns")}</Text>
                      <Text style={[styles.coverageDetail, { color: colors.mutedForeground }]}>
                        {t("combinedWheels.shotsCoverage", { mapped: combined.matchesWithShots, total: combined.totalMatches })}
                      </Text>
                    </View>
                  </View>
                  <WagonWheel shots={combined.shots} battingHand={battingHand} readOnly />
                </View>
              ) : (
                <View accessibilityLabel={t("combinedWheels.bowlingAccessibility")}>
                  <View style={styles.coverageRow}>
                    <Text style={[styles.coverageValue, { color: colors.accent }]}>
                      {combined.totalMappedWickets}
                    </Text>
                    <View style={styles.coverageCopy}>
                      <Text style={[styles.coverageTitle, { color: colors.foreground }]}>{t("combinedWheels.mappedWickets")}</Text>
                      <Text style={[styles.coverageDetail, { color: colors.mutedForeground }]}>
                        {t("combinedWheels.wicketsCoverage", { mapped: combined.matchesWithWickets, total: combined.totalMatches })}
                      </Text>
                    </View>
                  </View>
                  <BowlingWicketMap
                    wickets={combined.wickets}
                    compactMarkers
                    scrollableList
                  />
                </View>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headingCopy: { flex: 1 },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: "Inter_700Bold",
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  state: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    gap: 8,
  },
  stateTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  stateText: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  retryButton: {
    minHeight: 44,
    marginTop: 4,
    paddingHorizontal: 18,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  retryText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  filters: { marginTop: 16, gap: 10 },
  filterLabel: {
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  chipRow: { gap: 7, paddingRight: 8 },
  chip: {
    minHeight: 36,
    maxWidth: 190,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  filteredEmpty: {
    minHeight: 130,
    marginTop: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 6,
  },
  segmented: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    marginTop: 16,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  segmentText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  coverageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
  },
  coverageValue: {
    minWidth: 48,
    fontSize: 28,
    lineHeight: 32,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  coverageCopy: { flex: 1 },
  coverageTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  coverageDetail: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
});