import { useGetPerMatchStats } from "@workspace/api-client-react";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useT";
import { computeBadges, type PerMatchStat, type Badge } from "@/utils/computeBadges";

const BADGE_IMAGES: Record<string, ReturnType<typeof require>> = {
  "pinch-hitter":  require("@/assets/badges/pinch-hitter.png"),
  "century":       require("@/assets/badges/century.png"),
  "goldenDuck":    require("@/assets/badges/goldenDuck.png"),
  "150club":       require("@/assets/badges/150club.png"),
  "personalBest":  require("@/assets/badges/personalBest.png"),
  "billyBigPads":  require("@/assets/badges/billyBigPads.png"),
  "fiveFor":       require("@/assets/badges/fiveFor.png"),
  "garden-gate":   require("@/assets/badges/garden-gate.png"),
  "debut":         require("@/assets/badges/debut.png"),
  "doffYourHelmet":  require("@/assets/badges/doffYourHelmet.png"),
  "boundaryGetter":  require("@/assets/badges/boundaryGetter.png"),
  "drs":             require("@/assets/badges/drs.png"),
  "hatTrick":           require("@/assets/badges/hatTrick.png"),
  "playerOfTheMatch":   require("@/assets/badges/playerOfTheMatch.png"),
  "bigHitter":          require("@/assets/badges/bigHitter.png"),
  "newSeason":          require("@/assets/badges/newSeason.png"),
  "doubleCentury":      require("@/assets/badges/doubleCentury.png"),
  "tripleCentury":      require("@/assets/badges/tripleCentury.png"),
  "quadrupleCentury":   require("@/assets/badges/quadrupleCentury.png"),
  "rainStoppedPlay":    require("@/assets/badges/rainStoppedPlay.png"),
  "thousandUp":         require("@/assets/badges/thousandUp.png"),
};

function BadgeTile({
  badge,
  colors,
  onPress,
}: {
  badge: Badge;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const isLocked = !badge.earned;
  const bgColor     = isLocked ? "#3f3f46" : badge.isNegative ? "#e4e4e7" : colors.card;
  const borderColor = isLocked ? "#52525b" : badge.isNegative ? "#a1a1aa" : colors.primary + "50";
  const labelColor  = isLocked ? "#a1a1aa" : badge.isNegative ? "#f87171" : colors.foreground;
  const descColor   = isLocked ? "#71717a" : colors.mutedForeground;
  const detailColor = badge.isNegative ? "#f87171" : colors.primary;

  const imageSource = badge.imageKey ? BADGE_IMAGES[badge.imageKey] : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: bgColor, borderColor, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={styles.iconWrap}>
        {isLocked ? (
          <Text style={styles.icon}>🔒</Text>
        ) : imageSource ? (
          <Image
            source={imageSource}
            style={[styles.badgeImage, badge.imageScale && badge.imageScale !== 1 ? { transform: [{ scale: badge.imageScale }] } : undefined]}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.icon}>{badge.icon}</Text>
        )}
      </View>
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
    </Pressable>
  );
}

