import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppearance } from "@/contexts/AppearanceContext";
import { PALETTES, hslToHex, hexToHsl, type PaletteId, type PresetPaletteId } from "@/constants/colors";
import { useSeasonContext, CRICKET_COUNTRIES, type CricketCountry, type CricketRegion } from "@/contexts/SeasonContext";
import { useColors } from "@/hooks/useColors";
import { DEFAULT_LABELS, useTabLabels, type TabKey } from "@/hooks/useTabLabels";
import { usePlayerName } from "@/hooks/usePlayerName";
import { useLanguage } from "@/contexts/LanguageContext";
import { SUPPORTED_LOCALES, type LocaleCode } from "@/i18n";

const TAB_DEFS: { key: TabKey; icon: string; hint: string }[] = [
  { key: "index",        icon: "bar-chart-2", hint: "Main stats overview" },
  { key: "matches",      icon: "list",        hint: "Match history list" },
  { key: "achievements", icon: "award",       hint: "Badges & milestones" },
  { key: "coaching",     icon: "book-open",   hint: "Coaching tips & notes" },
  { key: "media",        icon: "image",       hint: "Photos, videos & cuttings" },
  { key: "log",          icon: "plus-circle", hint: "Log a new match" },
];

// ── Hue Wheel ────────────────────────────────────────────────────────────────
const WHEEL_SIZE = 220;
const OUTER_R = 100;
const INNER_R = 70;
const CENTER_XY = WHEEL_SIZE / 2;
const SEGMENTS = 60;

function polarToXY(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER_XY + radius * Math.cos(rad),
    y: CENTER_XY + radius * Math.sin(rad),
  };
}

function arcPath(startDeg: number, endDeg: number): string {
  const o0 = polarToXY(startDeg, OUTER_R);
  const o1 = polarToXY(endDeg, OUTER_R);
  const i0 = polarToXY(startDeg, INNER_R);
  const i1 = polarToXY(endDeg, INNER_R);
  return (
    `M ${o0.x.toFixed(2)} ${o0.y.toFixed(2)} ` +
    `A ${OUTER_R} ${OUTER_R} 0 0 1 ${o1.x.toFixed(2)} ${o1.y.toFixed(2)} ` +
    `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)} ` +
    `A ${INNER_R} ${INNER_R} 0 0 0 ${i0.x.toFixed(2)} ${i0.y.toFixed(2)} Z`
  );
}

function positionToHue(x: number, y: number): number {
  const dx = x - CENTER_XY;
  const dy = y - CENTER_XY;
  let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (deg < 0) deg += 360;
  if (deg >= 360) deg -= 360;
  return Math.round(deg);
}

const WHEEL_PATHS = Array.from({ length: SEGMENTS }, (_, i) => {
  const start = (i * 360) / SEGMENTS;
  const end = ((i + 1) * 360) / SEGMENTS;
  return { d: arcPath(start, end), fill: `hsl(${start}, 100%, 50%)` };
});

interface HueWheelProps {
  hue: number;
  onChange: (h: number) => void;
}

function HueWheel({ hue, onChange }: HueWheelProps) {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        onChange(positionToHue(locationX, locationY));
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        onChange(positionToHue(locationX, locationY));
      },
    })
  ).current;

  const thumbR = (OUTER_R + INNER_R) / 2;
  const thumb = polarToXY(hue, thumbR);
  const thumbColour = hslToHex(hue, 100, 50);

  return (
    <View style={{ width: WHEEL_SIZE, height: WHEEL_SIZE, alignSelf: "center" }}>
      <Svg
        width={WHEEL_SIZE}
        height={WHEEL_SIZE}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        {WHEEL_PATHS.map((seg, i) => (
          <Path key={i} d={seg.d} fill={seg.fill} />
        ))}
        <Circle
          cx={thumb.x}
          cy={thumb.y}
          r={13}
          fill={thumbColour}
          stroke="white"
          strokeWidth={3}
        />
        <Circle
          cx={CENTER_XY}
          cy={CENTER_XY}
          r={INNER_R - 6}
          fill={thumbColour}
          opacity={0.15}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />
    </View>
  );
}

// ── Settings Modal ────────────────────────────────────────────────────────────

