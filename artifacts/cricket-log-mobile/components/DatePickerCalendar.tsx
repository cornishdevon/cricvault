import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const START_YEAR = 1990;
const CARD_WIDTH  = Math.min(Dimensions.get("window").width - 32, 360);
const INNER_WIDTH = CARD_WIDTH - 32;          // 16px padding each side
const CELL_SIZE   = Math.floor(INNER_WIDTH / 7); // exactly 1/7th, whole px

function isoToDate(iso: string): Date | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function dateToIso(y: number, mo: number, d: number): string {
  return `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function buildGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

type MonthEntry = { year: number; month: number; key: string };

function generateMonths(): MonthEntry[] {
  const today = new Date();
  const entries: MonthEntry[] = [];
  // From January START_YEAR up to and including current month
  for (let y = START_YEAR; y <= today.getFullYear(); y++) {
    const maxM = y === today.getFullYear() ? today.getMonth() : 11;
    for (let m = 0; m <= maxM; m++) {
      entries.push({ year: y, month: m, key: `${y}-${m}` });
    }
  }
  return entries;
}

export function DatePickerCalendar({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (iso: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const selected = isoToDate(value);
  const today = new Date();

  const months = useMemo(generateMonths, []);

  const initialIndex = useMemo(() => {
    const sy = selected?.getFullYear() ?? today.getFullYear();
    const sm = selected?.getMonth() ?? today.getMonth();
    const idx = months.findIndex((e) => e.year === sy && e.month === sm);
    return idx >= 0 ? idx : months.length - 1;
  }, []);

  const [visibleIndex, setVisibleIndex] = useState(initialIndex);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const flatRef = useRef<FlatList<MonthEntry>>(null);

  useEffect(() => {
    flatRef.current?.scrollToIndex({ index: initialIndex, animated: false });
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setVisibleIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });

  const jumpToYear = useCallback(
    (year: number) => {
      // Jump to January of that year (or first available month)
      const idx = months.findIndex((e) => e.year === year);
      if (idx >= 0) {
        flatRef.current?.scrollToIndex({ index: idx, animated: false });
        setVisibleIndex(idx);
      }
      setShowYearPicker(false);
    },
    [months],
  );

  const renderItem = useCallback(
    ({ item }: { item: MonthEntry }) => {
      const grid = buildGrid(item.year, item.month);
      return (
        <View style={{ width: CARD_WIDTH, paddingHorizontal: 16 }}>
          <View style={styles.row}>
            {DAY_LABELS.map((l) => (
              <Text key={l} style={[styles.dayHeader, { color: colors.mutedForeground }]}>{l}</Text>
            ))}
          </View>
          <View style={styles.grid}>
            {grid.map((d, i) => {
              if (!d) return <View key={i} style={styles.cell} />;
              const sel =
                selected &&
                selected.getFullYear() === item.year &&
                selected.getMonth() === item.month &&
                selected.getDate() === d;
              const tod =
                today.getFullYear() === item.year &&
                today.getMonth() === item.month &&
                today.getDate() === d;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.cell,
                    sel && { backgroundColor: colors.primary, borderRadius: 8 },
                    !sel && tod && { borderRadius: 8, borderWidth: 1, borderColor: colors.primary },
                  ]}
                  onPress={() => {
                    onChange(dateToIso(item.year, item.month, d));
                    onClose();
                  }}
                  hitSlop={2}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      { color: sel ? "#fff" : tod ? colors.primary : colors.foreground },
                      sel && { fontWeight: "700" },
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    },
    [colors, selected],
  );

  const { year: visY, month: visM } = months[visibleIndex] ?? months[months.length - 1];

  // All available years
  const years = useMemo(() => {
    const seen = new Set<number>();
    const out: number[] = [];
    for (const m of months) {
      if (!seen.has(m.year)) { seen.add(m.year); out.push(m.year); }
    }
    return out;
  }, [months]);

  // 4 columns for year grid
  const YEAR_COLS = 4;
  const yearCellWidth = Math.floor((CARD_WIDTH - 32) / YEAR_COLS);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.monthLabel, { color: colors.foreground }]}>
                {MONTH_NAMES[visM]}
              </Text>
              {!showYearPicker && (
                <Text style={[styles.swipeHint, { color: colors.mutedForeground }]}>
                  swipe to change month
                </Text>
              )}
            </View>
            {/* Year pill */}
            <TouchableOpacity
              onPress={() => setShowYearPicker((v) => !v)}
              style={[
                styles.yearPill,
                {
                  backgroundColor: showYearPicker ? colors.primary : colors.muted,
                  borderColor: showYearPicker ? colors.primary : colors.border,
                },
              ]}
              hitSlop={8}
            >
              <Text style={[styles.yearPillText, { color: showYearPicker ? "#fff" : colors.foreground }]}>
                {visY} {showYearPicker ? "▴" : "▾"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Year picker grid */}
          {showYearPicker ? (
            <ScrollView
              style={{ maxHeight: 244 }}
              contentContainerStyle={[styles.yearGrid, { paddingHorizontal: 16 }]}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {years.map((yr, i) => {
                const isSelected = yr === visY;
                const isTodayYear = yr === today.getFullYear();
                return (
                  <TouchableOpacity
                    key={yr}
                    onPress={() => jumpToYear(yr)}
                    style={[
                      styles.yearCell,
                      { width: yearCellWidth, marginBottom: 4 },
                      isSelected && { backgroundColor: colors.primary, borderRadius: 8 },
                      !isSelected && isTodayYear && {
                        borderRadius: 8, borderWidth: 1, borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.yearCellText,
                        {
                          color: isSelected ? "#fff" : isTodayYear ? colors.primary : colors.foreground,
                          fontWeight: isSelected ? "700" : "400",
                        },
                      ]}
                    >
                      {yr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <FlatList
              ref={flatRef}
              data={months}
              keyExtractor={(item) => item.key}
              renderItem={renderItem}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={visibleIndex}
              getItemLayout={(_, index) => ({
                length: CARD_WIDTH,
                offset: CARD_WIDTH * index,
                index,
              })}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig.current}
              style={{ width: CARD_WIDTH }}
              decelerationRate="fast"
            />
          )}

          {/* Cancel */}
          <TouchableOpacity
            onPress={onClose}
            style={[styles.cancelBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    paddingTop: 16,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  monthLabel: { fontSize: 17, fontWeight: "700" },
  swipeHint: { fontSize: 11, marginTop: 2 },
  yearPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginLeft: 10,
  },
  yearPillText: { fontSize: 15, fontWeight: "600" },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 8,
  },
  yearCell: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  yearCellText: { fontSize: 15 },
  // Header row: exactly 7 equal columns, no flex trickery
  row: {
    flexDirection: "row",
    width: CELL_SIZE * 7,
    alignSelf: "center",
    marginBottom: 4,
  },
  dayHeader: {
    width: CELL_SIZE,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  // Grid: fixed to 7 columns, wrap is guaranteed at the right boundary
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: CELL_SIZE * 7,
    alignSelf: "center",
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  dayNum: { fontSize: 15 },
  cancelBtn: {
    marginHorizontal: 16,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 14,
    alignItems: "center",
    marginTop: 8,
  },
  cancelText: { fontSize: 15 },
});