function BadgeModal({
  badge,
  onClose,
  colors,
}: {
  badge: Badge | null;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const t = useT();
  if (!badge) return null;

  const isLocked    = !badge.earned;
  const imageSource = badge.imageKey ? BADGE_IMAGES[badge.imageKey] : null;
  const accentColor = badge.isNegative ? "#f87171" : colors.primary;
  const bgColor     = isLocked ? "#27272a" : badge.isNegative ? "#2a1010" : colors.card;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: bgColor, borderColor: accentColor + "60" }]}
          onPress={() => {}}
        >
          <View style={styles.modalIconWrap}>
            {isLocked ? (
              <Text style={styles.modalIconLocked}>🔒</Text>
            ) : imageSource ? (
              <Image source={imageSource} style={styles.modalImage} resizeMode="contain" />
            ) : (
              <Text style={styles.modalIconEmoji}>{badge.icon}</Text>
            )}
          </View>

          {badge.earned && (
            <View style={[styles.earnedPill, { backgroundColor: accentColor + "22", borderColor: accentColor + "55" }]}>
              <Text style={[styles.earnedPillText, { color: accentColor }]}>
                {badge.isNegative ? t("achievements.unlocked") : t("achievements.earnedMark")}
              </Text>
            </View>
          )}

          <Text style={[styles.modalLabel, { color: badge.isNegative ? "#f87171" : colors.foreground }]}>
            {badge.label}
          </Text>
          <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
            {badge.description}
          </Text>
          {badge.earned && badge.detail ? (
            <Text style={[styles.modalDetail, { color: accentColor }]}>{badge.detail}</Text>
          ) : null}
          {!badge.earned && (
            <Text style={[styles.modalLocked, { color: "#71717a" }]}>{t("achievements.keepPlaying")}</Text>
          )}

          {badge.earned && badge.shareText ? (
            <TouchableOpacity
              onPress={async () => {
                try { await Share.share({ message: badge.shareText! }); } catch {}
              }}
              style={[styles.shareBtn, { backgroundColor: accentColor + "22", borderColor: accentColor + "55" }]}
            >
              <Text style={[styles.shareBtnText, { color: accentColor }]}>{t("achievements.shareBadge")}</Text>
            </TouchableOpacity>
          ) : null}

          <Pressable onPress={onClose} style={[styles.closeBtn, { borderColor: colors.border }]}>
            <Text style={[styles.closeBtnText, { color: colors.mutedForeground }]}>{t("common.close")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </View>
  );
}

export default function AchievementsScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const t = useT();
  const [selected, setSelected] = useState<Badge | null>(null);

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
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t("achievements.title")}</Text>
          {badges.length > 0 && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {earnedCount} / {badges.length} {t("achievements.earnedCount")}
            </Text>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
        ) : badges.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏏</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t("achievements.noMatchesYet")}</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {t("achievements.logFirstMatch")}
            </Text>
          </View>
        ) : (
          <>
            {innings.length > 0 && (
              <View style={[styles.milestonesBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MilestonePip color="#4A9E61" count={innings.filter((d) => (d.runs ?? 0) >= 25).length} label="25+" />
                <MilestonePip color={colors.primary} count={fifties} label="50+" />
                <MilestonePip color="#C0392B" count={hundreds} label="100+" />
                <Text style={[styles.inningsTotal, { color: colors.mutedForeground }]}>
                  {innings.length} {t("home.innings")}
                </Text>
              </View>
            )}

            {positive.some((b) => b.earned) && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t("achievements.earned")}</Text>
                <View style={styles.grid}>
                  {positive.filter((b) => b.earned).map((badge) => (
                    <BadgeTile key={badge.id} badge={badge} colors={colors} onPress={() => setSelected(badge)} />
                  ))}
                </View>
              </>
            )}

            {positive.some((b) => !b.earned) && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t("achievements.locked")}</Text>
                <View style={styles.grid}>
                  {positive.filter((b) => !b.earned).map((badge) => (
                    <BadgeTile key={badge.id} badge={badge} colors={colors} onPress={() => setSelected(badge)} />
                  ))}
                </View>
              </>
            )}

            {negative.some((b) => b.earned) && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                  {t("achievements.unlucky")}
                </Text>
                <View style={styles.grid}>
                  {negative.filter((b) => b.earned).map((badge) => (
                    <BadgeTile key={badge.id} badge={badge} colors={colors} onPress={() => setSelected(badge)} />
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <BadgeModal badge={selected} onClose={() => setSelected(null)} colors={colors} />
    </>
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
  iconWrap:   { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  icon:       { fontSize: 28, textAlign: "center", lineHeight: 36 },
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

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  modalIconWrap: { marginBottom: 4 },
  modalImage: { width: 140, height: 140, borderRadius: 70 },
  modalIconEmoji: { fontSize: 80, textAlign: "center" },
  modalIconLocked: { fontSize: 72, textAlign: "center" },
  earnedPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  earnedPillText: { fontSize: 12, fontWeight: "700" },
  modalLabel: { fontSize: 22, fontWeight: "800", textAlign: "center", lineHeight: 28 },
  modalDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  modalDetail: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  modalLocked: { fontSize: 13, textAlign: "center", fontStyle: "italic" },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  shareBtnText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  closeBtn: {
    marginTop: 4,
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  closeBtnText: { fontSize: 14, fontWeight: "600" },
});
