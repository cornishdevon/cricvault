import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePro } from "@/contexts/ProContext";
import { useColors } from "@/hooks/useColors";

const FEATURES = [
  { icon: "book-open",   title: "AI Coaching Tips",         desc: "Personalised drills and insights matched to your stats" },
  { icon: "bar-chart-2", title: "Deep Season Analysis",      desc: "Projections, form trends, and advanced breakdowns" },
  { icon: "award",       title: "Career Level Badges",       desc: "Unlock all 11 XP tiers and bowling level milestones" },
  { icon: "image",       title: "Unlimited Media",           desc: "Attach photos and videos to every match" },
  { icon: "share-2",     title: "Share & Export",            desc: "Generate shareable match reports and season cards" },
  { icon: "cloud",       title: "Cloud Sync",                desc: "Your stats available on web and mobile, always in sync" },
];

export default function UpgradeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPro, isLoading, error, purchasePro, restorePurchases, clearError } = usePro();

  useEffect(() => {
    if (isPro) {
      router.back();
    }
  }, [isPro]);

  useEffect(() => {
    if (error) {
      Alert.alert("Purchase Error", error, [{ text: "OK", onPress: clearError }]);
    }
  }, [error]);

  const handleRestore = async () => {
    const found = await restorePurchases();
    if (!found && !error) {
      Alert.alert(
        "No subscription found",
        "We couldn't find an active CricVault Pro subscription for this Apple ID.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.pavilion }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={22} color={colors.pavilionForeground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.pavilionForeground }]}>CricVault Pro</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroBadge, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
            <Feather name="star" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Unlock CricVault Pro</Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            Everything you need to track, analyse and improve your cricket — one low annual price.
          </Text>
        </View>

        {/* Price */}
        <View style={[styles.priceCard, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <Text style={styles.priceAmount}>£4.99</Text>
          <Text style={styles.pricePeriod}>per year</Text>
          <Text style={styles.priceNote}>That's less than 10p a week</Text>
        </View>

        {/* Features */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>What you get</Text>
        {FEATURES.map((f) => (
          <View key={f.title} style={[styles.featureRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primary + "18" }]}>
              <Feather name={f.icon as any} size={20} color={colors.primary} />
            </View>
            <View style={styles.featureBody}>
              <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
            </View>
            <Feather name="check-circle" size={18} color={colors.primary} />
          </View>
        ))}

        {/* Subscribe button */}
        <TouchableOpacity
          style={[styles.subscribeBtn, { backgroundColor: colors.primary }, isLoading && { opacity: 0.7 }]}
          onPress={purchasePro}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.subscribeBtnText}>Subscribe for £4.99 / year</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          Payment charged to your Apple ID at confirmation. Subscription auto-renews annually unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your Apple ID subscription settings.
        </Text>

        {/* Restore */}
        <TouchableOpacity onPress={handleRestore} disabled={isLoading} style={styles.restoreBtn}>
          <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>
            Restore Purchases
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { width: 36, alignItems: "flex-start" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },

  content: { padding: 20, gap: 12 },

  hero: { alignItems: "center", paddingVertical: 16 },
  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 8 },
  heroSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21, paddingHorizontal: 8 },

  priceCard: {
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginVertical: 4,
  },
  priceAmount: { fontSize: 44, fontFamily: "Inter_700Bold", color: "#fff" },
  pricePeriod: { fontSize: 16, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.85)", marginTop: 2 },
  priceNote: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", marginTop: 6 },

  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 4 },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureBody: { flex: 1 },
  featureTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  featureDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },

  subscribeBtn: {
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 8,
  },
  subscribeBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },

  legal: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
    textAlign: "center",
    paddingHorizontal: 4,
  },

  restoreBtn: { alignItems: "center", paddingVertical: 10 },
  restoreText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
