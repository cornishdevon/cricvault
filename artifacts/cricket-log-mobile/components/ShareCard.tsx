import React, { useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  Dimensions,
} from "react-native";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";

const W = Dimensions.get("window").width;

type ShareCardProps = {
  visible: boolean;
  onClose: () => void;
  data: {
    date: string;
    opponent: string;
    venue?: string | null;
    matchType: string;
    result?: string | null;
    playerOfTheMatch?: boolean | null;
    runs?: number | null;
    ballsFaced?: number | null;
    strikeRate?: number | null;
    fours?: number | null;
    sixes?: number | null;
    howOut?: string | null;
    wickets?: number | null;
    overs?: number | null;
    runsConceded?: number | null;
    economyRate?: number | null;
    catches?: number | null;
    stumpings?: number | null;
  };
};

function fmtDate(iso: string) {
  return iso.split("-").reverse().join("/");
}

export function ShareCard({ visible, onClose, data }: ShareCardProps) {
  const shotRef = useRef<ViewShot>(null);

  const hasBatting  = data.runs != null;
  const hasBowling  = data.wickets != null;
  const hasFielding = (data.catches ?? 0) > 0 || (data.stumpings ?? 0) > 0;

  const shareAsImage = async () => {
    try {
      const uri = await (shotRef.current as any)?.capture?.();
      if (!uri) throw new Error("Capture failed");
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share Match Card" });
      }
    } catch {
      shareAsText();
    }
  };

  const shareAsText = async () => {
    const lines: string[] = [
      `🏏 CricVault Match Card`,
      `vs ${data.opponent}  ·  ${fmtDate(data.date)}`,
      data.venue ? `📍 ${data.venue}` : "",
      data.matchType,
      "",
    ];
    if (hasBatting) {
      const sr = data.strikeRate != null ? ` (SR ${Number(data.strikeRate).toFixed(1)})` : "";
      lines.push(`Batting: ${data.runs}${data.ballsFaced != null ? ` off ${data.ballsFaced}b` : ""}${sr}`);
      if (data.fours || data.sixes) {
        lines.push(`  ${data.fours ?? 0}×4  ${data.sixes ?? 0}×6`);
      }
      if (data.howOut) lines.push(`  ${data.howOut}`);
    }
    if (hasBowling) {
      lines.push(`Bowling: ${data.wickets}/${data.runsConceded} off ${Number(data.overs ?? 0).toFixed(1)} overs`);
      if (data.economyRate != null) lines.push(`  Economy ${Number(data.economyRate).toFixed(2)}`);
    }
    if (hasFielding) {
      const parts: string[] = [];
      if ((data.catches ?? 0) > 0) parts.push(`${data.catches}c`);
      if ((data.stumpings ?? 0) > 0) parts.push(`${data.stumpings}st`);
      lines.push(`Fielding: ${parts.join("  ")}`);
    }
    if (data.result) lines.push(`\nResult: ${data.result}`);
    if (data.playerOfTheMatch) lines.push("⭐ Player of the Match");
    lines.push("\nLogged on CricVault 🏏");

    try {
      await Share.share({ message: lines.filter(Boolean).join("\n") });
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ViewShot ref={shotRef} options={{ format: "png", quality: 1 }}>
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.brand}>CricVault</Text>
                {data.playerOfTheMatch && <Text style={styles.potm}>⭐ POTM</Text>}
              </View>

              <Text style={styles.title}>vs {data.opponent}</Text>
              <Text style={styles.sub}>{fmtDate(data.date)}  ·  {data.matchType}</Text>
              {data.venue ? <Text style={styles.sub2}>📍 {data.venue}</Text> : null}

              <View style={styles.divider} />

              {hasBatting && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🏏 Batting</Text>
                  <View style={styles.statRow}>
                    <Stat label="Runs" value={String(data.runs)} big />
                    {data.ballsFaced != null && <Stat label="Balls" value={String(data.ballsFaced)} />}
                    {data.strikeRate != null && <Stat label="SR" value={Number(data.strikeRate).toFixed(1)} />}
                    {data.fours != null && <Stat label="4s" value={String(data.fours)} />}
                    {data.sixes != null && <Stat label="6s" value={String(data.sixes)} />}
                  </View>
                  {data.howOut ? <Text style={styles.dismissal}>{data.howOut}</Text> : null}
                </View>
              )}

              {hasBowling && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🎳 Bowling</Text>
                  <View style={styles.statRow}>
                    <Stat label="Wickets" value={String(data.wickets)} big />
                    {data.runsConceded != null && <Stat label="Runs" value={String(data.runsConceded)} />}
                    {data.overs != null && <Stat label="Overs" value={Number(data.overs).toFixed(1)} />}
                    {data.economyRate != null && <Stat label="Econ" value={Number(data.economyRate).toFixed(2)} />}
                  </View>
                </View>
              )}

              {hasFielding && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🧤 Fielding</Text>
                  <View style={styles.statRow}>
                    {(data.catches ?? 0) > 0 && <Stat label="Catches" value={String(data.catches)} />}
                    {(data.stumpings ?? 0) > 0 && <Stat label="Stumpings" value={String(data.stumpings)} />}
                  </View>
                </View>
              )}

              {data.result ? (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.result}>Result: {data.result}</Text>
                </>
              ) : null}
            </View>
          </ViewShot>

          <View style={styles.btnRow}>
            <TouchableOpacity onPress={shareAsImage} style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>Share Card</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={shareAsText} style={styles.btnSecondary}>
              <Text style={styles.btnSecondaryText}>Share Text</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.btnCancel}>
              <Text style={styles.btnCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statVal, big && styles.statValBig]}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000088",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  container: { width: "100%", maxWidth: 380, gap: 12 },
  card: {
    backgroundColor: "#1C2519",
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#A8B5A0", letterSpacing: 1 },
  potm: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#F5C842" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#EDE8DC" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#A8B5A0" },
  sub2: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#A8B5A0" },
  divider: { height: 1, backgroundColor: "#2D3B29" },
  section: { gap: 6 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#A8B5A0", letterSpacing: 0.5 },
  statRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  statBox: { alignItems: "center", minWidth: 44 },
  statVal: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#EDE8DC" },
  statValBig: { fontSize: 28, color: "#C8F75A" },
  statLbl: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#A8B5A0", marginTop: 2 },
  dismissal: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#A8B5A0", fontStyle: "italic" },
  result: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#C8F75A" },
  btnRow: { flexDirection: "row", gap: 8 },
  btnPrimary: { flex: 1, backgroundColor: "#4A7C59", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  btnPrimaryText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  btnSecondary: { flex: 1, backgroundColor: "#2D3B29", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  btnSecondaryText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#EDE8DC" },
  btnCancel: { paddingHorizontal: 16, borderRadius: 12, paddingVertical: 12, alignItems: "center", backgroundColor: "#ffffff22" },
  btnCancelText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#EDE8DC" },
});
