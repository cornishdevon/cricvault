import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import { useListMatches } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useT";
import {
  useAllPhotos,
  useAllVideos,
  filterPhotosByCategory,
  stripPrefix,
  SCORECARD_PREFIX,
  CUTTING_PREFIX,
  type PhotoCategory,
  type MediaPhoto,
  type MediaVideo,
} from "@/hooks/useAllMedia";

const { width: SCREEN_W } = Dimensions.get("window");
const GRID_COLS = 3;
const GRID_GAP = 2;
const CELL_SIZE = (SCREEN_W - GRID_GAP * (GRID_COLS + 1)) / GRID_COLS;

// ── Category chips ────────────────────────────────────────────────────────────

type Tab = "photos" | "scorecards" | "cuttings" | "videos";

const TABS: { key: Tab; icon: string }[] = [
  { key: "photos",     icon: "image" },
  { key: "scorecards", icon: "file-text" },
  { key: "cuttings",   icon: "scissors" },
  { key: "videos",     icon: "film" },
];

// ── Upload modal ──────────────────────────────────────────────────────────────

function getApiBase() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

interface UploadModalProps {
  visible: boolean;
  defaultCategory: Tab;
  onClose: () => void;
  onSuccess: () => void;
  colors: ReturnType<typeof useColors>;
  matches: { id: number; opponent: string; date: string }[];
}

