import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppearance } from "@/contexts/AppearanceContext";
import { useColors } from "@/hooks/useColors";
import { DEFAULT_LABELS, useTabLabels, type TabKey } from "@/hooks/useTabLabels";
import { usePlayerName } from "@/hooks/usePlayerName";

const TAB_DEFS: { key: TabKey; icon: string; hint: string }[] = [
  { key: "index",        icon: "bar-chart-2", hint: "Main stats overview" },
  { key: "matches",      icon: "list",        hint: "Match history list" },
  { key: "achievements", icon: "award",       hint: "Badges & milestones" },
  { key: "coaching",     icon: "book-open",   hint: "Coaching tips & notes" },
  { key: "media",        icon: "image",       hint: "Photos, videos & cuttings" },
  { key: "log",          icon: "plus-circle", hint: "Log a new match" },
];

export default function SettingsModal() {
  const colors = useColors();
  const { override, setOverride } = useAppearance();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { labels, updateLabel, resetLabels } = useTabLabels();
  const { playerName, saveName } = usePlayerName();

  const [draftName, setDraftName] = useState(playerName);
  const [draft, setDraft] = useState({ ...labels });

  useEffect(() => {
    setDraftName(playerName);
  }, [playerName]);

  useEffect(() => {
    setDraft({ ...labels });
  }, [labels]);

  const handleSave = async () => {
    await saveName(draftName);
    for (const { key } of TAB_DEFS) {
      await updateLabel(key, draft[key]);
    }
    router.back();
  };

  const handleReset = () => {
    Alert.alert("Reset Labels", "Restore all tab names to their defaults?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        onPress: async () => {
          await resetLabels();
          setDraft({ ...DEFAULT_LABELS });
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.heading, { color: colors.foreground }]}>
          Appearance
        </Text>
        <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="moon" size={18} color={colors.primary} />
          </View>
          <View style={styles.rowBody}>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>Colour scheme</Text>
            <View style={styles.schemeRow}>
              {(["light", "system", "dark"] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.schemeBtn,
                    {
                      backgroundColor: override === opt ? colors.primary : colors.muted,
                      borderColor: override === opt ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setOverride(opt)}
                >
                  <Text
                    style={[
                      styles.schemeBtnText,
                      { color: override === opt ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {opt === "light" ? "Light" : opt === "dark" ? "Dark" : "Auto"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Profile
        </Text>
        <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="user" size={18} color={colors.primary} />
          </View>
          <View style={styles.rowBody}>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>Your name</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Cricketer"
              placeholderTextColor={colors.mutedForeground}
              maxLength={40}
              returnKeyType="done"
              autoCorrect={false}
            />
          </View>
        </View>

        <Text style={[styles.heading, { color: colors.foreground, marginTop: 8 }]}>
          Rename Tabs
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Customise the label shown under each tab icon.
        </Text>

        {TAB_DEFS.map(({ key, icon, hint }) => (
          <View
            key={key}
            style={[
              styles.row,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
              <Feather name={icon as any} size={18} color={colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                {hint}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                value={draft[key]}
                onChangeText={(v) => setDraft((d) => ({ ...d, [key]: v }))}
                placeholder={DEFAULT_LABELS[key]}
                placeholderTextColor={colors.mutedForeground}
                maxLength={20}
                returnKeyType="done"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>
            Reset to defaults
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  heading: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 8 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, gap: 6 },
  hint: { fontSize: 11, fontFamily: "Inter_400Regular" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },

  saveBtn: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  resetBtn: { alignItems: "center", paddingVertical: 12 },
  resetBtnText: { fontSize: 14, fontFamily: "Inter_400Regular" },

  schemeRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  schemeBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  schemeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
