import {
  useCreateMatch,
  useCreateBattingStats,
  useCreateBowlingStats,
  useCreateFieldingStats,
  useAddMatchPhoto,
  useAddMatchVideo,
  useCreateMatchReport,
  useListMatchPhotos,
  useListMatchVideos,
  getListMatchesQueryKey,
  getGetPerMatchStatsQueryKey,
  getGetStatsSummaryQueryKey,
  getListMatchPhotosQueryKey,
  getListMatchVideosQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CricketBallSvg, CatchingHandsSvg } from "@/components/CricketIcons";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useT";
import { computeBadges, type PerMatchStat } from "@/utils/computeBadges";
import { WagonWheel, type WheelShot } from "@/components/WagonWheel";
import { DatePickerCalendar } from "@/components/DatePickerCalendar";

// ── Types ─────────────────────────────────────────────────────────────────────

type MatchForm = {
  date: string;
  opponent: string;
  venue: string;
  matchType: string;
  playingFor: string;
  result: string;
  playerOfTheMatch: boolean;
  notes: string;
  series: string;
  isPractice: boolean;
  pitchType: string;
  weatherConditions: string;
};

type BattingForm = {
  runs: string;
  ballsFaced: string;
  fours: string;
  sixes: string;
  battingPosition: string;
  howOut: string;
  badUmpireDecision: boolean;
  ballsToFifty: string;
  ballsToHundred: string;
  ballsToHundredFifty: string;
  oppositionBowler: string;
  caughtPosition: string;
};

type BowlingForm = {
  overs: string;
  maidens: string;
  runsConceded: string;
  wickets: string;
  noBalls: string;
  wides: string;
  hatTrick: boolean;
  bowledWickets: string;
  lbwWickets: string;
  wouldHaveReferred: boolean;
};

type FieldingForm = {
  catches: string;
  droppedCatches: string;
  runOuts: string;
  stumpings: string;
  missedStumpings: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const CAUGHT_POSITIONS = [
  "Slip", "2nd Slip", "3rd Slip", "Gully", "Point", "Cover", "Mid-off",
  "Mid-on", "Mid-wicket", "Square Leg", "Fine Leg", "Third Man",
  "Long-on", "Long-off", "Deep Cover", "Wicket Keeper",
];

const MATCH_TYPES = [
  "League", "Cup", "Friendly", "County", "Country",
  "T20", "ODI", "Test", "The Hundred", "Tournament",
  "Practice", "School", "Social", "Back Garden", "Other",
];
const PITCH_TYPES = ["Flat", "Good", "Uneven", "Slow", "Fast", "Wet", "Dusty"];
const WEATHER_OPTIONS = ["Sunny", "Overcast", "Humid", "Windy", "Hot", "Cold", "Drizzle"];

const HOW_OUT_OPTIONS = [
  "Not Out",
  "Caught",
  "Bowled",
  "LBW",
  "Run Out",
  "Stumped",
  "Hit Wicket",
  "Hit the Ball Twice",
  "Handled Ball",
  "Obstructing the Field",
  "Timed Out",
  "Retired",
];

function isoToDisplay(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}
function displayToIso(display: string) {
  const m = display.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : display;
}

const defaultMatch: MatchForm = {
  date: new Date().toISOString().split("T")[0],
  opponent: "",
  venue: "",
  matchType: "",
  playingFor: "",
  result: "",
  playerOfTheMatch: false,
  notes: "",
  series: "",
  isPractice: false,
  pitchType: "",
  weatherConditions: "",
};

const defaultBatting: BattingForm = {
  runs: "",
  ballsFaced: "",
  fours: "",
  sixes: "",
  battingPosition: "",
  howOut: "",
  badUmpireDecision: false,
  ballsToFifty: "",
  ballsToHundred: "",
  ballsToHundredFifty: "",
  oppositionBowler: "",
  caughtPosition: "",
};

const defaultBowling: BowlingForm = {
  overs: "",
  maidens: "",
  runsConceded: "",
  wickets: "",
  noBalls: "",
  wides: "",
  hatTrick: false,
  bowledWickets: "",
  lbwWickets: "",
  wouldHaveReferred: false,
};

const defaultFielding: FieldingForm = {
  catches: "",
  droppedCatches: "",
  runOuts: "",
  stumpings: "",
  missedStumpings: "",
};

// ── Shared UI components ──────────────────────────────────────────────────────

function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
}) {
  const colors = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      placeholderTextColor={colors.mutedForeground}
      style={[
        styles.input,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          color: colors.foreground,
          fontFamily: "Inter_400Regular",
        },
      ]}
    />
  );
}

