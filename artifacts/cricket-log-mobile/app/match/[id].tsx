import {
  useGetMatch,
  useGetBattingStats,
  useGetBowlingStats,
  useGetFieldingStats,
  useGetMatchReport,
  useDeleteMatch,
  useListMatchPhotos,
  useListMatchVideos,
  useAddMatchPhoto,
  useAddMatchVideo,
  useCreateMatchReport,
  useUpdateMatchReport,
  getGetPerMatchStatsQueryKey,
  getGetStatsSummaryQueryKey,
  getListMatchesQueryKey,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
        title: `vs ${match.opponent}`,
        headerRight: () => (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginRight: 4 }}>
            <TouchableOpacity onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="share-2" size={18} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="trash-2" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [match, navigation, batting, bowling, fielding, report]);

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

  return (
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

      {/* Batting */}
      {batting ? (
        <Card title="Batting" icon="trending-up" colors={colors}>
          <StatRow label="Runs" value={batting.runs} colors={colors} />
          <StatRow label="Balls Faced" value={batting.ballsFaced} colors={colors} />
          <StatRow label="Strike Rate" value={sr} colors={colors} />
          <StatRow label="Fours (4s)" value={batting.fours} colors={colors} />
          <StatRow label="Sixes (6s)" value={batting.sixes} colors={colors} />
          <StatRow label="Batting Position" value={batting.battingPosition ?? undefined} colors={colors} />
          <StatRow label="How Out" value={batting.howOut ?? undefined} colors={colors} />
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
          <StatRow label="Wickets" value={bowling.wickets} colors={colors} />
          <StatRow label="Overs" value={overs} colors={colors} />
          <StatRow label="Runs Conceded" value={bowling.runsConceded} colors={colors} />
          <StatRow label="Economy Rate" value={econ} colors={colors} />
          <StatRow label="Maidens" value={bowling.maidens} colors={colors} />
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
          <StatRow label="Catches" value={fielding.catches} colors={colors} />
          <StatRow label="Dropped Catches" value={fielding.droppedCatches} colors={colors} />
          <StatRow label="Run Outs" value={fielding.runOuts} colors={colors} />
          <StatRow label="Stumpings" value={fielding.stumpings} colors={colors} />
          <StatRow label="Missed Stumpings" value={fielding.missedStumpings} colors={colors} />
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
