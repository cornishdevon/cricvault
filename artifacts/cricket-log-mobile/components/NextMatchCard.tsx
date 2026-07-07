import React, { useEffect, useRef, useState } from "react";
import { Animated, View, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { Fixture } from "@workspace/api-client-react";
import { exportFixtureToCalendar } from "@/utils/calendarExport";

const BOARD_BG     = "#0c1a0e";
const BOARD_BORDER = "#1a3320";
const LABEL        = "#4a7c59";
const AMBER        = "#f59e0b";
const GREEN_LIGHT  = "#6ee7b7";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function NextMatchCard({
  fixture,
  onAddFixture,
  onDelete,
}: {
  fixture: Fixture | null;
  onAddFixture: () => void;
  onDelete?: (id: number) => void;
}) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!fixture) return;
    setExporting(true);
    try {
      await exportFixtureToCalendar(fixture);
    } finally {
      setExporting(false);
    }
  };

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  if (!fixture) {
    return (
      <TouchableOpacity
        onPress={onAddFixture}
        activeOpacity={0.75}
        style={{
          marginHorizontal: 16,
          marginBottom: 14,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: "#2a5530",
          backgroundColor: BOARD_BG,
          overflow: "hidden",
        }}
      >
        {/* header strip */}
        <View style={{
          paddingHorizontal: 14, paddingVertical: 7,
          backgroundColor: "#0f2014",
          borderBottomWidth: 1, borderBottomColor: BOARD_BORDER,
        }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 9, color: LABEL, letterSpacing: 1.6, textTransform: "uppercase" }}>
            Next Match
          </Text>
        </View>

        {/* body */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, gap: 14 }}>
          <View style={{ alignItems: "center", justifyContent: "center", width: 44, height: 44 }}>
            <Animated.View style={{
              position: "absolute",
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: AMBER + "18",
              transform: [{ scale: pulseAnim }],
            }} />
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: "#1a3320",
              borderWidth: 1, borderColor: "#2a5530",
              alignItems: "center", justifyContent: "center",
            }}>
              <Feather name="plus" size={18} color={AMBER} />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: AMBER }}>Schedule a fixture</Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: LABEL, marginTop: 3, lineHeight: 17 }}>
              Add your next match to track upcoming games and export to your calendar
            </Text>
          </View>

          <Feather name="chevron-right" size={16} color={LABEL} />
        </View>
      </TouchableOpacity>
    );
  }

  const days = daysUntil(fixture.date);
  const isToday    = days === 0;
  const isTomorrow = days === 1;
  const isPast     = days < 0;

  const countdownLabel = isPast ? "Match passed" : isToday ? "TODAY" : isTomorrow ? "Tomorrow" : `In ${days} days`;
  const countdownColor = isPast ? "#f87171" : isToday ? AMBER : GREEN_LIGHT;

  return (
    <View style={{
      marginHorizontal: 16, marginBottom: 14,
      borderRadius: 14, overflow: "hidden",
      backgroundColor: BOARD_BG, borderWidth: 1.5, borderColor: BOARD_BORDER,
    }}>
      {/* ── Header strip ── */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 14, paddingVertical: 7,
        backgroundColor: "#0f2014",
        borderBottomWidth: 1, borderBottomColor: BOARD_BORDER,
      }}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 9, color: LABEL, letterSpacing: 1.6, textTransform: "uppercase" }}>
          Next Match
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 10, color: countdownColor }}>{countdownLabel}</Text>
          <TouchableOpacity onPress={onAddFixture} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="plus-circle" size={14} color={LABEL} />
          </TouchableOpacity>
          {onDelete && (
            <TouchableOpacity onPress={() => onDelete(fixture.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="trash-2" size={13} color={LABEL} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Body ── */}
      <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: AMBER, marginBottom: 4 }}>
          vs {fixture.opponent}
        </Text>
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: GREEN_LIGHT, marginBottom: 6 }}>
          {formatDate(fixture.date)}{fixture.time ? ` · ${fixture.time}` : ""}
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {fixture.venue ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="map-pin" size={11} color={LABEL} />
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: LABEL }}>{fixture.venue}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Feather name="tag" size={11} color={LABEL} />
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: LABEL }}>{fixture.matchType}</Text>
          </View>
          {fixture.playingFor ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="users" size={11} color={LABEL} />
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: LABEL }}>{fixture.playingFor}</Text>
            </View>
          ) : null}
          {fixture.series ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="award" size={11} color={LABEL} />
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: LABEL }}>{fixture.series}</Text>
            </View>
          ) : null}
        </View>

        {fixture.notes ? (
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: LABEL, marginTop: 8, fontStyle: "italic" }}>
            {fixture.notes}
          </Text>
        ) : null}
      </View>

      {/* ── Add to Calendar button ── */}
      <TouchableOpacity
        onPress={handleExport}
        disabled={exporting}
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "center",
          gap: 7, margin: 10,
          paddingVertical: 8, borderRadius: 10,
          backgroundColor: "#1a3320",
          borderWidth: 1, borderColor: "#2a5530",
        }}
      >
        {exporting
          ? <ActivityIndicator size="small" color={AMBER} />
          : <Feather name="calendar" size={13} color={AMBER} />
        }
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: AMBER }}>
          {Platform.OS === "web" ? "Download .ics" : "Add to Calendar"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