function Field({
  label,
  children,
  half,
}: {
  label: string;
  children: React.ReactNode;
  half?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.field, half && { flex: 1 }]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function ToggleRow({
  label,
  value,
  onValueChange,
  sublabel,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  sublabel?: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.toggleRow, { borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
        {sublabel ? (
          <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>{sublabel}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

function ChipGroup({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.chipGroup}>
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.card,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onSelect(active ? "" : opt)}
          >
            <Text style={[styles.chipText, { color: active ? "#fff" : colors.foreground }]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SectionCard({
  icon,
  title,
  enabled,
  onToggle,
  children,
  alwaysOpen,
}: {
  icon: React.ReactNode;
  title: string;
  enabled: boolean;
  onToggle?: (v: boolean) => void;
  children: React.ReactNode;
  alwaysOpen?: boolean;
}) {
  const colors = useColors();
  const isOpen = alwaysOpen || enabled;

  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header row — fully tappable */}
      <TouchableOpacity
        style={styles.sectionCardHeader}
        onPress={() => onToggle && onToggle(!enabled)}
        activeOpacity={onToggle ? 0.65 : 1}
      >
        {typeof icon === "string"
          ? <Text style={styles.sectionIcon}>{icon}</Text>
          : <View style={styles.sectionIconWrap}>{icon}</View>}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        {onToggle && (
          <Switch
            value={enabled}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
            pointerEvents="none"
          />
        )}
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.sectionBody, { borderTopColor: colors.border }]}>
          {children}
        </View>
      )}
    </View>
  );
}

// ── Media Step (Step 2) ───────────────────────────────────────────────────────

async function uploadMobileFile(uri: string, contentType: string): Promise<string | null> {
  try {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const apiBase = domain ? `https://${domain}` : "";
    const filename = uri.split("/").pop() ?? "upload";
    const urlRes = await fetch(`${apiBase}/api/storage/uploads/request-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: filename, size: 0, contentType }),
    });
    if (!urlRes.ok) return null;
    const { uploadURL, objectPath } = await urlRes.json();
    const fileRes = await fetch(uri);
    const blob = await fileRes.blob();
    await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
    return objectPath as string;
  } catch {
    return null;
  }
}

function MediaStep({
  matchId,
  opponent,
  onDone,
}: {
  matchId: number;
  opponent: string;
  onDone: () => void;
}) {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [highlights, setHighlights] = useState("");
  const [savingHighlights, setSavingHighlights] = useState(false);
  const [highlightsSaved, setHighlightsSaved] = useState(false);

  const { data: photos } = useListMatchPhotos(matchId, {
    query: { queryKey: getListMatchPhotosQueryKey(matchId) },
  });
  const { data: videos } = useListMatchVideos(matchId, {
    query: { queryKey: getListMatchVideosQueryKey(matchId) },
  });
  const addPhoto = useAddMatchPhoto();
  const addVideo = useAddMatchVideo();
  const createReport = useCreateMatchReport();

  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const storageBase = domain ? `https://${domain}` : "";

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("log.permissionNeeded"), t("log.allowPhotoAccess"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      const contentType = asset.mimeType ?? "image/jpeg";
      const objectPath = await uploadMobileFile(asset.uri, contentType);
      if (!objectPath) throw new Error("Upload failed");
      addPhoto.mutate(
        { matchId, data: { url: `/api/storage${objectPath}` } },
        {
          onSuccess: () => qc.invalidateQueries({ queryKey: getListMatchPhotosQueryKey(matchId) }),
          onError: () => Alert.alert(t("common.error"), t("log.failedPhoto")),
        }
      );
    } catch {
      Alert.alert(t("common.error"), t("log.photoUploadFailed"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("log.permissionNeeded"), t("log.allowVideoAccess"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploadingVideo(true);
    try {
      const contentType = asset.mimeType ?? "video/mp4";
      const objectPath = await uploadMobileFile(asset.uri, contentType);
      if (!objectPath) throw new Error("Upload failed");
      addVideo.mutate(
        { matchId, data: { objectPath: `/api/storage${objectPath}` } },
        {
          onSuccess: () => qc.invalidateQueries({ queryKey: getListMatchVideosQueryKey(matchId) }),
          onError: () => Alert.alert(t("common.error"), t("log.failedVideo")),
        }
      );
    } catch {
      Alert.alert(t("common.error"), t("log.videoUploadFailed"));
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSaveHighlights = () => {
    if (!highlights.trim()) return;
    setSavingHighlights(true);
    createReport.mutate(
      { matchId, data: { highlightsUrl: highlights.trim() } as any },
      {
        onSuccess: () => { setSavingHighlights(false); setHighlightsSaved(true); },
        onError: () => { setSavingHighlights(false); Alert.alert(t("common.error"), t("log.failedLink")); },
      }
    );
  };

  const photoCount = photos?.length ?? 0;
  const videoCount = videos?.length ?? 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Step indicator */}
      <View style={mediaStyles.stepHeader}>
        <View style={mediaStyles.stepDots}>
          <View style={[mediaStyles.dot, { backgroundColor: colors.border }]} />
          <View style={[mediaStyles.dotLine, { backgroundColor: colors.border }]} />
          <View style={[mediaStyles.dot, { backgroundColor: colors.primary }]} />
        </View>
        <Text style={[mediaStyles.stepTitle, { color: colors.foreground }]}>{t("log.step2Title")}</Text>
        <Text style={[mediaStyles.stepSub, { color: colors.mutedForeground }]}>vs {opponent}</Text>
      </View>

      <View style={{ height: 16 }} />

      {/* Photos */}
      <View style={[mediaStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={mediaStyles.cardRow}>
          <Text style={[mediaStyles.cardTitle, { color: colors.foreground }]}>
            📷 {t("log.photos")}{photoCount > 0 ? ` (${photoCount})` : ""}
          </Text>
          <TouchableOpacity
            style={[mediaStyles.addBtn, { backgroundColor: colors.primary }]}
            onPress={handlePickPhoto}
            disabled={uploadingPhoto}
          >
            <Text style={mediaStyles.addBtnText}>{uploadingPhoto ? t("common.uploading") : t("log.addBtn")}</Text>
          </TouchableOpacity>
        </View>
        {photoCount > 0 ? (
          <View style={mediaStyles.photoGrid}>
            {photos!.map((photo) => (
              <Image
                key={photo.id}
                source={{ uri: photo.url.startsWith("http") ? photo.url : `${storageBase}${photo.url}` }}
                style={mediaStyles.photoThumb}
              />
            ))}
          </View>
        ) : (
          <TouchableOpacity
            style={[mediaStyles.dropZone, { borderColor: colors.border }]}
            onPress={handlePickPhoto}
            disabled={uploadingPhoto}
          >
            <Text style={{ fontSize: 28 }}>📷</Text>
            <Text style={[mediaStyles.dropText, { color: colors.mutedForeground }]}>
              {uploadingPhoto ? t("common.uploading") : t("log.tapAddPhotos")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 12 }} />

      {/* Videos */}
      <View style={[mediaStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={mediaStyles.cardRow}>
          <Text style={[mediaStyles.cardTitle, { color: colors.foreground }]}>
            🎬 {t("log.videos")}{videoCount > 0 ? ` (${videoCount})` : ""}
          </Text>
          <TouchableOpacity
            style={[mediaStyles.addBtn, { backgroundColor: colors.primary }]}
            onPress={handlePickVideo}
            disabled={uploadingVideo}
          >
            <Text style={mediaStyles.addBtnText}>{uploadingVideo ? t("common.uploading") : t("log.addBtn")}</Text>
          </TouchableOpacity>
        </View>
        {videoCount > 0 ? (
          <View style={{ gap: 8, marginTop: 10 }}>
            {videos!.map((v, i) => (
              <View key={v.id} style={[mediaStyles.videoRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text style={{ fontSize: 16 }}>🎬</Text>
                <Text style={[mediaStyles.videoName, { color: colors.foreground }]}>{v.caption || `Video ${i + 1}`}</Text>
              </View>
            ))}
          </View>
        ) : (
          <TouchableOpacity
            style={[mediaStyles.dropZone, { borderColor: colors.border }]}
            onPress={handlePickVideo}
            disabled={uploadingVideo}
          >
            <Text style={{ fontSize: 28 }}>🎬</Text>
            <Text style={[mediaStyles.dropText, { color: colors.mutedForeground }]}>
              {uploadingVideo ? t("common.uploading") : t("log.tapAddVideos")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 12 }} />

      {/* Highlights URL */}
      <View style={[mediaStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[mediaStyles.cardTitle, { color: colors.foreground }]}>
          🔗 {t("log.highlightsLink")}{highlightsSaved ? " ✓" : ""}
        </Text>
        {highlightsSaved ? (
          <Text style={[mediaStyles.savedText, { color: colors.primary }]}>{t("log.linkSaved")}</Text>
        ) : (
          <View style={{ gap: 8, marginTop: 10 }}>
            <TextInput
              style={[mediaStyles.hlInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="https://www.youtube.com/watch?v=..."
              placeholderTextColor={colors.mutedForeground}
              value={highlights}
              onChangeText={setHighlights}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[mediaStyles.saveHlBtn, { backgroundColor: colors.primary, opacity: (!highlights.trim() || savingHighlights) ? 0.5 : 1 }]}
              onPress={handleSaveHighlights}
              disabled={!highlights.trim() || savingHighlights}
            >
              <Text style={mediaStyles.saveHlBtnText}>{savingHighlights ? t("common.saving") : t("log.saveLink")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ height: 20 }} />

      {/* Done */}
      <TouchableOpacity
        style={[mediaStyles.doneBtn, { backgroundColor: colors.primary }]}
        onPress={onDone}
      >
        <Text style={mediaStyles.doneBtnText}>{t("log.donePreviews")}</Text>
      </TouchableOpacity>
      <Text style={[mediaStyles.skipText, { color: colors.mutedForeground }]}>
        {t("log.mediaLaterHint")}
      </Text>
    </ScrollView>
  );
}

const mediaStyles = StyleSheet.create({
  stepHeader: { alignItems: "center", paddingBottom: 4 },
  stepDots: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotLine: { width: 32, height: 2, borderRadius: 1 },
  stepTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  stepSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },

  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  addBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  addBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },

  dropZone: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  dropText: { fontSize: 13, fontFamily: "Inter_400Regular" },

  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  photoThumb: { width: 80, height: 80, borderRadius: 8 },

  videoRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 8, borderWidth: 1 },
  videoName: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },

  hlInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  saveHlBtn: { borderRadius: 8, paddingVertical: 11, alignItems: "center" },
  saveHlBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  savedText: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 6 },

  doneBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  doneBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  skipText: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 10 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function LogMatchScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [popupBadges, setPopupBadges] = useState<{ id: string; icon: string; label: string; imageKey?: string }[]>([]);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Ref so PanResponder (created once) can call the latest dismiss fn
  const dismissRef = useRef<(() => void) | null>(null);

  const dismissPopup = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -160, duration: 280, useNativeDriver: true }),
    ]).start(() => {
      setPopupBadges([]);
      // Stay on step 2 — the Done button handles navigation
    });
  }, [fadeAnim, slideAnim]);

  useEffect(() => { dismissRef.current = dismissPopup; }, [dismissPopup]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 4,
      onPanResponderMove: (_, gs) => {
        if (gs.dy < 0) slideAnim.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy < -50 || gs.vy < -0.6) {
          dismissRef.current?.();
        } else {
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const [matchForm, setMatchForm] = useState<MatchForm>(defaultMatch);
  const [battingForm, setBattingForm] = useState<BattingForm>(defaultBatting);
  const [wheelShots, setWheelShots] = useState<WheelShot[]>([]);
  const [bowlingForm, setBowlingForm] = useState<BowlingForm>(defaultBowling);
  const [fieldingForm, setFieldingForm] = useState<FieldingForm>(defaultFielding);
  const [customDismissals, setCustomDismissals] = useState<string[]>([]);
  const [customHowOutInput, setCustomHowOutInput] = useState("");

  const [hasBatting, setHasBatting] = useState(true);
  const [hasBowling, setHasBowling] = useState(false);
  const [hasFielding, setHasFielding] = useState(false);
  const [isWicketKeeper, setIsWicketKeeper] = useState(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [createdMatchId, setCreatedMatchId] = useState<number | null>(null);
  const [savedOpponent, setSavedOpponent] = useState("");

  const { mutateAsync: createMatch, isPending } = useCreateMatch();
  const { mutateAsync: createBattingStats } = useCreateBattingStats();
  const { mutateAsync: createBowlingStats } = useCreateBowlingStats();
  const { mutateAsync: createFieldingStats } = useCreateFieldingStats();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const updateMatch   = (k: keyof MatchForm,   v: string | boolean) => setMatchForm(p => ({ ...p, [k]: v }));
  const updateBatting = (k: keyof BattingForm, v: string | boolean) => setBattingForm(p => ({ ...p, [k]: v }));
  const updateBowling = (k: keyof BowlingForm, v: string | boolean) => setBowlingForm(p => ({ ...p, [k]: v }));
  const updateFielding= (k: keyof FieldingForm,v: string)           => setFieldingForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!matchForm.opponent.trim()) {
      Alert.alert(t("log.required"), t("log.enterOpponent"));
      return;
    }

    // Duplicate detection — same date + opponent (case-insensitive) already saved
    const cachedMatches = (queryClient.getQueryData(getListMatchesQueryKey()) ?? []) as Array<{ date: string; opponent: string }>;
    const duplicate = cachedMatches.find(
      (m) =>
        m.date === matchForm.date &&
        m.opponent.trim().toLowerCase() === matchForm.opponent.trim().toLowerCase(),
    );

    if (duplicate) {
      Alert.alert(
        t("log.alreadySavedTitle"),
        t("log.alreadySavedMsg", { opponent: duplicate.opponent, date: duplicate.date }),
        [{ text: t("common.ok"), style: "default" }],
      );
      return;
    }

    void doSave();
  };

  const doSave = async () => {
    try {
      // Snapshot badges earned before this match so we can diff afterwards
      const prevData = (queryClient.getQueryData(getGetPerMatchStatsQueryKey()) ?? []) as PerMatchStat[];
      const prevEarned = new Set(computeBadges(prevData).filter((b) => b.earned).map((b) => b.id));

      const match = await createMatch({
        data: {
          date: matchForm.date,
          opponent: matchForm.opponent,
          venue: matchForm.venue || undefined,
          matchType: matchForm.matchType,
          playingFor: matchForm.playingFor || undefined,
          result: matchForm.result || undefined,
          playerOfTheMatch: matchForm.playerOfTheMatch,
          notes: matchForm.notes || undefined,
          series: matchForm.series || undefined,
          isPractice: matchForm.isPractice,
          pitchType: matchForm.pitchType || undefined,
          weatherConditions: matchForm.weatherConditions || undefined,
        },
      });

      const matchId = match.id;
      const promises: Promise<unknown>[] = [];

      if (hasBatting && battingForm.runs !== "") {
        promises.push(
          createBattingStats({
            matchId,
            data: {
              runs: Number(battingForm.runs) || 0,
              ballsFaced: Number(battingForm.ballsFaced) || 0,
              fours: Number(battingForm.fours) || 0,
              sixes: Number(battingForm.sixes) || 0,
              battingPosition: battingForm.battingPosition ? Number(battingForm.battingPosition) : undefined,
              howOut: battingForm.howOut || undefined,
              badUmpireDecision: battingForm.badUmpireDecision,
              ballsToFifty: battingForm.ballsToFifty ? Number(battingForm.ballsToFifty) : undefined,
              ballsToHundred: battingForm.ballsToHundred ? Number(battingForm.ballsToHundred) : undefined,
              ballsToHundredFifty: battingForm.ballsToHundredFifty ? Number(battingForm.ballsToHundredFifty) : undefined,
              oppositionBowler: battingForm.oppositionBowler || undefined,
              caughtPosition: battingForm.caughtPosition || undefined,
              shotData: wheelShots.length > 0 ? JSON.stringify(wheelShots) : undefined,
            },
          })
        );
      }

      if (hasBowling && bowlingForm.overs !== "") {
        promises.push(
          createBowlingStats({
            matchId,
            data: {
              overs: Number(bowlingForm.overs) || 0,
              maidens: Number(bowlingForm.maidens) || 0,
              runsConceded: Number(bowlingForm.runsConceded) || 0,
              wickets: Number(bowlingForm.wickets) || 0,
              noBalls: Number(bowlingForm.noBalls) || 0,
              wides: Number(bowlingForm.wides) || 0,
              hatTrick: bowlingForm.hatTrick,
              bowledWickets: Number(bowlingForm.bowledWickets) || 0,
              lbwWickets: Number(bowlingForm.lbwWickets) || 0,
              wouldHaveReferred: bowlingForm.wouldHaveReferred,
            },
          })
        );
      }

      if (hasFielding) {
        promises.push(
          createFieldingStats({
            matchId,
            data: {
              catches: Number(fieldingForm.catches) || 0,
              droppedCatches: Number(fieldingForm.droppedCatches) || 0,
              runOuts: Number(fieldingForm.runOuts) || 0,
              stumpings: Number(fieldingForm.stumpings) || 0,
              missedStumpings: Number(fieldingForm.missedStumpings) || 0,
            },
          })
        );
      }

      await Promise.all(promises);

      // Refetch all queries and compute newly earned badges
      await Promise.all([
        queryClient.refetchQueries({ queryKey: getGetPerMatchStatsQueryKey() }),
        queryClient.refetchQueries({ queryKey: getListMatchesQueryKey() }),
        queryClient.refetchQueries({ queryKey: getGetStatsSummaryQueryKey() }),
      ]);

      const freshData = (queryClient.getQueryData(getGetPerMatchStatsQueryKey()) ?? []) as PerMatchStat[];

      // Career badges earned for the first time this match
      const gained = computeBadges(freshData).filter((b) => b.earned && !b.isNegative && !prevEarned.has(b.id));

      // Per-match milestone celebrations — fire every time the event occurs
      type PopupBadge = { id: string; icon: string; label: string; imageKey?: string };
      const matchEvents: PopupBadge[] = [];

      if (hasBatting && battingForm.runs !== "") {
        const runs  = Number(battingForm.runs) || 0;
        const balls = Number(battingForm.ballsFaced) || 0;
        const sixes = Number(battingForm.sixes) || 0;
        const fours = Number(battingForm.fours) || 0;

        if (runs >= 150)      matchEvents.push({ id: "first150",    icon: "💎", label: "150 Club" });
        else if (runs >= 100) matchEvents.push({ id: "first100",    icon: "💯", label: "Century", imageKey: "century" });
        else if (runs >= 50)  matchEvents.push({ id: "first50",     icon: "🏏", label: "Half-Century" });

        if (runs >= 50 && balls > 0 && balls < 20)
          matchEvents.push({ id: "pinchHitter", icon: "⚡", label: "Pinch Hitter", imageKey: "pinch-hitter" });
        if (sixes >= 5)  matchEvents.push({ id: "bighitter", icon: "💥", label: "Big Hitter" });
        if (fours >= 10) matchEvents.push({ id: "boundary",  icon: "🏅", label: "Boundary Getter" });
      }

      if (hasBowling && bowlingForm.overs !== "") {
        const wickets = Number(bowlingForm.wickets) || 0;
        if (wickets >= 5)      matchEvents.push({ id: "fivewkt",  icon: "🔥", label: "Five-For" });
        if (bowlingForm.hatTrick) matchEvents.push({ id: "magician", icon: "🪄", label: "Magician" });
      }

      if (matchForm.playerOfTheMatch)
        matchEvents.push({ id: "potm", icon: "⭐", label: "Player of the Match" });

      if (hasFielding) {
        const catches = Number(fieldingForm.catches) || 0;
        if (catches >= 3) matchEvents.push({ id: "buckethands", icon: "🧤", label: "Bucket Hands" });
      }

      // Merge: career first-earns take priority, then per-match events (deduplicated)
      const gainedIds = new Set(gained.map((b) => b.id));
      const allCelebrations: PopupBadge[] = [
        ...gained.map((b) => ({ id: b.id, icon: b.icon, label: b.label, imageKey: b.imageKey })),
        ...matchEvents.filter((e) => !gainedIds.has(e.id)),
      ];

      // Save opponent before reset (used in step 2 header)
      const opp = matchForm.opponent;

      // Reset form
      setMatchForm(defaultMatch);
      setBattingForm(defaultBatting);
      setBowlingForm(defaultBowling);
      setFieldingForm(defaultFielding);
      setCustomDismissals([]);
      setCustomHowOutInput("");
      setWheelShots([]);
      setHasBatting(true);
      setHasBowling(false);
      setHasFielding(false);
      setIsWicketKeeper(false);

      // Advance to step 2
      setSavedOpponent(opp);
      setCreatedMatchId(matchId);
      setStep(2);

      if (allCelebrations.length > 0) {
        setPopupBadges(allCelebrations);
        fadeAnim.setValue(0);
        slideAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      Alert.alert(t("common.error"), t("log.failedToSave", { msg }));
    }
  };

  // Step 2 — media upload (with badge popup still overlaid if earned)
  if (step === 2 && createdMatchId !== null) {
    return (
      <View style={{ flex: 1 }}>
        <MediaStep
          matchId={createdMatchId}
          opponent={savedOpponent}
          onDone={() => {
            setStep(1);
            setCreatedMatchId(null);
            setSavedOpponent("");
            router.replace("/");
          }}
        />
        {popupBadges.length > 0 && (
          <Animated.View
            style={[
              styles.badgePopup,
              {
                opacity: fadeAnim,
                top: insets.top + 24,
                transform: [{ translateY: slideAnim }],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.popupHandle} />
            <Text style={styles.popupTitle}>{t("log.badgesUnlocked")}</Text>
            {popupBadges.map((b) => (
              <View key={b.id} style={styles.popupRow}>
                <Text style={styles.popupIcon}>{b.icon}</Text>
                <Text style={styles.popupLabel}>{b.label}</Text>
              </View>
            ))}
            <Text style={styles.popupHint}>{t("log.swipeUpDismiss")}</Text>
          </Animated.View>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {popupBadges.length > 0 && (
        <Animated.View
          style={[
            styles.badgePopup,
            {
              opacity: fadeAnim,
              top: insets.top + 24,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.popupHandle} />
          <Text style={styles.popupTitle}>{t("log.badgesUnlocked")}</Text>
          {popupBadges.map((b) => (
            <View key={b.id} style={styles.popupRow}>
              <Text style={styles.popupIcon}>{b.icon}</Text>
              <Text style={styles.popupLabel}>{b.label}</Text>
            </View>
          ))}
          <Text style={styles.popupHint}>{t("log.swipeUpDismiss")}</Text>
        </Animated.View>
      )}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 180 : 140) }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── In-page back button (NativeTabs / iOS only — header doesn't support headerLeft there) */}
        {isLiquidGlassAvailable() && (
          <TouchableOpacity
            onPress={() => router.navigate("/(tabs)/")}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: 4 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: colors.foreground }}>{t("common.back")}</Text>
          </TouchableOpacity>
        )}

        {/* ── Match Info ── */}
        <SectionCard icon="🏏" title={t("log.matchInfo")} enabled alwaysOpen>
          <Field label={t("log.date")}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.datePressable,
                { backgroundColor: colors.input, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.foreground, fontSize: 15, fontFamily: "Inter_400Regular" }}>
                {isoToDisplay(matchForm.date)}
              </Text>
              <Feather name="calendar" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </Field>

          <Field label={t("log.opponent")}>
            <Input
              value={matchForm.opponent}
              onChangeText={(v) => updateMatch("opponent", v)}
              placeholder="e.g. City CC"
            />
          </Field>

          <Field label={t("log.playingFor")}>
            <Input
              value={matchForm.playingFor}
              onChangeText={(v) => updateMatch("playingFor", v)}
              placeholder="e.g. City CC, School XI"
            />
          </Field>

          <Field label={t("log.venue")}>
            <Input
              value={matchForm.venue}
              onChangeText={(v) => updateMatch("venue", v)}
              placeholder="Optional"
            />
          </Field>

          <Field label={t("log.matchType")}>
            <ChipGroup
              options={MATCH_TYPES}
              selected={matchForm.matchType}
              onSelect={(v) => updateMatch("matchType", v)}
            />
          </Field>

          <Field label={t("log.result")}>
            <Input
              value={matchForm.result}
              onChangeText={(v) => updateMatch("result", v)}
              placeholder="e.g. Won by 5 wickets, Abandoned"
            />
          </Field>

          <ToggleRow
            label={t("log.playerOfMatch")}
            value={matchForm.playerOfTheMatch}
            onValueChange={(v) => updateMatch("playerOfTheMatch", v)}
          />

          <ToggleRow
            label={t("log.practiceMatch")}
            value={matchForm.isPractice}
            onValueChange={(v) => updateMatch("isPractice", v)}
          />

          <Field label={t("log.seriesTournament")}>
            <Input
              value={matchForm.series}
              onChangeText={(v) => updateMatch("series", v)}
              placeholder="e.g. State League 2026"
            />
          </Field>

          <Field label={t("log.pitchType")}>
            <ChipGroup
              options={PITCH_TYPES}
              selected={matchForm.pitchType}
              onSelect={(v) => updateMatch("pitchType", v)}
            />
          </Field>

          <Field label={t("log.weather")}>
            <ChipGroup
              options={WEATHER_OPTIONS}
              selected={matchForm.weatherConditions}
              onSelect={(v) => updateMatch("weatherConditions", v)}
            />
          </Field>

          <Field label={t("log.matchNotes")}>
            <TextInput
              style={[
                styles.notesInput,
                { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
              ]}
              value={matchForm.notes}
              onChangeText={(v) => updateMatch("notes", v)}
              placeholder="Any notes about the match…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
            />
          </Field>
        </SectionCard>

        {/* ── Batting ── */}
        <SectionCard
          icon="🏏"
          title={t("log.batting")}
          enabled={hasBatting}
          onToggle={setHasBatting}
        >
          <Row>
            <Field label={t("log.runsScored")} half>
              <Input
                value={battingForm.runs}
                onChangeText={(v) => updateBatting("runs", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label={t("log.ballsFaced")} half>
              <Input
                value={battingForm.ballsFaced}
                onChangeText={(v) => updateBatting("ballsFaced", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
          </Row>

          <Row>
            <Field label={t("log.foursLabel")} half>
              <Input
                value={battingForm.fours}
                onChangeText={(v) => updateBatting("fours", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label={t("log.sixesLabel")} half>
              <Input
                value={battingForm.sixes}
                onChangeText={(v) => updateBatting("sixes", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
          </Row>

          <Field label={t("log.battingPosition")}>
            <Input
              value={battingForm.battingPosition}
              onChangeText={(v) => updateBatting("battingPosition", v)}
              placeholder="e.g. 3"
              keyboardType="numeric"
            />
          </Field>

          <Field label={t("log.howOut")}>
            <ChipGroup
              options={[...HOW_OUT_OPTIONS, ...customDismissals]}
              selected={battingForm.howOut}
              onSelect={(v) => updateBatting("howOut", v)}
            />
            {matchForm.matchType.toLowerCase().includes("back yard") && (
              <View style={styles.customDismissalRow}>
                <TextInput
                  style={[
                    styles.customDismissalInput,
                    { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  placeholder={t("log.addCustomDismissal")}
                  placeholderTextColor={colors.mutedForeground}
                  value={customHowOutInput}
                  onChangeText={setCustomHowOutInput}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    const val = customHowOutInput.trim();
                    if (!val) return;
                    if (![...HOW_OUT_OPTIONS, ...customDismissals].includes(val)) {
                      setCustomDismissals(prev => [...prev, val]);
                    }
                    updateBatting("howOut", val);
                    setCustomHowOutInput("");
                  }}
                />
                <TouchableOpacity
                  style={[styles.customDismissalBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const val = customHowOutInput.trim();
                    if (!val) return;
                    if (![...HOW_OUT_OPTIONS, ...customDismissals].includes(val)) {
                      setCustomDismissals(prev => [...prev, val]);
                    }
                    updateBatting("howOut", val);
                    setCustomHowOutInput("");
                  }}
                >
                  <Text style={[styles.customDismissalBtnText, { color: colors.primaryForeground }]}>{t("log.addBtn")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </Field>

          <Field label={t("log.oppositionBowler")}>
            <Input
              value={battingForm.oppositionBowler}
              onChangeText={(v) => updateBatting("oppositionBowler", v)}
              placeholder="e.g. J. Smith"
            />
          </Field>

          {battingForm.howOut === "Caught" && (
            <Field label={t("log.caughtAt")}>
              <ChipGroup
                options={CAUGHT_POSITIONS}
                selected={battingForm.caughtPosition}
                onSelect={(v) => updateBatting("caughtPosition", v)}
              />
            </Field>
          )}

          <ToggleRow
            label={t("log.badUmpire")}
            sublabel={t("log.badUmpireSub")}
            value={battingForm.badUmpireDecision}
            onValueChange={(v) => updateBatting("badUmpireDecision", v)}
          />

          <Field label={t("log.ballsToFifty")}>
            <Input
              value={battingForm.ballsToFifty}
              onChangeText={(v) => updateBatting("ballsToFifty", v)}
              placeholder="e.g. 48"
              keyboardType="numeric"
            />
          </Field>

          <Field label={t("log.ballsToHundred")}>
            <Input
              value={battingForm.ballsToHundred}
              onChangeText={(v) => updateBatting("ballsToHundred", v)}
              placeholder="e.g. 82"
              keyboardType="numeric"
            />
          </Field>

          <Field label={t("log.ballsToHundredFifty")}>
            <Input
              value={battingForm.ballsToHundredFifty}
              onChangeText={(v) => updateBatting("ballsToHundredFifty", v)}
              placeholder="e.g. 121"
              keyboardType="numeric"
            />
          </Field>

          <Field label={t("log.wagonWheel")}>
            <WagonWheel shots={wheelShots} onShotsChange={setWheelShots} />
          </Field>
        </SectionCard>

        {/* ── Bowling ── */}
        <SectionCard
          icon={<CricketBallSvg size={22} />}
          title={t("log.bowling")}
          enabled={hasBowling}
          onToggle={setHasBowling}
        >
          <Row>
            <Field label={t("log.wickets")} half>
              <Input
                value={bowlingForm.wickets}
                onChangeText={(v) => updateBowling("wickets", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label={t("log.overs")} half>
              <Input
                value={bowlingForm.overs}
                onChangeText={(v) => updateBowling("overs", v)}
                placeholder="0.0"
                keyboardType="decimal-pad"
              />
            </Field>
          </Row>

          <Row>
            <Field label={t("log.runsConceded")} half>
              <Input
                value={bowlingForm.runsConceded}
                onChangeText={(v) => updateBowling("runsConceded", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label={t("log.maidens")} half>
              <Input
                value={bowlingForm.maidens}
                onChangeText={(v) => updateBowling("maidens", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
          </Row>

          <Row>
            <Field label={t("log.noBalls")} half>
              <Input
                value={bowlingForm.noBalls}
                onChangeText={(v) => updateBowling("noBalls", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label={t("log.wides")} half>
              <Input
                value={bowlingForm.wides}
                onChangeText={(v) => updateBowling("wides", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
          </Row>

          <Row>
            <Field label={t("log.bowledWkts")} half>
              <Input
                value={bowlingForm.bowledWickets}
                onChangeText={(v) => updateBowling("bowledWickets", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label={t("log.lbwWkts")} half>
              <Input
                value={bowlingForm.lbwWickets}
                onChangeText={(v) => updateBowling("lbwWickets", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
          </Row>

          <ToggleRow
            label={t("log.hatTrick")}
            value={bowlingForm.hatTrick}
            onValueChange={(v) => updateBowling("hatTrick", v)}
          />
          <ToggleRow
            label={t("log.wouldRefer")}
            sublabel={t("log.wouldReferSub")}
            value={bowlingForm.wouldHaveReferred}
            onValueChange={(v) => updateBowling("wouldHaveReferred", v)}
          />
        </SectionCard>

        {/* ── Fielding ── */}
        <SectionCard
          icon={<CatchingHandsSvg size={22} />}
          title={t("log.fielding")}
          enabled={hasFielding}
          onToggle={setHasFielding}
        >
          <Row>
            <Field label={t("log.catches")} half>
              <Input
                value={fieldingForm.catches}
                onChangeText={(v) => updateFielding("catches", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
            <View style={{ width: 10 }} />
            <Field label={t("log.droppedCatches")} half>
              <Input
                value={fieldingForm.droppedCatches}
                onChangeText={(v) => updateFielding("droppedCatches", v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </Field>
          </Row>

          <Field label={t("log.runOuts")}>
            <Input
              value={fieldingForm.runOuts}
              onChangeText={(v) => updateFielding("runOuts", v)}
              placeholder="0"
              keyboardType="numeric"
            />
          </Field>

          <ToggleRow
            label={t("log.wicketKeeperLabel")}
            sublabel={t("log.wicketKeeperSub")}
            value={isWicketKeeper}
            onValueChange={setIsWicketKeeper}
          />

          {isWicketKeeper && (
            <Row>
              <Field label={t("log.stumpings")} half>
                <Input
                  value={fieldingForm.stumpings}
                  onChangeText={(v) => updateFielding("stumpings", v)}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </Field>
              <View style={{ width: 10 }} />
              <Field label={t("log.missedStumpings")} half>
                <Input
                  value={fieldingForm.missedStumpings}
                  onChangeText={(v) => updateFielding("missedStumpings", v)}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </Field>
            </Row>
          )}
        </SectionCard>

      </ScrollView>

      {/* Floating save bar — sits above the tab bar */}
      <View
        style={[
          styles.saveBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            bottom: insets.bottom + (Platform.OS === "web" ? 84 : 49),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isPending ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={isPending}
        >
          <Feather name="check-circle" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{isPending ? t("common.saving") : t("log.saveMatch")}</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DatePickerCalendar
          value={matchForm.date}
          onChange={(iso) => updateMatch("date", iso)}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { padding: 12, gap: 12 },

  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  sectionIcon: { fontSize: 20 },
  sectionIconWrap: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  sectionTitle: { flex: 1, fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 4 },

  field: { marginBottom: 12 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  datePressable: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  row: { flexDirection: "row", marginBottom: 0 },

  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 2,
  },
  toggleLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  toggleSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },

  chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  customDismissalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    minHeight: 72,
    textAlignVertical: "top",
  },
  customDismissalInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  customDismissalBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  customDismissalBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  badgePopup: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: "#0f2218",
    borderColor: "#4A9E61",
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  popupTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#4A9E61",
    marginBottom: 14,
    textAlign: "center",
  },
  popupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  popupHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4ade8066",
    marginBottom: 14,
  },
  popupIcon: { fontSize: 26 },
  popupLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  popupHint: {
    fontSize: 11,
    color: "#4ade8066",
    fontFamily: "Inter_400Regular",
    marginTop: 10,
    letterSpacing: 0.3,
  },

  saveBar: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
