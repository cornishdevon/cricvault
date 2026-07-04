import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export type CsvRow = {
  matchId: number;
  date: string;
  opponent: string;
  matchType: string;
  playingFor?: string | null;
  series?: string | null;
  isPractice?: boolean | null;
  venue?: string | null;
  result?: string | null;
  playerOfTheMatch?: boolean | null;
  runs?: number | null;
  ballsFaced?: number | null;
  strikeRate?: number | null;
  fours?: number | null;
  sixes?: number | null;
  battingPosition?: number | null;
  howOut?: string | null;
  oppositionBowler?: string | null;
  caughtPosition?: string | null;
  wickets?: number | null;
  overs?: number | null;
  runsConceded?: number | null;
  economyRate?: number | null;
  catches?: number | null;
  droppedCatches?: number | null;
  stumpings?: number | null;
  runOuts?: number | null;
};

function escape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const HEADERS: (keyof CsvRow)[] = [
  "date", "opponent", "matchType", "playingFor", "series", "isPractice",
  "venue", "result", "playerOfTheMatch",
  "runs", "ballsFaced", "strikeRate", "fours", "sixes", "battingPosition", "howOut", "oppositionBowler", "caughtPosition",
  "wickets", "overs", "runsConceded", "economyRate",
  "catches", "droppedCatches", "stumpings", "runOuts",
];

export async function exportStatsCsv(rows: CsvRow[]): Promise<void> {
  const header = HEADERS.join(",");
  const body = rows.map((r) => HEADERS.map((k) => escape(r[k])).join(",")).join("\n");
  const csv = `${header}\n${body}`;

  const filename = `cricvault_stats_${new Date().toISOString().slice(0, 10)}.csv`;
  const uri = FileSystem.documentDirectory + filename;

  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle: "Export CricVault Stats" });
  } else {
    throw new Error("Sharing is not available on this device");
  }
}