function UploadModal({
  visible,
  defaultCategory,
  onClose,
  onSuccess,
  colors,
  matches,
}: UploadModalProps) {
  const t = useT();
  const [category, setCategory] = useState<Tab>(defaultCategory);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [imageSize, setImageSize] = useState(0);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setImageUri(null);
    setImageSize(0);
    setCaption("");
    setUploading(false);
    setCategory(defaultCategory);
    setSelectedMatchId(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        category === "videos"
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageMime(result.assets[0].mimeType ?? "image/jpeg");
      setImageSize(result.assets[0].fileSize ?? 0);
    }
  };

  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert(t("log.missingMedia"), t("log.pickFirst"));
      return;
    }
    setUploading(true);
    try {
      const ext = imageUri.split(".").pop() ?? "jpg";
      const fileName = `upload_${Date.now()}.${ext}`;
      const isVideo = category === "videos";

      const urlRes = await fetch(
        `${getApiBase()}/api/storage/uploads/request-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fileName,
            size: imageSize,
            contentType: imageMime,
          }),
        }
      );
      if (!urlRes.ok) throw new Error("Could not get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();

      const fileRes = await fetch(imageUri);
      const blob = await fileRes.blob();
      const putRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": imageMime },
        body: blob,
      });
      if (!putRes.ok) throw new Error("Upload failed");

      const prefix =
        category === "scorecards"
          ? SCORECARD_PREFIX
          : category === "cuttings"
          ? CUTTING_PREFIX
          : "";
      const finalCaption = prefix + caption.trim();

      if (isVideo) {
        const endpoint = selectedMatchId
          ? `${getApiBase()}/api/matches/${selectedMatchId}/videos`
          : `${getApiBase()}/api/media/videos`;
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ objectPath, caption: finalCaption }),
        });
      } else {
        const publicUrl = `${getApiBase()}/api/storage${objectPath}`;
        const endpoint = selectedMatchId
          ? `${getApiBase()}/api/matches/${selectedMatchId}/photos`
          : `${getApiBase()}/api/media/photos`;
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: publicUrl, caption: finalCaption }),
        });
      }

      reset();
      onSuccess();
    } catch (e: any) {
      Alert.alert(t("log.uploadFailed"), e.message ?? t("log.somethingWrong"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t("media.uploadMedia")}</Text>
          <TouchableOpacity onPress={handleClose}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
          {/* Category selector */}
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t("media.type")}</Text>
          <View style={styles.categoryRow}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setCategory(tab.key)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      category === tab.key ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: category === tab.key ? "#fff" : colors.foreground },
                  ]}
                >
                  {t(`media.${tab.key}` as any)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Match picker */}
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t("media.matchOptional")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchPicker}>
            <TouchableOpacity
              onPress={() => setSelectedMatchId(null)}
              style={[
                styles.matchChip,
                {
                  backgroundColor: selectedMatchId === null ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.matchChipText, { color: selectedMatchId === null ? "#fff" : colors.foreground }]}>
                {t("media.noMatch")}
              </Text>
              <Text style={[styles.matchChipDate, { color: selectedMatchId === null ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>
                {t("media.generalUpload")}
              </Text>
            </TouchableOpacity>
            {matches.map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => setSelectedMatchId(m.id)}
                style={[
                  styles.matchChip,
                  {
                    backgroundColor:
                      selectedMatchId === m.id ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.matchChipText,
                    { color: selectedMatchId === m.id ? "#fff" : colors.foreground },
                  ]}
                >
                  vs {m.opponent}
                </Text>
                <Text
                  style={[
                    styles.matchChipDate,
                    { color: selectedMatchId === m.id ? "rgba(255,255,255,0.75)" : colors.mutedForeground },
                  ]}
                >
                  {m.date}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Image preview / picker */}
          <TouchableOpacity
            onPress={pickImage}
            style={[styles.imagePicker, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Feather name={category === "videos" ? "film" : "image"} size={32} color={colors.mutedForeground} />
                <Text style={[styles.imagePickerText, { color: colors.mutedForeground }]}>
                  {category === "videos" ? t("media.tapPickVideo") : t("media.tapPickImage")}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Caption */}
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t("log.optionalCaption")}</Text>
          <TextInput
            style={[
              styles.captionInput,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
            ]}
            value={caption}
            onChangeText={setCaption}
            placeholder={t("media.addCaptionPlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            multiline
          />

          <TouchableOpacity
            style={[styles.uploadBtn, { backgroundColor: uploading ? colors.mutedForeground : colors.primary }]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.uploadBtnText}>{t("media.upload")}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Photo grid cell ───────────────────────────────────────────────────────────

function PhotoCell({ photo, colors }: { photo: MediaPhoto; colors: ReturnType<typeof useColors> }) {
  const t = useT();
  const [lightbox, setLightbox] = useState(false);
  const cap = stripPrefix(photo.caption);

  return (
    <>
      <TouchableOpacity onPress={() => setLightbox(true)} activeOpacity={0.85}>
        <Image
          source={{ uri: photo.url }}
          style={[styles.gridCell, { width: CELL_SIZE, height: CELL_SIZE }]}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <Modal visible={lightbox} transparent animationType="fade" onRequestClose={() => setLightbox(false)}>
        <TouchableOpacity style={styles.lightboxBg} activeOpacity={1} onPress={() => setLightbox(false)}>
          <Image source={{ uri: photo.url }} style={styles.lightboxImage} resizeMode="contain" />
          <View style={styles.lightboxMeta}>
            {photo.opponent ? (
              <Text style={styles.lightboxOpponent}>vs {photo.opponent}</Text>
            ) : (
              <Text style={styles.lightboxOpponent}>{t("common.general")}</Text>
            )}
            {cap ? <Text style={styles.lightboxCaption}>{cap}</Text> : null}
            {(photo.date || photo.matchType) ? (
              <Text style={styles.lightboxDate}>
                {[photo.date, photo.matchType].filter(Boolean).join(" · ")}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ── Video card ────────────────────────────────────────────────────────────────

function VideoCard({ video, colors }: { video: MediaVideo; colors: ReturnType<typeof useColors> }) {
  const t = useT();
  const cap = stripPrefix(video.caption);
  return (
    <View style={[styles.videoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.videoThumb, { backgroundColor: colors.secondary }]}>
        <Feather name="film" size={28} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.videoOpponent, { color: colors.foreground }]} numberOfLines={1}>
          {video.opponent ? `vs ${video.opponent}` : t("common.general")}
        </Text>
        {cap ? (
          <Text style={[styles.videoCaption, { color: colors.mutedForeground }]} numberOfLines={1}>
            {cap}
          </Text>
        ) : null}
        {(video.date || video.matchType) ? (
          <Text style={[styles.videoDate, { color: colors.mutedForeground }]}>
            {[video.date, video.matchType].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MediaScreen() {
  const t = useT();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("photos");
  const [uploadVisible, setUploadVisible] = useState(false);

  const { data: photos = [], isLoading: photosLoading, refetch: refetchPhotos, isRefetching: photosRefetching } = useAllPhotos();
  const { data: videos = [], isLoading: videosLoading, refetch: refetchVideos, isRefetching: videosRefetching } = useAllVideos();
  const { data: matches = [] } = useListMatches();

  const isLoading = photosLoading || videosLoading;
  const isRefreshing = photosRefetching || videosRefetching;

  const handleRefresh = useCallback(() => {
    refetchPhotos();
    refetchVideos();
  }, [refetchPhotos, refetchVideos]);

  const handleUploadSuccess = useCallback(() => {
    setUploadVisible(false);
    qc.invalidateQueries({ queryKey: ["media"] });
    handleRefresh();
  }, [qc, handleRefresh]);

  const filteredPhotos =
    activeTab !== "videos" ? filterPhotosByCategory(photos, activeTab as PhotoCategory) : [];
  const filteredVideos = activeTab === "videos" ? videos : [];

  const isEmpty =
    activeTab === "videos" ? filteredVideos.length === 0 : filteredPhotos.length === 0;

  const emptyLabel: Record<Tab, string> = {
    photos:     t("media.noPhotos"),
    scorecards: t("media.noScorecards"),
    cuttings:   t("media.noCuttings"),
    videos:     t("media.noVideos"),
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Category tabs */}
      <View style={[styles.tabStrip, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabStripInner}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabBtn,
                activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Feather
                name={tab.icon as any}
                size={14}
                color={activeTab === tab.key ? colors.primary : colors.mutedForeground}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === tab.key ? colors.primary : colors.mutedForeground },
                ]}
              >
                {t(`media.${tab.key}` as any)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : isEmpty ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.emptyState}
        >
          <Feather name={TABS.find((tab) => tab.key === activeTab)!.icon as any} size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{emptyLabel[activeTab]}</Text>
          <TouchableOpacity
            style={[styles.emptyUploadBtn, { backgroundColor: colors.primary }]}
            onPress={() => setUploadVisible(true)}
          >
            <Text style={styles.emptyUploadBtnText}>{t("media.upload")}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : activeTab === "videos" ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: 8 }}
        >
          {filteredVideos.map((v) => (
            <VideoCard key={v.id} video={v} colors={colors} />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredPhotos}
          numColumns={GRID_COLS}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
          columnWrapperStyle={{ gap: GRID_GAP, paddingHorizontal: GRID_GAP }}
          renderItem={({ item }) => <PhotoCell photo={item} colors={colors} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setUploadVisible(true)}
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 96 }]}
      >
        <Feather name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Upload modal */}
      <UploadModal
        visible={uploadVisible}
        defaultCategory={activeTab === "videos" ? "videos" : activeTab}
        onClose={() => setUploadVisible(false)}
        onSuccess={handleUploadSuccess}
        colors={colors}
        matches={matches.map((m) => ({ id: m.id, opponent: m.opponent, date: m.date }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  tabStrip: { borderBottomWidth: 1 },
  tabStripInner: { paddingHorizontal: 12 },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginRight: 4,
  },
  tabBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  gridCell: { borderRadius: 0 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 40 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  emptyUploadBtn: { borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 },
  emptyUploadBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },

  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  videoThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  videoOpponent: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  videoCaption: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  videoDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },

  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },

  // Lightbox
  lightboxBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxImage: { width: "100%", height: "70%" },
  lightboxMeta: { paddingHorizontal: 24, paddingTop: 16, width: "100%" },
  lightboxOpponent: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  lightboxCaption: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  lightboxDate: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },

  // Upload modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalBody: { padding: 20, gap: 8 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  categoryChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  categoryChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  matchPicker: { marginBottom: 4 },
  matchChip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    minWidth: 100,
  },
  matchChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  matchChipDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  imagePicker: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    overflow: "hidden",
    marginVertical: 4,
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePickerPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  imagePickerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  captionInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 60,
  },
  uploadBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  uploadBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
