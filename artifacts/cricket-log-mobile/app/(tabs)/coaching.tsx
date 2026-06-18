import { useListCoachingTips } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_H_PADDING = 16;
const CARD_W = SCREEN_W - CARD_H_PADDING * 2;

const CATEGORIES = ["All", "Batting", "Bowling", "Fielding", "Fitness", "Mental"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_ACCENT: Record<string, string> = {
  Batting:  "#22c55e",
  Bowling:  "#8b5cf6",
  Fielding: "#f59e0b",
  Fitness:  "#ef4444",
  Mental:   "#06b6d4",
};

const CATEGORY_ICON: Record<string, string> = {
  Batting:  "trending-up",
  Bowling:  "activity",
  Fielding: "shield",
  Fitness:  "zap",
  Mental:   "sun",
};

const CRICKET_QUOTES = [
  { quote: "Cricket is a game of glorious uncertainties.", author: "Unknown" },
  { quote: "Pressure is a privilege — it only comes to those who earn it.", author: "Billie Jean King" },
  { quote: "The best time to fix your technique is before it breaks in a match.", author: "Coaching proverb" },
  { quote: "Every ball is a new beginning.", author: "Unknown" },
  { quote: "Consistency is what transforms average into excellence.", author: "Unknown" },
  { quote: "Great players are made in the nets, not in the match.", author: "Coaching proverb" },
  { quote: "The harder you work, the luckier you get.", author: "Gary Player" },
  { quote: "Champions train, losers complain.", author: "Unknown" },
  { quote: "It's not the will to win that counts — it's the will to prepare to win.", author: "Paul Bryant" },
  { quote: "Every over is a fresh opportunity.", author: "Unknown" },
];

function QuoteBanner({ colors }: { colors: ReturnType<typeof useColors> }) {
  // Rotates every hour so it feels fresh
  const q = CRICKET_QUOTES[Math.floor(Date.now() / 3_600_000) % CRICKET_QUOTES.length];
  return (
    <View style={[styles.quoteBanner, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
      <Feather name="message-circle" size={16} color={colors.primary} style={{ marginBottom: 6 }} />
      <Text style={[styles.quoteText, { color: colors.foreground }]}>"{q.quote}"</Text>
      <Text style={[styles.quoteAuthor, { color: colors.mutedForeground }]}>— {q.author}</Text>
    </View>
  );
}

type Tip = { id: number; category: string; tip: string; detail?: string | null };

function TipCard({ tip, colors }: { tip: Tip; colors: ReturnType<typeof useColors> }) {
  const accent = CATEGORY_ACCENT[tip.category] ?? colors.primary;
  const icon = (CATEGORY_ICON[tip.category] ?? "book-open") as any;
  return (
    <View style={[styles.tipCard, { width: CARD_W, backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.tipHeader}>
        <View style={[styles.iconCircle, { backgroundColor: accent + "20" }]}>
          <Feather name={icon} size={16} color={accent} />
        </View>
        <View style={[styles.categoryPill, { backgroundColor: accent + "18", borderColor: accent + "40" }]}>
          <Text style={[styles.categoryPillText, { color: accent }]}>{tip.category}</Text>
        </View>
      </View>
      <Text style={[styles.tipTitle, { color: colors.foreground }]}>{tip.tip}</Text>
      {tip.detail ? (
        <Text style={[styles.tipDetail, { color: colors.mutedForeground }]}>{tip.detail}</Text>
      ) : null}
    </View>
  );
}

function PaginationDots({
  total,
  current,
  colors,
}: {
  total: number;
  current: number;
  colors: ReturnType<typeof useColors>;
}) {
  if (total <= 1) return null;
  const MAX_DOTS = 7;
  const dots = total <= MAX_DOTS ? total : MAX_DOTS;
  const isCondensed = total > MAX_DOTS;

  return (
    <View style={styles.dotsRow}>
      {isCondensed ? (
        <Text style={[styles.pageCounter, { color: colors.mutedForeground }]}>
          {current + 1} / {total}
        </Text>
      ) : (
        Array.from({ length: dots }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === current ? colors.primary : colors.border,
                width: i === current ? 18 : 7,
              },
            ]}
          />
        ))
      )}
    </View>
  );
}

export default function CoachingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const { data: tips, isLoading, refetch, isRefetching } = useListCoachingTips(
    activeCategory !== "All" ? { category: activeCategory } : {},
    {
      query: {
        refetchInterval: 5 * 60 * 1000,
        staleTime: 60 * 1000,
      },
    }
  );

  const onCategoryChange = (cat: Category) => {
    setActiveCategory(cat);
    setCurrentIndex(0);
    flatRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };

  const goNext = () => {
    const next = Math.min(currentIndex + 1, (tips?.length ?? 1) - 1);
    flatRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
  };

  const goPrev = () => {
    const prev = Math.max(currentIndex - 1, 0);
    flatRef.current?.scrollToIndex({ index: prev, animated: true });
    setCurrentIndex(prev);
  };

  const tipCount = tips?.length ?? 0;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
      }
    >
      <View style={styles.container}>
        <QuoteBanner colors={colors} />

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => {
            const active = cat === activeCategory;
            const accent = cat === "All" ? colors.primary : CATEGORY_ACCENT[cat];
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => onCategoryChange(cat)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? accent : colors.card,
                    borderColor: active ? accent : colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: active ? "#fff" : colors.mutedForeground }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tips carousel */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : !tips || tips.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="book-open" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No tips in this category yet.
            </Text>
          </View>
        ) : (
          <View>
            <FlatList
              ref={flatRef}
              data={tips}
              keyExtractor={(t) => String(t.id)}
              renderItem={({ item }) => <TipCard tip={item} colors={colors} />}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToAlignment="start"
              decelerationRate="fast"
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              contentContainerStyle={{ gap: 0 }}
              getItemLayout={(_, index) => ({
                length: CARD_W,
                offset: CARD_W * index,
                index,
              })}
            />

            <PaginationDots total={tipCount} current={currentIndex} colors={colors} />

            {/* Prev / Next buttons */}
            <View style={styles.navRow}>
              <TouchableOpacity
                style={[
                  styles.navBtn,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: currentIndex === 0 ? 0.4 : 1 },
                ]}
                onPress={goPrev}
                disabled={currentIndex === 0}
              >
                <Feather name="chevron-left" size={20} color={colors.primary} />
                <Text style={[styles.navBtnText, { color: colors.primary }]}>Prev</Text>
              </TouchableOpacity>

              <View style={[styles.tipCounter, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.tipCounterText, { color: colors.mutedForeground }]}>
                  {currentIndex + 1} of {tipCount}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.navBtn,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: currentIndex === tipCount - 1 ? 0.4 : 1 },
                ]}
                onPress={goNext}
                disabled={currentIndex === tipCount - 1}
              >
                <Text style={[styles.navBtnText, { color: colors.primary }]}>Next</Text>
                <Feather name="chevron-right" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Refresh hint */}
            <Text style={[styles.refreshHint, { color: colors.mutedForeground }]}>
              Pull down to refresh · Tips update every 5 mins
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: CARD_H_PADDING, paddingTop: 16, gap: 12 },

  quoteBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    marginBottom: 4,
  },
  quoteText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
  },
  quoteAuthor: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
    textAlign: "center",
  },

  categoryRow: { paddingVertical: 4, gap: 8, flexDirection: "row" },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    minHeight: 200,
  },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  categoryPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  categoryPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tipTitle: { fontSize: 17, fontFamily: "Inter_700Bold", lineHeight: 24 },
  tipDetail: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 14,
    height: 12,
  },
  dot: { height: 7, borderRadius: 4 },
  pageCounter: { fontSize: 13, fontFamily: "Inter_400Regular" },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  navBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  tipCounter: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tipCounterText: { fontSize: 13, fontFamily: "Inter_400Regular" },

  refreshHint: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 10,
  },

  empty: { alignItems: "center", gap: 12, marginTop: 60, paddingHorizontal: 40 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
