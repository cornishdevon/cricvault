import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Text, View } from "react-native";

type SizeKey = "lg" | "sm";
const SIZES: Record<SizeKey, { W: number; H: number; HH: number; FS: number; R: number; DIV: number; MX: number }> = {
  lg: { W: 64, H: 88, HH: 44, FS: 58, R: 12, DIV: 2, MX: 3 },
  sm: { W: 28, H: 38, HH: 19, FS: 22, R: 6,  DIV: 1, MX: 2 },
};

const DEFAULT_TILE  = "#1C1C1E";
const DEFAULT_INK   = "#FFFDF8";
const DEFAULT_BORDER = "rgba(210,160,40,0.55)";
const DEFAULT_DIVIDER = "rgba(0,0,0,0.55)";

function HalfDigit({
  digit, isTop, cfg, tileColor, inkColor,
}: {
  digit: string; isTop: boolean;
  cfg: typeof SIZES[SizeKey];
  tileColor: string; inkColor: string;
}) {
  return (
    <View style={{
      width: cfg.W, height: cfg.HH, overflow: "hidden",
      backgroundColor: tileColor,
      borderTopLeftRadius:     isTop ? cfg.R : 0,
      borderTopRightRadius:    isTop ? cfg.R : 0,
      borderBottomLeftRadius:  isTop ? 0 : cfg.R,
      borderBottomRightRadius: isTop ? 0 : cfg.R,
    }}>
      <View style={{ width: cfg.W, height: cfg.H, marginTop: isTop ? 0 : -cfg.HH, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: cfg.FS, fontFamily: "Inter_700Bold", color: inkColor, textAlign: "center", includeFontPadding: false }} numberOfLines={1}>
          {digit}
        </Text>
      </View>
    </View>
  );
}

function SplitFlapDigit({
  digit, cfg, tileColor, inkColor, borderColor,
}: {
  digit: string;
  cfg: typeof SIZES[SizeKey];
  tileColor: string; inkColor: string; borderColor: string;
}) {
  const prevRef    = useRef(digit);
  const [staticDigit, setStaticDigit] = useState(digit);
  const [animPrev,    setAnimPrev]    = useState(digit);
  const topAnim = useRef(new Animated.Value(0)).current;
  const botAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (digit === prevRef.current) return;
    const old = prevRef.current;
    prevRef.current = digit;
    setAnimPrev(old);
    topAnim.stopAnimation(); botAnim.stopAnimation();
    topAnim.setValue(0); botAnim.setValue(1);
    Animated.sequence([
      Animated.timing(topAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(botAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStaticDigit(digit), 220);
  }, [digit]);

  const topRotate = topAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-90deg"] });
  const botRotate = botAnim.interpolate({ inputRange: [0, 1], outputRange: ["90deg", "0deg"] });

  return (
    <View style={{
      width: cfg.W, marginHorizontal: cfg.MX, borderRadius: cfg.R,
      borderWidth: cfg.DIV === 2 ? 1.5 : 1, borderColor,
      shadowColor: borderColor, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: cfg.DIV === 2 ? 12 : 6, elevation: cfg.DIV === 2 ? 8 : 4,
    }}>
      <HalfDigit digit={staticDigit} isTop cfg={cfg} tileColor={tileColor} inkColor={inkColor} />
      <View style={{ height: cfg.DIV, backgroundColor: DEFAULT_DIVIDER }} />
      <HalfDigit digit={staticDigit} isTop={false} cfg={cfg} tileColor={tileColor} inkColor={inkColor} />

      <Animated.View style={{
        position: "absolute", top: 0, left: 0, width: cfg.W, height: cfg.HH, overflow: "hidden",
        transform: [{ perspective: 800 }, { translateY: -cfg.HH / 2 }, { rotateX: topRotate }, { translateY: cfg.HH / 2 }],
      }}>
        <HalfDigit digit={animPrev} isTop cfg={cfg} tileColor={tileColor} inkColor={inkColor} />
      </Animated.View>

      <Animated.View style={{
        position: "absolute", top: cfg.HH + cfg.DIV, left: 0, width: cfg.W, height: cfg.HH, overflow: "hidden",
        transform: [{ perspective: 800 }, { translateY: cfg.HH / 2 }, { rotateX: botRotate }, { translateY: -cfg.HH / 2 }],
      }}>
        <HalfDigit digit={digit} isTop={false} cfg={cfg} tileColor={tileColor} inkColor={inkColor} />
      </Animated.View>
    </View>
  );
}

export function SplitFlapDisplay({
  value,
  minDigits = 1,
  size = "lg",
  tileColor  = DEFAULT_TILE,
  inkColor   = DEFAULT_INK,
  borderColor = DEFAULT_BORDER,
}: {
  value: number;
  minDigits?: number;
  size?: SizeKey;
  tileColor?: string;
  inkColor?: string;
  borderColor?: string;
}) {
  const raw    = String(value);
  const padded = raw.length < minDigits ? raw.padStart(minDigits, "0") : raw;
  const digits = padded.split("");
  const cfg    = SIZES[size];

  if (Platform.OS === "web") {
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {digits.map((d, i) => (
          <View key={i} style={{
            width: cfg.W, height: cfg.H, marginHorizontal: cfg.MX,
            backgroundColor: tileColor, borderRadius: cfg.R,
            borderWidth: cfg.DIV === 2 ? 1.5 : 1, borderColor,
            justifyContent: "center", alignItems: "center",
            shadowColor: borderColor, shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.7, shadowRadius: cfg.DIV === 2 ? 12 : 6,
          }}>
            <Text style={{ fontSize: cfg.FS, fontFamily: "Inter_700Bold", color: inkColor }}>
              {d}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {digits.map((d, i) => (
        <SplitFlapDigit key={i} digit={d} cfg={cfg} tileColor={tileColor} inkColor={inkColor} borderColor={borderColor} />
      ))}
    </View>
  );
}
