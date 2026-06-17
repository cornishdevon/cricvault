import { useListCoachingTips } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
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
];

function QuoteBanner({ colors }: { colors: ReturnType<typeof useColors> }) {
  const q = CRICKET_QUOTES[Math.floor(Date.now() / 86400000) % CRICKET_QUOTES.length];
  return (
    <View style={[styles.quoteBanner, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
      <Feather name="message-circle" size={16} color={colors.primary} style={{ marginBottom: 6 }} />
      <Text style={[styles.quoteText, { color: colors.foreground }]}>"{q.quote}"</Text>
      <Text style={[styles.quoteAuthor, { color: colors.mutedForeground }]}>— {q.author}</Text>
    </View>
  );
}

export default function CoachingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const { data: tips, isLoading, refetch, isRefetching } = useListCoachingTips(
    activeCategory !== "All" ? { category: activeCategory } : {},
  );

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
                onPress={() => setActiveCategory(cat)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? accent : colors.card,
                    borderColor: active ? accent : colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tips */}
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
          tips.map((tip) => {
            const accent = CATEGORY_ACCENT[tip.category] ?? colors.primary;
            const icon = (CATEGORY_ICON[tip.category] ?? "book-open") as any;
            return (
              <View
                key={tip.id}
                style={[
                  styles.tipCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.tipHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: accent + "20" }]}>
                    <Feather name={icon} size={14} color={accent} />
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
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

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

  categoryRow: {
    paddingVertical: 4,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  tipCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tipTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 21,
  },
  tipDetail: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },

  empty: {
    alignItems: "center",
    gap: 12,
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