export default function SettingsModal() {
  const colors = useColors();
  const { override, setOverride, palette, setPalette, customHue, setCustomHue } = useAppearance();
  const { country, setCountry, region, setSeasonFormat } = useSeasonContext();
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { labels, updateLabel, resetLabels } = useTabLabels();
  const { playerName, saveName } = usePlayerName();
  const { locale, setLocale } = useLanguage();

  const [draftName, setDraftName] = useState(playerName);
  const [draft, setDraft] = useState({ ...labels });

  useEffect(() => { setDraftName(playerName); }, [playerName]);
  useEffect(() => { setDraft({ ...labels }); }, [labels]);

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

  // ── Hue wheel state ──
  const effectiveHue =
    palette === "custom"
      ? customHue
      : hexToHsl(PALETTES[palette as PresetPaletteId].swatch)[0];

  const handleWheelChange = (h: number) => {
    setCustomHue(h);
    setPalette("custom");
  };

  const previewHex = hslToHex(effectiveHue, 55, 30);
  const paletteName =
    palette === "custom"
      ? `Custom  ${previewHex.toUpperCase()}`
      : PALETTES[palette as PresetPaletteId].label;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.pavilion }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="chevron-left" size={24} color={colors.pavilionForeground} />
          <Text style={[styles.backLabel, { color: colors.pavilionForeground }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.pavilionForeground }]}>Settings</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.heading, { color: colors.foreground }]}>Appearance</Text>

        {/* Colour scheme */}
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
                  <Text style={[styles.schemeBtnText, { color: override === opt ? colors.primaryForeground : colors.mutedForeground }]}>
                    {opt === "light" ? "Light" : opt === "dark" ? "Dark" : "Auto"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Colour wheel */}
        <View style={[styles.wheelCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.wheelCardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
              <Feather name="droplet" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>Accent colour</Text>
              <View style={styles.colourLabelRow}>
                <View style={[styles.colourDot, { backgroundColor: previewHex }]} />
                <Text style={[styles.paletteName, { color: colors.foreground }]}>{paletteName}</Text>
              </View>
            </View>
          </View>

          <HueWheel hue={effectiveHue} onChange={handleWheelChange} />

          {/* Preset quick-picks */}
          <Text style={[styles.quickPicksLabel, { color: colors.mutedForeground }]}>Quick picks</Text>
          <View style={styles.swatchRow}>
            {(Object.entries(PALETTES) as [PresetPaletteId, (typeof PALETTES)[PresetPaletteId]][]).map(([id, pal]) => {
              const active = palette === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => setPalette(id)}
                  style={[
                    styles.swatchWrap,
                    active && { borderColor: pal.swatch, borderWidth: 2.5 },
                    !active && { borderColor: colors.border, borderWidth: 1.5 },
                  ]}
                  activeOpacity={0.75}
                >
                  <View style={[styles.swatch, { backgroundColor: pal.swatch }]} />
                  {active && (
                    <View style={styles.swatchCheck}>
                      <Feather name="check" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Season */}
        <Text style={[styles.heading, { color: colors.foreground }]}>Season</Text>
        <TouchableOpacity
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setCountryPickerOpen(true)}
          activeOpacity={0.75}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="globe" size={18} color={colors.primary} />
          </View>
          <View style={[styles.rowBody, { flexDirection: "row", alignItems: "center" }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>Country</Text>
              <Text style={[styles.countryValue, { color: colors.foreground }]}>
                {country.flag}  {country.name}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>

        <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="calendar" size={18} color={colors.primary} />
          </View>
          <View style={styles.rowBody}>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>Season format</Text>
            <View style={styles.schemeRow}>
              {([
                { key: "england",      label: "Calendar year", eg: "e.g. 2026" },
                { key: "subcontinent", label: "Split year",     eg: "e.g. 2025/26" },
              ] as { key: CricketRegion; label: string; eg: string }[]).map(({ key, label, eg }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.schemeBtn,
                    {
                      backgroundColor: region === key ? colors.primary : colors.muted,
                      borderColor: region === key ? colors.primary : colors.border,
                      flex: 1,
                    },
                  ]}
                  onPress={() => setSeasonFormat(key)}
                >
                  <Text style={[styles.schemeBtnText, { color: region === key ? colors.primaryForeground : colors.mutedForeground }]}>
                    {label}
                  </Text>
                  <Text style={{ fontSize: 10, color: region === key ? colors.primaryForeground + "CC" : colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                    {eg}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Country picker modal */}
        <Modal
          visible={countryPickerOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setCountryPickerOpen(false)}
        >
          <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border, backgroundColor: colors.pavilion }]}>
              <Text style={[styles.pickerTitle, { color: colors.pavilionForeground }]}>Choose Country</Text>
              <TouchableOpacity onPress={() => setCountryPickerOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={22} color={colors.pavilionForeground} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CRICKET_COUNTRIES}
              keyExtractor={(item) => item.code}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => {
                const active = item.code === country.code;
                return (
                  <TouchableOpacity
                    style={[
                      styles.countryRow,
                      { borderBottomColor: colors.border },
                      active && { backgroundColor: colors.primary + "12" },
                    ]}
                    onPress={() => { setCountry(item); setCountryPickerOpen(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.countryName, { color: active ? colors.primary : colors.foreground }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.countryRegionLabel, { color: colors.mutedForeground }]}>
                        {item.region === "england" ? "Calendar year" : "Split-year"}
                      </Text>
                    </View>
                    {active && <Feather name="check" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Modal>

        {/* Language */}
        <Text style={[styles.heading, { color: colors.foreground }]}>Language</Text>
        <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border, flexWrap: "wrap" }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="globe" size={18} color={colors.primary} />
          </View>
          <View style={[styles.rowBody, { flexDirection: "row", flexWrap: "wrap", gap: 8 }]}>
            {SUPPORTED_LOCALES.map((loc) => (
              <TouchableOpacity
                key={loc.code}
                style={[
                  styles.schemeBtn,
                  {
                    backgroundColor: locale === loc.code ? colors.primary : colors.muted,
                    borderColor: locale === loc.code ? colors.primary : colors.border,
                    paddingHorizontal: 10,
                  },
                ]}
                onPress={() => setLocale(loc.code as LocaleCode)}
              >
                <Text style={[styles.schemeBtnText, { color: locale === loc.code ? colors.primaryForeground : colors.mutedForeground }]}>
                  {loc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Profile */}
        <Text style={[styles.heading, { color: colors.foreground }]}>Profile</Text>
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

        {/* Rename Tabs */}
        <Text style={[styles.heading, { color: colors.foreground, marginTop: 8 }]}>Rename Tabs</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Customise the label shown under each tab icon.
        </Text>

        {TAB_DEFS.map(({ key, icon, hint }) => (
          <View key={key} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
              <Feather name={icon as any} size={18} color={colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>{hint}</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
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

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>Reset to defaults</Text>
        </TouchableOpacity>

        {/* Legal */}
        <Text style={[styles.heading, { color: colors.foreground, marginTop: 8 }]}>Legal</Text>

        <TouchableOpacity
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => Linking.openURL("https://cricvault.app/privacy")}
          activeOpacity={0.75}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="shield" size={18} color={colors.primary} />
          </View>
          <View style={[styles.rowBody, { flexDirection: "row", alignItems: "center" }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>Legal</Text>
              <Text style={[styles.countryValue, { color: colors.foreground }]}>Privacy Policy</Text>
            </View>
            <Feather name="external-link" size={16} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>

        <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="info" size={18} color={colors.primary} />
          </View>
          <View style={styles.rowBody}>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>App</Text>
            <Text style={[styles.countryValue, { color: colors.foreground }]}>CricVault</Text>
            <Text style={[styles.hint, { color: colors.mutedForeground, marginTop: 2 }]}>
              Your personal cricket statistics tracker
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, minWidth: 70 },
  backLabel: { fontSize: 16, fontFamily: "Inter_500Medium" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },

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

  wheelCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    alignItems: "stretch",
  },
  wheelCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  colourLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  colourDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  paletteName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  quickPicksLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  swatchRow: { flexDirection: "row", gap: 10 },
  swatchWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  swatch: { width: 32, height: 32, borderRadius: 16 },
  swatchCheck: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  saveBtn: { marginTop: 8, borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  resetBtn: { alignItems: "center", paddingVertical: 12 },
  resetBtnText: { fontSize: 14, fontFamily: "Inter_400Regular" },

  countryValue: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  pickerModal: { flex: 1 },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  pickerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countryFlag: { fontSize: 26, width: 36, textAlign: "center" },
  countryName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  countryRegionLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
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
