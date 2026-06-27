import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Text, View } from "react-native";

const TILE_W = 64;
const TILE_H = 88;
const HALF_H = TILE_H / 2;
const FONT_SIZE = 58;
const RADIUS = 12;
const DIVIDER = 2;

const SLATE = "#12213a";
const INK = "#f0f4ff";
const DIVIDER_COLOR = "rgba(0,0,0,0.55)";
const TILE_BORDER = "rgba(210, 175, 90, 0.55)";

function HalfDigit({
  digit,
  isTop,
}: {
  digit: string;
  isTop: boolean;
}) {
  return (
    <View
      style={{
        width: TILE_W,
        height: HALF_H,
        overflow: "hidden",
        backgroundColor: SLATE,
        borderTopLeftRadius: isTop ? RADIUS : 0,
        borderTopRightRadius: isTop ? RADIUS : 0,
        borderBottomLeftRadius: isTop ? 0 : RADIUS,
        borderBottomRightRadius: isTop ? 0 : RADIUS,
      }}
    >
      <Text
        style={{
          position: "absolute",
          top: isTop ? 2 : 2 - HALF_H,
          width: TILE_W,
          textAlign: "center",
          fontSize: FONT_SIZE,
          fontFamily: "Inter_700Bold",
          color: INK,
          lineHeight: TILE_H - 4,
        }}
        numberOfLines={1}
      >
        {digit}
      </Text>
    </View>
  );
}

function SplitFlapDigit({ digit }: { digit: string }) {
  const prevRef = useRef(digit);
  const [staticDigit, setStaticDigit] = useState(digit);
  const [animPrev, setAnimPrev] = useState(digit);

  const topAnim = useRef(new Animated.Value(0)).current;
  const botAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (digit === prevRef.current) return;
    const old = prevRef.current;
    prevRef.current = digit;
    setAnimPrev(old);

    topAnim.stopAnimation();
    botAnim.stopAnimation();
    topAnim.setValue(0);
    botAnim.setValue(1);

    Animated.sequence([
      Animated.timing(topAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(botAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => setStaticDigit(digit), 220);
  }, [digit]);

  const topRotate = topAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-90deg"],
  });
  const botRotate = botAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["90deg", "0deg"],
  });

  return (
    <View
      style={{
        width: TILE_W,
        marginHorizontal: 3,
        borderRadius: RADIUS,
        borderWidth: 1.5,
        borderColor: TILE_BORDER,
        shadowColor: "#D2AF5A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.55,
        shadowRadius: 10,
        elevation: 8,
      }}
    >
      {/* Static background — always shows the current digit */}
      <HalfDigit digit={staticDigit} isTop={true} />
      <View style={{ height: DIVIDER, backgroundColor: DIVIDER_COLOR }} />
      <HalfDigit digit={staticDigit} isTop={false} />

      {/* Top flap: old digit, rotates away (falls forward) around bottom edge */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: TILE_W,
          height: HALF_H,
          overflow: "hidden",
          transform: [
            { perspective: 800 },
            { translateY: -HALF_H / 2 },
            { rotateX: topRotate },
            { translateY: HALF_H / 2 },
          ],
        }}
      >
        <HalfDigit digit={animPrev} isTop={true} />
      </Animated.View>

      {/* Bottom flap: new digit, unfolds downward around top edge */}
      <Animated.View
        style={{
          position: "absolute",
          top: HALF_H + DIVIDER,
          left: 0,
          width: TILE_W,
          height: HALF_H,
          overflow: "hidden",
          transform: [
            { perspective: 800 },
            { translateY: HALF_H / 2 },
            { rotateX: botRotate },
            { translateY: -HALF_H / 2 },
          ],
        }}
      >
        <HalfDigit digit={digit} isTop={false} />
      </Animated.View>
    </View>
  );
}

export function SplitFlapDisplay({ value }: { value: number }) {
  const digits = String(value).split("");

  if (Platform.OS === "web") {
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {digits.map((d, i) => (
          <View
            key={i}
            style={{
              width: TILE_W,
              height: TILE_H,
              marginHorizontal: 3,
              backgroundColor: SLATE,
              borderRadius: RADIUS,
              borderWidth: 1.5,
              borderColor: TILE_BORDER,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: FONT_SIZE,
                fontFamily: "Inter_700Bold",
                color: INK,
              }}
            >
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
        <SplitFlapDigit key={i} digit={d} />
      ))}
    </View>
  );
}
