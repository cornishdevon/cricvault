import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
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

// How many months to generate before and after today
const MONTHS_BEFORE = 24;
const MONTHS_AFTER  = 24;

const CARD_WIDTH = Math.min(Dimensions.get("window").width - 32, 360);

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
  for (let i = -MONTHS_BEFORE; i <= MONTHS_AFTER; i++) {
    let m = today.getMonth() + i;
    let y = today.getFullYear();
    y += Math.floor(m / 12);
    m = ((m % 12) + 12) % 12;
    entries.push({ year: y, month: m, key: `${y}-${m}` });
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
    return idx >= 0 ? idx : MONTHS_BEFORE;
  }, []);

  const [visibleIndex, setVisibleIndex] = useState(initialIndex);
  const flatRef = useRef<FlatList<MonthEntry>>(null);

  useEffect(() => {
    // Scroll to initial month without animation so it's instant on open
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

  const renderItem = useCallback(
    ({ item }: { item: MonthEntry }) => {
      const grid = buildGrid(item.year, item.month);
      return (
        <View style={{ width: CARD_WIDTH, paddingHorizontal: 16 }}>
          {/* Day-of-week headers */}
          <View style={styles.row}>
            {DAY_LABELS.map((l) => (
              <Text key={l} style={[styles.dayHeader, { color: colors.mutedForeground }]}>{l}</Text>
            ))}
          </View>

          {/* Day grid */}
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

  const { year: visY, month: visM } = months[visibleIndex] ?? months[initialIndex];

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          {/* Month label */}
          <View style={styles.header}>
            <Text style={[styles.monthLabel, { color: colors.foreground }]}>
              {MONTH_NAMES[visM]} {visY}
            </Text>
            <Text style={[styles.swipeHint, { color: colors.mutedForeground }]}>
              swipe to change month
            </Text>
          </View>

          {/* Swipeable month pages */}
          <FlatList
            ref={flatRef}
            data={months}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
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

          {/* Cancel */}
          <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { borderColor: colors.border }]}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </View>
  );
}

const CELL_SIZE = 40;

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
  },
  monthLabel: { fontSize: 17, fontWeight: "700" },
  swipeHint: { fontSize: 11, marginTop: 2 },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 4,
  },
  dayHeader: { width: CELL_SIZE, textAlign: "center", fontSize: 12, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around" },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  dayNum: { fontSize: 15 },
  cancelBtn: {
    marginTop: 14,
    marginHorizontal: 16,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 14,
    alignItems: "center",
  },
  cancelText: { fontSize: 15 },
});
