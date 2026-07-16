import {
  useGetMatch,
  useGetBattingStats,
  useGetBowlingStats,
  useGetFieldingStats,
  useGetMatchReport,
  useDeleteMatch,
  useUpdateMatch,
  useUpdateBattingStats,
  useUpdateBowlingStats,
  useUpdateFieldingStats,
  useListMatchPhotos,
  useListMatchVideos,
  useAddMatchPhoto,
  useAddMatchVideo,
  useCreateMatchReport,
  useUpdateMatchReport,
  getGetPerMatchStatsQueryKey,
  getGetStatsSummaryQueryKey,
  getListMatchesQueryKey,
  getGetMatchQueryKey,
  getGetBattingStatsQueryKey,
  getGetBowlingStatsQueryKey,
  getGetFieldingStatsQueryKey,
  getGetMatchReportQueryKey,
  getListMatchPhotosQueryKey,
  getListMatchVideosQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { useColors } from "@/hooks/useColors";
import { ShareCard } from "@/components/ShareCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MATCH_TYPES = [
  "League", "Cup", "Friendly", "County", "Country",
  "T20", "ODI", "Test", "The Hundred", "Tournament",
  "Practice", "School", "Social", "Back Garden", "Other",
];

const RESULT_OPTIONS = ["Win", "Loss", "Draw", "Tie", "No Result", "Abandoned"];

function StatRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string | number | null | undefined;
  colors: ReturnType<typeof useColors>;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function EditableRow({
  label,
  value,
  editValue,
  onChangeText,
  editing,
  numeric,
  colors,
}: {
  label: string;
  value: string | number | null | undefined;
  editValue: string;
  onChangeText: (v: string) => void;
  editing: boolean;
  numeric?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  if (!editing && (value === null || value === undefined || value === "")) return null;
  return (
    <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {editing ? (
        <TextInput
          style={[styles.editInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          value={editValue}
          onChangeText={onChangeText}
          keyboardType={numeric ? "numeric" : "default"}
          placeholder="—"
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="done"
        />
      ) : (
        <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      )}
    </View>
  );
}

function Card({
  title,
  icon,
  children,
  colors,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
          <Feather name={icon as any} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

async function uploadToPresignedUrl(uri: string, contentType: string): Promise<string | null> {
  try {
    const filename = uri.split("/").pop() ?? "upload";
    const urlRes = await fetch("/api/storage/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: filename, size: 0, contentType }),
    });
    if (!urlRes.ok) return null;
    const { uploadURL, objectPath } = await urlRes.json();

    const fileRes = await fetch(uri);
    const blob = await fileRes.blob();
    await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    return objectPath as string;
  } catch {
    return null;
  }
}

function MediaSection({
  matchId,
  report,
  colors,
}: {
  matchId: number;
  report: any;
  colors: ReturnType<typeof useColors>;
}) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [editingHighlights, setEditingHighlights] = useState(false);
  const [highlightsInput, setHighlightsInput] = useState("");

  const { data: photos } = useListMatchPhotos(matchId, {
    query: { queryKey: getListMatchPhotosQueryKey(matchId) },
  });
  const { data: videos } = useListMatchVideos(matchId, {
    query: { queryKey: getListMatchVideosQueryKey(matchId) },
  });
  const addPhoto = useAddMatchPhoto();
  const addVideo = useAddMatchVideo();
  const createReport = useCreateMatchReport();
  const updateReport = useUpdateMatchReport();

  const highlightsUrl = report ? (report as any).highlightsUrl : null;

  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const storageBase = domain ? `https://${domain}` : "";

  const getMediaUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return `${storageBase}${path}`;
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to upload match photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const contentType = asset.mimeType ?? "image/jpeg";
      const objectPath = await uploadToPresignedUrl(asset.uri, contentType);
      if (!objectPath) throw new Error("Upload failed");
      addPhoto.mutate(
        { matchId, data: { url: `/api/storage${objectPath}` } },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getListMatchPhotosQueryKey(matchId) });
          },
          onError: () => Alert.alert("Error", "Failed to save photo."),
        }
      );
    } catch {
      Alert.alert("Error", "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow media access to upload match videos.");
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
      const objectPath = await uploadToPresignedUrl(asset.uri, contentType);
      if (!objectPath) throw new Error("Upload failed");
      addVideo.mutate(
        { matchId, data: { objectPath: `/api/storage${objectPath}` } },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getListMatchVideosQueryKey(matchId) });
          },
          onError: () => Alert.alert("Error", "Failed to save video."),
        }
      );
    } catch {
      Alert.alert("Error", "Video upload failed.");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSaveHighlights = () => {
    const payload = {
      notes: report?.notes ?? undefined,
      areasToImprove: report?.areasToImprove ?? undefined,
      highlightsUrl: highlightsInput.trim() || undefined,
    };
    const invalidate = () => qc.invalidateQueries({ queryKey: getGetMatchReportQueryKey(matchId) });
    if (report) {
      updateReport.mutate(
        { matchId, data: payload as any },
        { onSuccess: () => { invalidate(); setEditingHighlights(false); } }
      );
    } else {
      createReport.mutate(
        { matchId, data: payload as any },
        { onSuccess: () => { invalidate(); setEditingHighlights(false); } }
      );
    }
  };

  const hasMedia = (photos && photos.length > 0) || (videos && videos.length > 0) || highlightsUrl;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
          <Feather name="film" size={16} color={colors.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Media</Text>
      </View>

      {/* Highlights URL */}
      <View style={[styles.mediaSectionBlock, { borderBottomColor: colors.border }]}>
        <Text style={[styles.mediaSectionTitle, { color: colors.mutedForeground }]}>🎬 Highlights</Text>
        {editingHighlights ? (
          <View style={styles.highlightsEdit}>
            <TextInput
              style={[styles.highlightsInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="https://www.youtube.com/watch?v=..."
              placeholderTextColor={colors.mutedForeground}
              value={highlightsInput}
              onChangeText={setHighlightsInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.highlightsBtns}>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveHighlights}
              >
                <Text style={styles.smallBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: colors.secondary }]}
                onPress={() => setEditingHighlights(false)}
              >
                <Text style={[styles.smallBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : highlightsUrl ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(highlightsUrl)}
            style={styles.highlightsRow}
          >
            <Feather name="youtube" size={16} color="#ff0000" />
            <Text style={[styles.highlightsLink, { color: colors.primary }]} numberOfLines={1}>
              {highlightsUrl}
            </Text>
            <Feather name="external-link" size={13} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => { setHighlightsInput(""); setEditingHighlights(true); }}
            style={styles.addMediaBtn}
          >
            <Feather name="plus" size={14} color={colors.primary} />
            <Text style={[styles.addMediaText, { color: colors.primary }]}>Add YouTube / highlights link</Text>
          </TouchableOpacity>
        )}
        {highlightsUrl && !editingHighlights && (
          <TouchableOpacity
            onPress={() => { setHighlightsInput(highlightsUrl); setEditingHighlights(true); }}
            style={{ marginTop: 6, marginLeft: 2 }}
          >
            <Text style={[styles.editLink, { color: colors.mutedForeground }]}>Edit link</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Photos */}
      <View style={[styles.mediaSectionBlock, { borderBottomColor: colors.border }]}>
        <View style={styles.mediaSectionRow}>
          <Text style={[styles.mediaSectionTitle, { color: colors.mutedForeground }]}>📷 Photos</Text>
          <TouchableOpacity onPress={handlePickPhoto} disabled={uploading} style={styles.addMediaBtn}>
            {uploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Feather name="plus" size={14} color={colors.primary} />
                <Text style={[styles.addMediaText, { color: colors.primary }]}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        {photos && photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll} contentContainerStyle={styles.photosContainer}>
            {photos.map((photo) => (
              <Image
                key={photo.id}
                source={{ uri: getMediaUrl(photo.url) }}
                style={styles.photoThumb}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.emptyMediaText, { color: colors.mutedForeground }]}>No photos yet</Text>
        )}
      </View>

      {/* Videos */}
      <View style={styles.mediaSectionBlock}>
        <View style={styles.mediaSectionRow}>
          <Text style={[styles.mediaSectionTitle, { color: colors.mutedForeground }]}>🎥 Videos</Text>
          <TouchableOpacity onPress={handlePickVideo} disabled={uploadingVideo} style={styles.addMediaBtn}>
            {uploadingVideo ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Feather name="plus" size={14} color={colors.primary} />
                <Text style={[styles.addMediaText, { color: colors.primary }]}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        {videos && videos.length > 0 ? (
          <View style={styles.videosList}>
            {videos.map((video, i) => (
              <View key={video.id} style={[styles.videoItem, { borderColor: colors.border }]}>
                <Feather name="video" size={18} color={colors.primary} />
                <Text style={[styles.videoCaption, { color: colors.foreground }]} numberOfLines={1}>
                  {video.caption || `Video ${i + 1}`}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyMediaText, { color: colors.mutedForeground }]}>No videos yet</Text>
        )}
      </View>
    </View>
  );
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: match, isLoading: matchLoading, refetch } = useGetMatch(matchId);
  const { data: batting } = useGetBattingStats(matchId);
  const { data: bowling } = useGetBowlingStats(matchId);
  const { data: fielding } = useGetFieldingStats(matchId);
  const { data: report } = useGetMatchReport(matchId);
  const { mutate: deleteMatch } = useDeleteMatch();
  const updateMatch = useUpdateMatch();
  const updateBatting = useUpdateBattingStats();
  const updateBowling = useUpdateBowlingStats();
  const updateFielding = useUpdateFieldingStats();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  // Always-fresh ref so the header button never calls a stale closure
  const handleSaveRef = React.useRef<() => void>(() => {});

  // Live ref for all edit values — updated every render so handleSave always
  // reads the current values even when memoised by React Compiler.
  const editValuesRef = React.useRef({
    opponent: "", date: "", matchType: "", venue: "", result: "",
    notes: "", pitchType: "", weather: "", tossWinner: "", tossDecision: "",
    runs: "", balls: "", fours: "", sixes: "", howOut: "",
    wickets: "", overs: "", runsConceded: "", maidens: "",
    catches: "", stumpings: "", runOuts: "", dropped: "",
  });

  // Match fields
  const [editOpponent, setEditOpponent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editMatchType, setEditMatchType] = useState("");
  const [editVenue, setEditVenue] = useState("");
  const [editResult, setEditResult] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPitchType, setEditPitchType] = useState("");
  const [editWeather, setEditWeather] = useState("");
  const [editTossWinner, setEditTossWinner] = useState("");
  const [editTossDecision, setEditTossDecision] = useState("");
  // Batting fields
  const [editRuns, setEditRuns] = useState("");
  const [editBalls, setEditBalls] = useState("");
  const [editFours, setEditFours] = useState("");
  const [editSixes, setEditSixes] = useState("");
  const [editHowOut, setEditHowOut] = useState("");
  // Bowling fields
  const [editWickets, setEditWickets] = useState("");
  const [editOvers, setEditOvers] = useState("");
  const [editRunsConceded, setEditRunsConceded] = useState("");
  const [editMaidens, setEditMaidens] = useState("");
  // Fielding fields
  const [editCatches, setEditCatches] = useState("");
  const [editStumpings, setEditStumpings] = useState("");
  const [editRunOuts, setEditRunOuts] = useState("");
  const [editDropped, setEditDropped] = useState("");

  // Sync ref with current state every render
  editValuesRef.current = {
    opponent: editOpponent, date: editDate, matchType: editMatchType,
    venue: editVenue, result: editResult, notes: editNotes,
    pitchType: editPitchType, weather: editWeather,
    tossWinner: editTossWinner, tossDecision: editTossDecision,
    runs: editRuns, balls: editBalls, fours: editFours,
    sixes: editSixes, howOut: editHowOut,
    wickets: editWickets, overs: editOvers,
    runsConceded: editRunsConceded, maidens: editMaidens,
    catches: editCatches, stumpings: editStumpings,
    runOuts: editRunOuts, dropped: editDropped,
  };

  const enterEditMode = () => {
    const m = match as any;
    setEditOpponent(m?.opponent ?? "");
    setEditDate(m?.date ?? "");
    setEditMatchType(m?.matchType ?? "");
    setEditVenue(m?.venue ?? "");
    setEditResult(m?.result ?? "");
    setEditNotes(m?.notes ?? "");
    setEditPitchType(m?.pitchType ?? "");
    setEditWeather(m?.weatherConditions ?? "");
    setEditTossWinner(m?.tossWinner ?? "");
    setEditTossDecision(m?.tossDecision ?? "");
    const bat = batting as any;
    setEditRuns(bat?.runs != null ? String(bat.runs) : "");
    setEditBalls(bat?.ballsFaced != null ? String(bat.ballsFaced) : "");
    setEditFours(bat?.fours != null ? String(bat.fours) : "");
    setEditSixes(bat?.sixes != null ? String(bat.sixes) : "");
    setEditHowOut(bat?.howOut ?? "");
    const bowl = bowling as any;
    setEditWickets(bowl?.wickets != null ? String(bowl.wickets) : "");
    setEditOvers(bowl?.overs != null ? String(Number(bowl.overs).toFixed(1)) : "");
    setEditRunsConceded(bowl?.runsConceded != null ? String(bowl.runsConceded) : "");
    setEditMaidens(bowl?.maidens != null ? String(bowl.maidens) : "");
    const field = fielding as any;
    setEditCatches(field?.catches != null ? String(field.catches) : "");
    setEditStumpings(field?.stumpings != null ? String(field.stumpings) : "");
    setEditRunOuts(field?.runOuts != null ? String(field.runOuts) : "");
    setEditDropped(field?.droppedCatches != null ? String(field.droppedCatches) : "");
    setEditMode(true);
  };

  const cancelEdit = () => setEditMode(false);

  const handleSave = async () => {
    // Read from ref so this works even when memoised by React Compiler
    const v = editValuesRef.current;
    setSaving(true);
    try {
      await updateMatch.mutateAsync({
        matchId,
        data: {
          opponent: v.opponent || undefined,
          date: v.date || undefined,
          matchType: v.matchType || undefined,
          venue: v.venue || undefined,
          result: v.result !== "" ? v.result : null,
          notes: v.notes || undefined,
          pitchType: v.pitchType || undefined,
          weatherConditions: v.weather || undefined,
          tossWinner: v.tossWinner || undefined,
          tossDecision: v.tossDecision || undefined,
        } as any,
      });
      if (batting) {
        await updateBatting.mutateAsync({
          matchId,
          data: {
            runs: v.runs !== "" ? Number(v.runs) : undefined,
            ballsFaced: v.balls !== "" ? Number(v.balls) : undefined,
            fours: v.fours !== "" ? Number(v.fours) : undefined,
            sixes: v.sixes !== "" ? Number(v.sixes) : undefined,
            howOut: v.howOut || undefined,
          } as any,
        });
      }
      if (bowling) {
        await updateBowling.mutateAsync({
          matchId,
          data: {
            wickets: v.wickets !== "" ? Number(v.wickets) : undefined,
            overs: v.overs !== "" ? Number(v.overs) : undefined,
            runsConceded: v.runsConceded !== "" ? Number(v.runsConceded) : undefined,
            maidens: v.maidens !== "" ? Number(v.maidens) : undefined,
          } as any,
        });
      }
      if (fielding) {
        await updateFielding.mutateAsync({
          matchId,
          data: {
            catches: v.catches !== "" ? Number(v.catches) : undefined,
            stumpings: v.stumpings !== "" ? Number(v.stumpings) : undefined,
            runOuts: v.runOuts !== "" ? Number(v.runOuts) : undefined,
            droppedCatches: v.dropped !== "" ? Number(v.dropped) : undefined,
          } as any,
        });
      }
      queryClient.invalidateQueries({ queryKey: getGetMatchQueryKey(matchId) });
      queryClient.invalidateQueries({ queryKey: getGetBattingStatsQueryKey(matchId) });
      queryClient.invalidateQueries({ queryKey: getGetBowlingStatsQueryKey(matchId) });
      queryClient.invalidateQueries({ queryKey: getGetFieldingStatsQueryKey(matchId) });
      queryClient.invalidateQueries({ queryKey: getGetPerMatchStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
      setEditMode(false);
    } catch {
      Alert.alert("Error", "Some changes could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Keep ref current on every render so the nav header never calls a stale closure
  handleSaveRef.current = handleSave;

  const handleDelete = () => {
    const label = match ? `vs ${match.opponent}` : "this match";
    Alert.alert("Delete Match", `Remove ${label}?\n\nThis cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteMatch(
            { matchId },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetPerMatchStatsQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
                router.back();
              },
            },
          ),
      },
    ]);
  };

  const handleShare = async () => {
    if (!match) return;
    const m = match as any;
    const lines: string[] = [];
    lines.push(`🏏 CricVault — vs ${m.opponent}`);
    const dateStr = m.date ? m.date.split("-").reverse().join("/") : m.date;
    lines.push(`${dateStr} · ${m.matchType}${m.venue ? ` · ${m.venue}` : ""}`);
    if (m.result) lines.push(`Result: ${m.result}`);
    if (m.playerOfTheMatch) lines.push("⭐ Player of the Match");

    if (batting) {
      const bat = batting as any;
      lines.push(""); lines.push("🏏 BATTING");
      const sr = bat.ballsFaced ? ((bat.runs / bat.ballsFaced) * 100).toFixed(1) : null;
      let batLine = `${bat.runs ?? 0} runs`;
      if (bat.ballsFaced) batLine += ` (${bat.ballsFaced}b)`;
      if (sr) batLine += ` · SR ${sr}`;
      lines.push(batLine);
      if ((bat.fours ?? 0) > 0 || (bat.sixes ?? 0) > 0)
        lines.push(`4s: ${bat.fours ?? 0}  6s: ${bat.sixes ?? 0}`);
      if (bat.howOut) lines.push(`Out: ${bat.howOut}`);
    }

    if (bowling) {
      const bowl = bowling as any;
      lines.push(""); lines.push("🎳 BOWLING");
      const econ = bowl.overs ? (bowl.runsConceded / bowl.overs).toFixed(2) : null;
      let bowlLine = `${bowl.wickets ?? 0}/${bowl.runsConceded ?? 0}`;
      if (bowl.overs) bowlLine += ` off ${Number(bowl.overs).toFixed(1)} overs`;
      if (econ) bowlLine += ` · Econ ${econ}`;
      lines.push(bowlLine);
      if (bowl.hatTrick) lines.push("🎩 Hat Trick!");
    }

    if (fielding) {
      const field = fielding as any;
      const parts: string[] = [];
      if ((field.catches ?? 0) > 0) parts.push(`${field.catches} catch${field.catches === 1 ? "" : "es"}`);
      if ((field.stumpings ?? 0) > 0) parts.push(`${field.stumpings} stumping${field.stumpings === 1 ? "" : "s"}`);
      if ((field.runOuts ?? 0) > 0) parts.push(`${field.runOuts} run out${field.runOuts === 1 ? "" : "s"}`);
      if (parts.length > 0) { lines.push(""); lines.push("🧤 FIELDING"); lines.push(parts.join(" · ")); }
    }

    if (report) {
      const r = report as any;
      if (r.notes) { lines.push(""); lines.push("📝 NOTES"); lines.push(r.notes); }
      if (r.areasToImprove) { lines.push(""); lines.push("💡 TO WORK ON"); lines.push(r.areasToImprove); }
    }

    lines.push(""); lines.push("Logged on CricVault 🏏");
    try {
      await Share.share({ message: lines.join("\n") });
    } catch { /* dismissed */ }
  };

  useEffect(() => {
    if (match) {
      navigation.setOptions({
        title: editMode ? "Editing…" : `vs ${match.opponent}`,
        headerRight: () =>
          editMode ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginRight: 4 }}>
              <TouchableOpacity onPress={cancelEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ fontSize: 15, color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSaveRef.current()} disabled={saving} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={{ fontSize: 15, color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginRight: 4 }}>
              <TouchableOpacity onPress={enterEditMode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="edit-2" size={17} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowShareCard(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="share-2" size={18} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="trash-2" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ),
      });
    }
  }, [match, navigation, batting, bowling, fielding, report, editMode, saving]);

  if (matchLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Match not found</Text>
      </View>
    );
  }

  const isWin = match.result?.toLowerCase().startsWith("w");
  const isLoss = match.result?.toLowerCase().startsWith("l");
  const resultBg = isWin ? "#1a7340" : isLoss ? "#c0392b" : colors.primary;

  const sr = batting ? Number(batting.strikeRate).toFixed(1) : null;
  const econ = bowling ? Number(bowling.economyRate).toFixed(2) : null;
  const overs = bowling ? Number(bowling.overs).toFixed(1) : null;

  const shareCardData = match ? {
    date: (match as any).date ?? "",
    opponent: (match as any).opponent ?? "",
    venue: (match as any).venue,
    matchType: (match as any).matchType ?? "",
    result: (match as any).result,
    playerOfTheMatch: (match as any).playerOfTheMatch,
    runs: (batting as any)?.runs,
    ballsFaced: (batting as any)?.ballsFaced,
    strikeRate: (batting as any)?.strikeRate,
    fours: (batting as any)?.fours,
    sixes: (batting as any)?.sixes,
    howOut: (batting as any)?.howOut,
    wickets: (bowling as any)?.wickets,
    overs: (bowling as any)?.overs,
    runsConceded: (bowling as any)?.runsConceded,
    economyRate: (bowling as any)?.economyRate,
    catches: (fielding as any)?.catches,
    stumpings: (fielding as any)?.stumpings,
  } : null;

  return (
    <>
    {shareCardData && (
      <ShareCard
        visible={showShareCard}
        onClose={() => setShowShareCard(false)}
        data={shareCardData}
      />
    )}
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />
      }
    >
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: resultBg }]}>
        <Text style={styles.heroOpponent}>vs {match.opponent}</Text>
        <Text style={styles.heroMeta}>
          {match.date} · {match.matchType}
        </Text>
        {match.venue ? <Text style={styles.heroVenue}>{match.venue}</Text> : null}
        {match.result ? (
          <View style={styles.resultPill}>
            <Text style={styles.resultPillText}>{match.result}</Text>
          </View>
        ) : null}
        {match.playerOfTheMatch ? (
          <Text style={styles.potm}>⭐ Player of the Match</Text>
        ) : null}
      </View>

      {/* Match Details (editable in edit mode) */}
      {editMode ? (
        <Card title="Match Details" icon="edit-2" colors={colors}>
          <EditableRow label="Opponent" value={(match as any).opponent} editValue={editOpponent} onChangeText={setEditOpponent} editing={editMode} colors={colors} />
          <EditableRow label="Date (YYYY-MM-DD)" value={(match as any).date} editValue={editDate} onChangeText={setEditDate} editing={editMode} colors={colors} />
          {editMode ? (
            <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Match Type</Text>
              <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
                {MATCH_TYPES.map((t) => {
                  const active = editMatchType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setEditMatchType(active ? "" : t)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary : colors.card,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: active ? "#fff" : colors.foreground }}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <StatRow label="Match Type" value={(match as any).matchType} colors={colors} />
          )}
          {editMode ? (
            <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Result</Text>
              <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
                {RESULT_OPTIONS.map((r) => {
                  const active = editResult === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setEditResult(active ? "" : r)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary : colors.card,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: active ? "#fff" : colors.foreground }}>{r}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <StatRow label="Result" value={(match as any).result} colors={colors} />
          )}
          <EditableRow label="Venue" value={(match as any).venue} editValue={editVenue} onChangeText={setEditVenue} editing={editMode} colors={colors} />
        </Card>
      ) : null}

      {/* Batting */}
      {batting ? (
        <Card title="Batting" icon="trending-up" colors={colors}>
          <EditableRow label="Runs" value={batting.runs} editValue={editRuns} onChangeText={setEditRuns} editing={editMode} numeric colors={colors} />
          <EditableRow label="Balls Faced" value={batting.ballsFaced} editValue={editBalls} onChangeText={setEditBalls} editing={editMode} numeric colors={colors} />
          <StatRow label="Strike Rate" value={sr} colors={colors} />
          <EditableRow label="Fours (4s)" value={batting.fours} editValue={editFours} onChangeText={setEditFours} editing={editMode} numeric colors={colors} />
          <EditableRow label="Sixes (6s)" value={batting.sixes} editValue={editSixes} onChangeText={setEditSixes} editing={editMode} numeric colors={colors} />
          <StatRow label="Batting Position" value={batting.battingPosition ?? undefined} colors={colors} />
          <EditableRow label="How Out" value={batting.howOut ?? undefined} editValue={editHowOut} onChangeText={setEditHowOut} editing={editMode} colors={colors} />
          {batting.badUmpireDecision ? (
            <StatRow label="Bad Umpire Decision" value="Yes" colors={colors} />
          ) : null}
          <StatRow label="Balls to 50" value={batting.ballsToFifty ?? undefined} colors={colors} />
          <StatRow label="Balls to 100" value={batting.ballsToHundred ?? undefined} colors={colors} />
          <StatRow label="Balls to 150" value={batting.ballsToHundredFifty ?? undefined} colors={colors} />
        </Card>
      ) : null}

      {/* Bowling */}
      {bowling ? (
        <Card title="Bowling" icon="activity" colors={colors}>
          <EditableRow label="Wickets" value={bowling.wickets} editValue={editWickets} onChangeText={setEditWickets} editing={editMode} numeric colors={colors} />
          <EditableRow label="Overs" value={overs} editValue={editOvers} onChangeText={setEditOvers} editing={editMode} numeric colors={colors} />
          <EditableRow label="Runs Conceded" value={bowling.runsConceded} editValue={editRunsConceded} onChangeText={setEditRunsConceded} editing={editMode} numeric colors={colors} />
          <StatRow label="Economy Rate" value={econ} colors={colors} />
          <EditableRow label="Maidens" value={bowling.maidens} editValue={editMaidens} onChangeText={setEditMaidens} editing={editMode} numeric colors={colors} />
          <StatRow label="No Balls" value={bowling.noBalls} colors={colors} />
          <StatRow label="Wides" value={bowling.wides} colors={colors} />
          <StatRow label="Bowled" value={bowling.bowledWickets} colors={colors} />
          <StatRow label="LBW" value={bowling.lbwWickets} colors={colors} />
          {bowling.hatTrick ? (
            <StatRow label="Hat Trick" value="Yes 🎩" colors={colors} />
          ) : null}
          {bowling.wouldHaveReferred ? (
            <StatRow label="Would Have Referred" value="Yes" colors={colors} />
          ) : null}
        </Card>
      ) : null}

      {/* Fielding */}
      {fielding ? (
        <Card title="Fielding" icon="shield" colors={colors}>
          <EditableRow label="Catches" value={fielding.catches} editValue={editCatches} onChangeText={setEditCatches} editing={editMode} numeric colors={colors} />
          <EditableRow label="Dropped Catches" value={fielding.droppedCatches} editValue={editDropped} onChangeText={setEditDropped} editing={editMode} numeric colors={colors} />
          <EditableRow label="Run Outs" value={fielding.runOuts} editValue={editRunOuts} onChangeText={setEditRunOuts} editing={editMode} numeric colors={colors} />
          <EditableRow label="Stumpings" value={fielding.stumpings} editValue={editStumpings} onChangeText={setEditStumpings} editing={editMode} numeric colors={colors} />
          <StatRow label="Missed Stumpings" value={fielding.missedStumpings} colors={colors} />
        </Card>
      ) : null}

      {/* Match Notes & Conditions */}
      {((match as any).notes || (match as any).pitchType || (match as any).weatherConditions || (match as any).tossWinner || editMode) ? (
        <Card title="Notes & Conditions" icon="info" colors={colors}>
          <EditableRow
            label="Match Notes"
            value={(match as any).notes ?? undefined}
            editValue={editNotes}
            onChangeText={setEditNotes}
            editing={editMode}
            colors={colors}
          />
          <EditableRow
            label="Pitch Type"
            value={(match as any).pitchType ?? undefined}
            editValue={editPitchType}
            onChangeText={setEditPitchType}
            editing={editMode}
            colors={colors}
          />
          <EditableRow
            label="Weather"
            value={(match as any).weatherConditions ?? undefined}
            editValue={editWeather}
            onChangeText={setEditWeather}
            editing={editMode}
            colors={colors}
          />
          <EditableRow
            label="Toss Winner"
            value={(match as any).tossWinner ?? undefined}
            editValue={editTossWinner}
            onChangeText={setEditTossWinner}
            editing={editMode}
            colors={colors}
          />
          <EditableRow
            label="Toss Decision"
            value={(match as any).tossDecision ?? undefined}
            editValue={editTossDecision}
            onChangeText={setEditTossDecision}
            editing={editMode}
            colors={colors}
          />
        </Card>
      ) : null}

      {/* Match Report */}
      {report ? (
        <Card title="Match Report" icon="file-text" colors={colors}>
          {report.notes ? (
            <View style={styles.reportSection}>
              <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>Notes</Text>
              <Text style={[styles.reportText, { color: colors.foreground }]}>{report.notes}</Text>
            </View>
          ) : null}
          {report.areasToImprove ? (
            <View style={styles.reportSection}>
              <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>
                Areas to Improve
              </Text>
              <Text style={[styles.reportText, { color: colors.foreground }]}>
                {report.areasToImprove}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {/* Media Section */}
      <MediaSection matchId={matchId} report={report} colors={colors} />

      {!batting && !bowling && !fielding && !report ? (
        <View style={styles.noStats}>
          <Feather name="info" size={24} color={colors.mutedForeground} />
          <Text style={[styles.noStatsText, { color: colors.mutedForeground }]}>
            No detailed stats recorded for this match.
          </Text>
        </View>
      ) : null}
    </ScrollView>
    </>
  );
}

const PHOTO_SIZE = (SCREEN_WIDTH - 32 - 28 - 24) / 3;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  hero: {
    padding: 24,
    paddingTop: 28,
    paddingBottom: 28,
    alignItems: "center",
    gap: 6,
  },
  heroOpponent: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  heroMeta: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_400Regular" },
  heroVenue: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular" },
  resultPill: {
    marginTop: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
  },
  resultPillText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  potm: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  card: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    paddingBottom: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardBody: {},
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  noStats: { alignItems: "center", gap: 10, marginTop: 40, paddingHorizontal: 40 },
  noStatsText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  reportSection: { padding: 14, paddingTop: 0 },
  reportSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reportText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },

  // Media section
  mediaSectionBlock: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 0,
  },
  mediaSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  mediaSectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addMediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addMediaText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyMediaText: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },

  // Highlights
  highlightsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  highlightsLink: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  highlightsEdit: { gap: 8 },
  highlightsInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  highlightsBtns: { flexDirection: "row", gap: 8 },
  smallBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  smallBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  editLink: { fontSize: 12, fontFamily: "Inter_400Regular", textDecorationLine: "underline" },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minWidth: 80,
    textAlign: "right",
  },

  // Photos
  photosScroll: { marginTop: 4 },
  photosContainer: { gap: 6 },
  photoThumb: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
  },

  // Videos
  videosList: { gap: 8, marginTop: 4 },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  videoCaption: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
});
