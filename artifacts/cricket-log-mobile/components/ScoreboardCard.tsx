import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SplitFlapDisplay } from "./SplitFlapDisplay";

const BOARD_BG    = "#0c1a0e";
const BOARD_STRIP = "#0f2014";
const BOARD_BORDER = "#1a3320";
const BOARD_DIVIDER = "#1a3320";
const LABEL_COLOR  = "#4a7c59";
const AMBER        = "#f59e0b";
const TILE_BG      = "#0f2014";
const TILE_BORDER  = "rgba(245,158,11,0.45)";

type SeasonDef = { label: string; startDate: string; endDate: string };

export function ScoreboardCard({
  seasonLabel,
  availableSeasons,
  selectedSeasonIdx,
  onSeasonChange,
  runsFlap,
  wicketsFlap,
  catchesFlap,
  matchesFlap,
  battingAvg,
  nextRunTarget,
  runsDelta,
  prevSeasonLabel,
}: {
  seasonLabel: string;
  availableSeasons: SeasonDef[];
  selectedSeasonIdx: number;
  onSeasonChange: (idx: number) => void;
  runsFlap: number;
  wicketsFlap: number;
  catchesFlap: number;
  matchesFlap: number;
  battingAvg: string;
  nextRunTarget: number;
  runsDelta: number | null;
  prevSeasonLabel?: string;
}) {
  const runsStr = String(runsFlap);
  const seasonTarget = runsFlap <= 500 ? 500 : runsFlap <= 1000 ? 1000 : runsFlap <= 2000 ? 2000 : 5000;
  const pct = Math.min(100, Math.round((runsFlap / seasonTarget) * 100));

  return (
    <View style={{
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: BOARD_BG,
      borderWidth: 1.5,
      borderColor: BOARD_BORDER,
    }}>
      {/* ── Header strip — season label + season pills ── */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: BOARD_STRIP,
        borderBottomWidth: 1,
        borderBottomColor: BOARD_BORDER,
      }}>
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, color: LABEL_COLOR, letterSpacing: 1.4, textTransform: "uppercase" }}>
          {seasonLabel} Season
        </Text>

        {availableSeasons.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 1, marginLeft: 8 }} contentContainerStyle={{ gap: 6, flexDirection: "row" }}>
            {availableSeasons.slice(0, 5).map((s, i) => (
              <TouchableOpacity
                key={s.label}
                onPress={() => onSeasonChange(i)}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  backgroundColor: i === selectedSeasonIdx ? "#1a4a28" : "transparent",
                }}
              >
                <Text style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 10,
                  color: i === selectedSeasonIdx ? "#6ee7b7" : BOARD_BORDER,
                }}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── Main runs block ── */}
      <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 9, color: LABEL_COLOR, letterSpacing: 1.8, textTransform: "uppercase", width: 40, marginRight: 8 }}>
            RUNS
          </Text>
          <SplitFlapDisplay
            value={runsFlap}
            minDigits={runsStr.length < 3 ? 3 : runsStr.length}
            size="lg"
            tileColor={TILE_BG}
            inkColor={AMBER}
            borderColor={TILE_BORDER}
          />
          {runsDelta !== null && (
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 10, marginLeft: 10, color: runsDelta >= 0 ? "#6ee7b7" : "#f87171" }}>
              {runsDelta >= 0 ? "+" : ""}{runsDelta}{prevSeasonLabel ? ` vs ${prevSeasonLabel}` : ""}
            </Text>
          )}
        </View>

        {/* ── Divider ── */}
        <View style={{ height: 1, backgroundColor: BOARD_DIVIDER, marginVertical: 10 }} />

        {/* ── Secondary stats ── */}
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 14 }}>
          {/* Wickets */}
          <View style={{ alignItems: "flex-start", gap: 5 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 8, color: LABEL_COLOR, letterSpacing: 1.6, textTransform: "uppercase" }}>WKTS</Text>
            <SplitFlapDisplay value={wicketsFlap} minDigits={2} size="sm" tileColor={TILE_BG} inkColor={AMBER} borderColor={TILE_BORDER} />
          </View>

          {/* Catches */}
          <View style={{ alignItems: "flex-start", gap: 5 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 8, color: LABEL_COLOR, letterSpacing: 1.6, textTransform: "uppercase" }}>CTCH</Text>
            <SplitFlapDisplay value={catchesFlap} minDigits={2} size="sm" tileColor={TILE_BG} inkColor={AMBER} borderColor={TILE_BORDER} />
          </View>

          {/* Matches */}
          <View style={{ alignItems: "flex-start", gap: 5 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 8, color: LABEL_COLOR, letterSpacing: 1.6, textTransform: "uppercase" }}>MTCH</Text>
            <SplitFlapDisplay value={matchesFlap} minDigits={2} size="sm" tileColor={TILE_BG} inkColor={AMBER} borderColor={TILE_BORDER} />
          </View>

          {/* Average — text only (has decimal) */}
          <View style={{ alignItems: "flex-start", gap: 5, marginLeft: "auto" as any }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 8, color: LABEL_COLOR, letterSpacing: 1.6, textTransform: "uppercase" }}>AVG</Text>
            <View style={{
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
              backgroundColor: TILE_BG, borderWidth: 1, borderColor: TILE_BORDER,
            }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: AMBER }}>{battingAvg}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Season progress bar (only when runs exist) ── */}
      {runsFlap > 0 && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1, height: 3, borderRadius: 2, overflow: "hidden", backgroundColor: BOARD_BORDER }}>
            <View style={{ height: 3, width: `${pct}%`, borderRadius: 2, backgroundColor: AMBER }} />
          </View>
          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 9, color: LABEL_COLOR }}>
            {runsFlap}/{seasonTarget} runs
          </Text>
        </View>
      )}
    </View>
  );
}
