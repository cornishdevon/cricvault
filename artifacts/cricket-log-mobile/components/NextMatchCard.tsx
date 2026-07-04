import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { Fixture } from "@workspace/api-client-react";

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
  if (!fixture) {
    return (
      <TouchableOpacity
        onPress={onAddFixture}
        style={{
          marginHorizontal: 16,
          marginBottom: 14,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: BOARD_BORDER,
          borderStyle: "dashed",
          backgroundColor: BOARD_BG,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: "#1a3320",
          alignItems: "center", justifyContent: "center",
        }}>
          <Feather name="plus" size={18} color={AMBER} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: AMBER }}>Add next fixture</Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: LABEL, marginTop: 2 }}>
            Schedule your upcoming match
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  const days = daysUntil(fixture.date);
  const isToday = days === 0;
  const isTomorrow = days === 1;
  const isPast = days < 0;

  const countdownLabel = isPast
    ? "Match passed"
    : isToday
    ? "TODAY"
    : isTomorrow
    ? "Tomorrow"
    : `In ${days} days`;

  const countdownColor = isPast ? "#f87171" : isToday ? AMBER : GREEN_LIGHT;

  return (
    <View style={{
      marginHorizontal: 16,
      marginBottom: 14,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: BOARD_BG,
      borderWidth: 1.5,
      borderColor: BOARD_BORDER,
    }}>
      {/* Header strip */}
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
              <Feather name="trash-2" size={13} color="#4a7c59" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Body */}
      <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
        {/* Opponent */}
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: AMBER, marginBottom: 4 }}>
          vs {fixture.opponent}
        </Text>

        {/* Date + time row */}
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: GREEN_LIGHT, marginBottom: 6 }}>
          {formatDate(fixture.date)}{fixture.time ? ` · ${fixture.time}` : ""}
        </Text>

        {/* Meta row */}
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
    </View>
  );
}
