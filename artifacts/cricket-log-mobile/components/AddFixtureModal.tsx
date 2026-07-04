import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateFixture, getListFixturesQueryKey } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

const MATCH_TYPES = ["Club", "T20", "ODI", "Test", "Friendly", "Other"];

export function AddFixtureModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const qc = useQueryClient();
  const { mutateAsync: createFixture, isPending } = useCreateFixture();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [opponent, setOpponent] = useState("");
  const [venue, setVenue] = useState("");
  const [matchType, setMatchType] = useState("Club");
  const [playingFor, setPlayingFor] = useState("");
  const [series, setSeries] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setDate(""); setTime(""); setOpponent(""); setVenue("");
    setMatchType("Club"); setPlayingFor(""); setSeries(""); setNotes(""); setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!date.trim()) { setError("Date is required (YYYY-MM-DD)"); return; }
    if (!opponent.trim()) { setError("Opponent is required"); return; }
    setError("");
    try {
      await createFixture({
        date: date.trim(),
        time: time.trim() || undefined,
        opponent: opponent.trim(),
        venue: venue.trim() || undefined,
        matchType,
        playingFor: playingFor.trim() || undefined,
        series: series.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      await qc.invalidateQueries({ queryKey: getListFixturesQueryKey() });
      handleClose();
    } catch {
      setError("Failed to save fixture. Please try again.");
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular" as const,
    color: colors.foreground,
    backgroundColor: colors.card,
    marginBottom: 12,
  };

  const labelStyle = {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold" as const,
    color: colors.mutedForeground,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
    marginBottom: 4,
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
            borderBottomWidth: 1, borderBottomColor: colors.border,
          }}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={{ fontSize: 16, color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground }}>Add Fixture</Text>
            <TouchableOpacity onPress={handleSave} disabled={isPending}>
              {isPending
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={{ fontSize: 16, color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Save</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            {error ? (
              <View style={{ backgroundColor: "#fee2e2", borderRadius: 8, padding: 10, marginBottom: 12 }}>
                <Text style={{ color: "#dc2626", fontFamily: "Inter_500Medium", fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            <Text style={labelStyle}>Date *</Text>
            <TextInput
              style={inputStyle} value={date} onChangeText={setDate}
              placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />

            <Text style={labelStyle}>Time (optional)</Text>
            <TextInput
              style={inputStyle} value={time} onChangeText={setTime}
              placeholder="e.g. 14:00" placeholderTextColor={colors.mutedForeground}
            />

            <Text style={labelStyle}>Opponent *</Text>
            <TextInput
              style={inputStyle} value={opponent} onChangeText={setOpponent}
              placeholder="e.g. Riverside CC" placeholderTextColor={colors.mutedForeground}
            />

            <Text style={labelStyle}>Venue</Text>
            <TextInput
              style={inputStyle} value={venue} onChangeText={setVenue}
              placeholder="e.g. Home ground" placeholderTextColor={colors.mutedForeground}
            />

            <Text style={labelStyle}>Match Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {MATCH_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setMatchType(t)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                      backgroundColor: matchType === t ? colors.primary : "transparent",
                      borderWidth: 1.5, borderColor: matchType === t ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{
                      fontFamily: "Inter_600SemiBold", fontSize: 13,
                      color: matchType === t ? colors.primaryForeground : colors.foreground,
                    }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={labelStyle}>Playing For</Text>
            <TextInput
              style={inputStyle} value={playingFor} onChangeText={setPlayingFor}
              placeholder="e.g. First XI" placeholderTextColor={colors.mutedForeground}
            />

            <Text style={labelStyle}>Series / Tournament</Text>
            <TextInput
              style={inputStyle} value={series} onChangeText={setSeries}
              placeholder="e.g. County League 2026" placeholderTextColor={colors.mutedForeground}
            />

            <Text style={labelStyle}>Notes</Text>
            <TextInput
              style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
              value={notes} onChangeText={setNotes}
              placeholder="Any pre-match notes…" placeholderTextColor={colors.mutedForeground}
              multiline
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
