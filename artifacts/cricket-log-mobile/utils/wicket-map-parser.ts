import type { BowlingWicket } from "../components/BowlingWicketMap";

export function parseWicketMap(value: string | null | undefined): BowlingWicket[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length > 100 || parsed.some((w) =>
      !w || typeof w !== "object" || Array.isArray(w) ||
      typeof w.id !== "string" || !["caught", "bowled", "lbw"].includes(w.kind as string) ||
      !Number.isFinite(w.x) || !Number.isFinite(w.y) ||
      w.x < 0 || w.x > 1 || w.y < 0 || w.y > 1
    )) throw new Error("Invalid saved wicket map");

    // Legacy optional metadata must not invalidate otherwise valid geometry.
    return parsed.map((entry) => {
      const wicket: BowlingWicket = {
        id: entry.id, kind: entry.kind, x: entry.x, y: entry.y,
      };
      if (typeof entry.batter === "string" && entry.batter.length <= 120) wicket.batter = entry.batter;
      if (typeof entry.over === "string" && entry.over.length <= 8 && /^(?:0|[1-9]\d*)(?:\.[0-5])?$/.test(entry.over)) wicket.over = entry.over;
      if (typeof entry.note === "string" && entry.note.length <= 1000) wicket.note = entry.note;
      return wicket;
    });
  } catch (error) {
    console.warn("Unable to read saved wicket map", error);
    return [];
  }
}