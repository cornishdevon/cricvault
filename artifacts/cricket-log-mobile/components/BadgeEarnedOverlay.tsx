import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { type Badge } from "@/utils/computeBadges";

const BADGE_IMAGES: Record<string, ReturnType<typeof require>> = {
  "smellGrass":         require("@/assets/badges/smellGrass.png"),
  "halfCentury":        require("@/assets/badges/halfCentury.png"),
  "nervousNineties":    require("@/assets/badges/nervousNineties.png"),
  "oneShort":           require("@/assets/badges/oneShort.png"),
  "consistent":         require("@/assets/badges/consistent.png"),
  "hotStreak":          require("@/assets/badges/hotStreak.png"),
  "onTheHunt":          require("@/assets/badges/onTheHunt.png"),
  "boundaryMachine":    require("@/assets/badges/boundaryMachine.png"),
  "raiseTheBat":        require("@/assets/badges/raiseTheBat.png"),
  "leatherWillow":      require("@/assets/badges/leatherWillow.png"),
  "redInk":             require("@/assets/badges/redInk.png"),
  "strokeMaker":        require("@/assets/badges/strokeMaker.png"),
  "runMachine":         require("@/assets/badges/runMachine.png"),
  "2000club":           require("@/assets/badges/2000club.png"),
  "100wickets":         require("@/assets/badges/100wickets.png"),
  "wicketTaker":        require("@/assets/badges/wicketTaker.png"),
  "deadEye":            require("@/assets/badges/deadEye.png"),
  "hitThosePads":       require("@/assets/badges/hitThosePads.png"),
  "lineLength":         require("@/assets/badges/lineLength.png"),
  "bucketHands":        require("@/assets/badges/bucketHands.png"),
  "safeGloves":         require("@/assets/badges/safeGloves.png"),
  "allRounder":         require("@/assets/badges/allRounder.png"),
  "matchWinner":        require("@/assets/badges/matchWinner.png"),
  "triggered":          require("@/assets/badges/triggered.png"),
  "duckHunting":        require("@/assets/badges/duckHunting.png"),
  "catchingPractice":   require("@/assets/badges/catchingPractice.png"),
  "keepRunning":        require("@/assets/badges/keepRunning.png"),
  "butterFingers":      require("@/assets/badges/butterFingers.png"),
  "dontSnatch":         require("@/assets/badges/dontSnatch.png"),
  "teflon":             require("@/assets/badges/teflon.png"),
  "thanksForComing":    require("@/assets/badges/thanksForComing.png"),
  "thousandUp":         require("@/assets/badges/thousandUp.png"),
  "pinch-hitter":       require("@/assets/badges/pinch-hitter.png"),
  "century":            require("@/assets/badges/century.png"),
  "goldenDuck":         require("@/assets/badges/goldenDuck.png"),
  "150club":            require("@/assets/badges/150club.png"),
  "personalBest":       require("@/assets/badges/personalBest.png"),
  "billyBigPads":       require("@/assets/badges/billyBigPads.png"),
  "fiveFor":            require("@/assets/badges/fiveFor.png"),
  "garden-gate":        require("@/assets/badges/garden-gate.png"),
  "debut":              require("@/assets/badges/debut.png"),
  "doffYourHelmet":     require("@/assets/badges/doffYourHelmet.png"),
  "boundaryGetter":     require("@/assets/badges/boundaryGetter.png"),
  "drs":                require("@/assets/badges/drs.png"),
  "hatTrick":           require("@/assets/badges/hatTrick.png"),
  "playerOfTheMatch":   require("@/assets/badges/playerOfTheMatch.png"),
  "bigHitter":          require("@/assets/badges/bigHitter.png"),
  "newSeason":          require("@/assets/badges/newSeason.png"),
  "doubleCentury":      require("@/assets/badges/doubleCentury.png"),
  "tripleCentury":      require("@/assets/badges/tripleCentury.png"),
  "quadrupleCentury":   require("@/assets/badges/quadrupleCentury.png"),
  "rainStoppedPlay":    require("@/assets/badges/rainStoppedPlay.png"),
};

interface Props {
  badge: Badge;
  onDismiss: () => void;
}

export function BadgeEarnedOverlay({ badge, onDismiss }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale      = useRef(new Animated.Value(0.7)).current;
  const cardOpacity    = useRef(new Animated.Value(0)).current;
  const badgeScale     = useRef(new Animated.Value(0.5)).current;
  const shimmer        = useRef(new Animated.Value(0)).current;

  const isNeg = badge.isNegative;
  const accentColor = isNeg ? "#f87171" : colors.primary;
  const bgColor     = isNeg ? "#1a0a0a" : "#0d1f0e";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(cardScale,   { toValue: 1,   useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(cardOpacity, { toValue: 1,   duration: 200, useNativeDriver: true }),
      Animated.spring(badgeScale,  { toValue: 1,   useNativeDriver: true, tension: 60, friction: 6, delay: 150 }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(cardOpacity,     { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(cardScale,       { toValue: 0.85, duration: 180, useNativeDriver: true }),
    ]).start(onDismiss);
  };

  const imageSource = badge.imageKey ? BADGE_IMAGES[badge.imageKey] : null;

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Pressable style={StyleSheet.absoluteFillObject} onPress={dismiss}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      <View style={[styles.container, { paddingBottom: insets.bottom + 24, paddingTop: insets.top }]}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: bgColor, borderColor: accentColor + "60", transform: [{ scale: cardScale }], opacity: cardOpacity },
          ]}
        >
          <Animated.Text style={[styles.earnedLabel, { color: accentColor, opacity: shimmerOpacity }]}>
            {isNeg ? "Achievement Unlocked" : "🏆 Achievement Unlocked!"}
          </Animated.Text>

          <View style={[styles.imageWrap, { borderColor: accentColor + "50", backgroundColor: accentColor + "15" }]}>
            {imageSource ? (
              <Animated.Image
                source={imageSource}
                style={[styles.badgeImage, { transform: [{ scale: badgeScale }] }]}
                resizeMode="contain"
              />
            ) : (
              <Animated.Text style={[styles.badgeEmoji, { transform: [{ scale: badgeScale }] }]}>
                {badge.icon}
              </Animated.Text>
            )}
          </View>

          <Text style={[styles.badgeLabel, { color: isNeg ? "#f87171" : "#fff" }]}>{badge.label}</Text>
          <Text style={[styles.badgeDesc, { color: "rgba(255,255,255,0.65)" }]}>{badge.description}</Text>
          {badge.detail ? (
            <View style={[styles.detailPill, { backgroundColor: accentColor + "25", borderColor: accentColor + "50" }]}>
              <Text style={[styles.detailText, { color: accentColor }]}>{badge.detail}</Text>
            </View>
          ) : null}

          <Pressable onPress={dismiss} style={[styles.dismissBtn, { borderColor: accentColor + "50" }]}>
            <Text style={[styles.dismissText, { color: accentColor }]}>Tap to continue</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  earnedLabel: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  imageWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  badgeImage: {
    width: 90,
    height: 90,
  },
  badgeEmoji: {
    fontSize: 56,
  },
  badgeLabel: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginTop: 4,
  },
  badgeDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  detailPill: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 4,
  },
  detailText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  dismissBtn: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  dismissText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
