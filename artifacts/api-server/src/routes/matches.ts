import { Router } from "express";
import { db } from "@workspace/db";
import {
  matchesTable,
  battingStatsTable,
  bowlingStatsTable,
  fieldingStatsTable,
  matchReportsTable,
  photosTable,
  videosTable,
  coachingTipsTable,
} from "@workspace/db";
import { eq, ne, and, desc, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { withObjectToken } from "../lib/signedObjectUrls";
import { userOwnsObjectPath } from "../lib/objectOwnership";

const router = Router();

router.use(requireAuth);

/** Returns the match row iff it exists AND belongs to the user, else null. */
async function getOwnedMatch(userId: string, matchId: number) {
  const [match] = await db
    .select()
    .from(matchesTable)
    .where(and(eq(matchesTable.id, matchId), eq(matchesTable.userId, userId)));
  return match ?? null;
}

// ── Matches ──────────────────────────────────────────────────────────────────

router.get("/matches", async (req, res) => {
  const matches = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.userId, req.userId!))
    .orderBy(desc(matchesTable.createdAt));
  return res.json(
    matches.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

router.post("/matches", async (req, res) => {
  const { date, opponent, venue, matchType, playingFor, result, playerOfTheMatch, notes, pitchType, weatherConditions, tossWinner, tossDecision, series, isPractice } = req.body;
  if (!date || !opponent || !matchType) {
    return res.status(400).json({ error: "date, opponent, and matchType are required" });
  }
  const [match] = await db
    .insert(matchesTable)
    .values({
      userId: req.userId!,
      date, opponent,
      venue: venue ?? null,
      matchType,
      playingFor: playingFor ?? null,
      result: result ?? null,
      playerOfTheMatch: !!playerOfTheMatch,
      notes: notes ?? null,
      pitchType: pitchType ?? null,
      weatherConditions: weatherConditions ?? null,
      tossWinner: tossWinner ?? null,
      tossDecision: tossDecision ?? null,
      series: series ?? null,
      isPractice: !!isPractice,
    })
    .returning();
  return res.status(201).json({ ...match, createdAt: match.createdAt.toISOString() });
});

router.get("/matches/:matchId", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const match = await getOwnedMatch(req.userId!, matchId);
  if (!match) return res.status(404).json({ error: "Match not found" });
  return res.json({ ...match, createdAt: match.createdAt.toISOString() });
});

router.patch("/matches/:matchId", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const { date, opponent, venue, matchType, playingFor, result, playerOfTheMatch, notes, pitchType, weatherConditions, tossWinner, tossDecision, series, isPractice } = req.body;
  const updates: Record<string, unknown> = {};
  if (date !== undefined) updates.date = date;
  if (opponent !== undefined) updates.opponent = opponent;
  if (venue !== undefined) updates.venue = venue;
  if (matchType !== undefined) updates.matchType = matchType;
  if (playingFor !== undefined) updates.playingFor = playingFor;
  if (result !== undefined) updates.result = result;
  if (playerOfTheMatch !== undefined) updates.playerOfTheMatch = !!playerOfTheMatch;
  if (notes !== undefined) updates.notes = notes || null;
  if (pitchType !== undefined) updates.pitchType = pitchType || null;
  if (weatherConditions !== undefined) updates.weatherConditions = weatherConditions || null;
  if (tossWinner !== undefined) updates.tossWinner = tossWinner || null;
  if (tossDecision !== undefined) updates.tossDecision = tossDecision || null;
  if (series !== undefined) updates.series = series || null;
  if (isPractice !== undefined) updates.isPractice = !!isPractice;
  const [match] = await db
    .update(matchesTable)
    .set(updates)
    .where(and(eq(matchesTable.id, matchId), eq(matchesTable.userId, req.userId!)))
    .returning();
  if (!match) return res.status(404).json({ error: "Match not found" });
  return res.json({ ...match, createdAt: match.createdAt.toISOString() });
});

router.delete("/matches/:matchId", async (req, res) => {
  const matchId = Number(req.params.matchId);
  await db
    .delete(matchesTable)
    .where(and(eq(matchesTable.id, matchId), eq(matchesTable.userId, req.userId!)));
  return res.status(204).send();
});

// ── Batting ───────────────────────────────────────────────────────────────────

function calcStrikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return parseFloat(((runs / balls) * 100).toFixed(2));
}

router.get("/matches/:matchId/batting", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const [row] = await db
    .select()
    .from(battingStatsTable)
    .where(eq(battingStatsTable.matchId, matchId));
  if (!row) return res.json(null);
  return res.json({ ...row, strikeRate: Number(row.strikeRate) });
});

router.post("/matches/:matchId/batting", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const { runs, ballsFaced, fours, sixes, battingPosition, howOut, badUmpireDecision, ballsToFifty, ballsToHundred, ballsToHundredFifty, oppositionBowler, caughtPosition, shotData } = req.body;
  const strikeRate = calcStrikeRate(runs, ballsFaced);
  const [row] = await db
    .insert(battingStatsTable)
    .values({
      matchId,
      runs,
      ballsFaced,
      fours,
      sixes,
      strikeRate: String(strikeRate),
      battingPosition: battingPosition ?? null,
      howOut: howOut ?? null,
      badUmpireDecision: badUmpireDecision ?? null,
      ballsToFifty: ballsToFifty ?? null,
      ballsToHundred: ballsToHundred ?? null,
      ballsToHundredFifty: ballsToHundredFifty ?? null,
      oppositionBowler: oppositionBowler ?? null,
      caughtPosition: caughtPosition ?? null,
      shotData: shotData ?? null,
    })
    .returning();
  return res.status(201).json({ ...row, strikeRate: Number(row.strikeRate) });
});

router.patch("/matches/:matchId/batting", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const { runs, ballsFaced, fours, sixes, battingPosition, howOut, badUmpireDecision, ballsToFifty, ballsToHundred, ballsToHundredFifty, oppositionBowler, caughtPosition, shotData } = req.body;
  const [existing] = await db
    .select()
    .from(battingStatsTable)
    .where(eq(battingStatsTable.matchId, matchId));
  if (!existing) return res.status(404).json({ error: "Batting stats not found" });
  const updates: Record<string, unknown> = {};
  if (runs !== undefined) updates.runs = runs;
  if (ballsFaced !== undefined) updates.ballsFaced = ballsFaced;
  if (fours !== undefined) updates.fours = fours;
  if (sixes !== undefined) updates.sixes = sixes;
  if (battingPosition !== undefined) updates.battingPosition = battingPosition;
  if (howOut !== undefined) updates.howOut = howOut;
  if (badUmpireDecision !== undefined) updates.badUmpireDecision = badUmpireDecision;
  if (ballsToFifty !== undefined) updates.ballsToFifty = ballsToFifty;
  if (ballsToHundred !== undefined) updates.ballsToHundred = ballsToHundred;
  if (ballsToHundredFifty !== undefined) updates.ballsToHundredFifty = ballsToHundredFifty;
  if (oppositionBowler !== undefined) updates.oppositionBowler = oppositionBowler || null;
  if (caughtPosition !== undefined) updates.caughtPosition = caughtPosition || null;
  if (shotData !== undefined) updates.shotData = shotData || null;
  const newRuns = runs ?? existing.runs;
  const newBalls = ballsFaced ?? existing.ballsFaced;
  updates.strikeRate = String(calcStrikeRate(newRuns, newBalls));
  const [row] = await db
    .update(battingStatsTable)
    .set(updates)
    .where(eq(battingStatsTable.matchId, matchId))
    .returning();
  return res.json({ ...row, strikeRate: Number(row.strikeRate) });
});

// ── Bowling ───────────────────────────────────────────────────────────────────

function calcEconomy(runs: number, overs: number): number {
  if (overs === 0) return 0;
  return parseFloat((runs / overs).toFixed(2));
}

type ValidatedWicketMap = {
  value: string | null;
  wicketCount: number;
  bowledWicketCount: number;
  lbwWicketCount: number;
};

const cricketOversPattern = /^(?:0|[1-9]\d*)(?:\.[0-5])?$/;

function validateWicketMap(
  value: unknown,
  options: { validateMetadata?: boolean } = {},
): ValidatedWicketMap {
  const validateMetadata = options.validateMetadata ?? true;
  if (value === null || value === undefined) {
    return { value: null, wicketCount: 0, bowledWicketCount: 0, lbwWicketCount: 0 };
  }
  if (typeof value !== "string") {
    throw new Error("wicketMap must be a JSON array string or null");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("wicketMap must be valid JSON");
  }

  if (!Array.isArray(parsed) || parsed.length > 100) {
    throw new Error("wicketMap must be a JSON array with at most 100 entries");
  }

  for (const entry of parsed) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("wicketMap entries must be objects");
    }
    const { id, kind, x, y, batter, over, note } = entry as {
      id?: unknown;
      kind?: unknown;
      x?: unknown;
      y?: unknown;
      batter?: unknown;
      over?: unknown;
      note?: unknown;
    };
    if (typeof id !== "string") {
      throw new Error("wicketMap entry id must be a string");
    }
    if (kind !== "caught" && kind !== "bowled" && kind !== "lbw") {
      throw new Error("wicketMap entry kind must be caught, bowled, or lbw");
    }
    if (
      typeof x !== "number" ||
      !Number.isFinite(x) ||
      x < 0 ||
      x > 1 ||
      typeof y !== "number" ||
      !Number.isFinite(y) ||
      y < 0 ||
      y > 1
    ) {
      throw new Error("wicketMap entry x and y must be finite numbers between 0 and 1");
    }
    if (validateMetadata) {
      if (batter !== undefined) {
        if (typeof batter !== "string") {
          throw new Error("wicketMap entry batter must be a string");
        }
        if (batter.length > 120) {
          throw new Error("wicketMap entry batter must be at most 120 characters");
        }
      }
      if (over !== undefined) {
        if (typeof over !== "string") {
          throw new Error("wicketMap entry over must be a string");
        }
        if (over.length > 8 || !cricketOversPattern.test(over)) {
          throw new Error("wicketMap entry over must be nonnegative completed overs in n or n.0-n.5 notation");
        }
      }
      if (note !== undefined) {
        if (typeof note !== "string") {
          throw new Error("wicketMap entry note must be a string");
        }
        if (note.length > 1000) {
          throw new Error("wicketMap entry note must be at most 1000 characters");
        }
      }
    }
  }

  return {
    value,
    wicketCount: parsed.length,
    bowledWicketCount: parsed.filter(
      (entry) => (entry as { kind: string }).kind === "bowled",
    ).length,
    lbwWicketCount: parsed.filter(
      (entry) => (entry as { kind: string }).kind === "lbw",
    ).length,
  };
}

function validateWicketTotals(
  map: ValidatedWicketMap,
  wickets: unknown,
  bowledWickets: unknown,
  lbwWickets: unknown,
): string | null {
  if (map.wicketCount === 0) return null;
  if (
    typeof wickets !== "number" ||
    !Number.isFinite(wickets) ||
    wickets < map.wicketCount
  ) {
    return `wickets must be at least ${map.wicketCount} when wicketMap contains ${map.wicketCount} entries`;
  }
  if (
    typeof bowledWickets !== "number" ||
    !Number.isFinite(bowledWickets) ||
    bowledWickets < map.bowledWicketCount
  ) {
    return `bowledWickets must be at least ${map.bowledWicketCount} when wicketMap contains ${map.bowledWicketCount} bowled entries`;
  }
  if (
    typeof lbwWickets !== "number" ||
    !Number.isFinite(lbwWickets) ||
    lbwWickets < map.lbwWicketCount
  ) {
    return `lbwWickets must be at least ${map.lbwWicketCount} when wicketMap contains ${map.lbwWicketCount} lbw entries`;
  }
  if (bowledWickets > wickets) {
    return "bowledWickets cannot exceed wickets when wicketMap is nonempty";
  }
  if (lbwWickets > wickets) {
    return "lbwWickets cannot exceed wickets when wicketMap is nonempty";
  }
  if (bowledWickets + lbwWickets > wickets) {
    return "bowledWickets plus lbwWickets cannot exceed wickets when wicketMap is nonempty";
  }
  return null;
}

router.get("/matches/:matchId/bowling", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const [row] = await db
    .select()
    .from(bowlingStatsTable)
    .where(eq(bowlingStatsTable.matchId, matchId));
  if (!row) return res.json(null);
  return res.json({ ...row, overs: Number(row.overs), economyRate: Number(row.economyRate) });
});

router.post("/matches/:matchId/bowling", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const { overs, maidens, runsConceded, wickets, noBalls, wides, hatTrick, bowledWickets, lbwWickets, wouldHaveReferred, wicketMap } = req.body;
  let validatedWicketMap: ValidatedWicketMap;
  try {
    validatedWicketMap = validateWicketMap(wicketMap);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Invalid wicketMap" });
  }
  const totalsError = validateWicketTotals(
    validatedWicketMap,
    wickets,
    bowledWickets ?? 0,
    lbwWickets ?? 0,
  );
  if (totalsError) return res.status(400).json({ error: totalsError });
  const economyRate = calcEconomy(runsConceded, overs);
  const [row] = await db
    .insert(bowlingStatsTable)
    .values({
      matchId,
      overs: String(overs),
      maidens,
      runsConceded,
      wickets,
      economyRate: String(economyRate),
      noBalls: noBalls ?? 0,
      wides: wides ?? 0,
      hatTrick: hatTrick ? 1 : 0,
      bowledWickets: bowledWickets ?? 0,
      lbwWickets: lbwWickets ?? 0,
      wouldHaveReferred: wouldHaveReferred ?? null,
      wicketMap: validatedWicketMap.value,
    })
    .returning();
  return res.status(201).json({ ...row, overs: Number(row.overs), economyRate: Number(row.economyRate), hatTrick: !!row.hatTrick });
});

router.patch("/matches/:matchId/bowling", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const { overs, maidens, runsConceded, wickets, noBalls, wides, hatTrick, bowledWickets, lbwWickets, wouldHaveReferred, wicketMap } = req.body;
  const [existing] = await db
    .select()
    .from(bowlingStatsTable)
    .where(eq(bowlingStatsTable.matchId, matchId));
  if (!existing) return res.status(404).json({ error: "Bowling stats not found" });
  const updates: Record<string, unknown> = {};
  if (overs !== undefined) updates.overs = String(overs);
  if (maidens !== undefined) updates.maidens = maidens;
  if (runsConceded !== undefined) updates.runsConceded = runsConceded;
  if (wickets !== undefined) updates.wickets = wickets;
  if (noBalls !== undefined) updates.noBalls = noBalls;
  if (wides !== undefined) updates.wides = wides;
  if (hatTrick !== undefined) updates.hatTrick = hatTrick ? 1 : 0;
  if (bowledWickets !== undefined) updates.bowledWickets = bowledWickets;
  if (lbwWickets !== undefined) updates.lbwWickets = lbwWickets;
  if (wouldHaveReferred !== undefined) updates.wouldHaveReferred = wouldHaveReferred;
  let mapForValidation: ValidatedWicketMap | null = null;
  if (wicketMap !== undefined) {
    try {
      mapForValidation = validateWicketMap(wicketMap);
      updates.wicketMap = mapForValidation.value;
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Invalid wicketMap" });
    }
  } else if (existing.wicketMap) {
    try {
      mapForValidation = validateWicketMap(existing.wicketMap, { validateMetadata: false });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Invalid wicketMap" });
    }
  }
  if (mapForValidation) {
    const totalsError = validateWicketTotals(
      mapForValidation,
      wickets ?? existing.wickets,
      bowledWickets ?? existing.bowledWickets,
      lbwWickets ?? existing.lbwWickets,
    );
    if (totalsError) return res.status(400).json({ error: totalsError });
  }
  const newRuns = runsConceded ?? existing.runsConceded;
  const newOvers = overs ?? Number(existing.overs);
  updates.economyRate = String(calcEconomy(newRuns, newOvers));
  const [row] = await db
    .update(bowlingStatsTable)
    .set(updates)
    .where(eq(bowlingStatsTable.matchId, matchId))
    .returning();
  return res.json({ ...row, overs: Number(row.overs), economyRate: Number(row.economyRate), hatTrick: !!row.hatTrick });
});

// ── Fielding ──────────────────────────────────────────────────────────────────

router.get("/matches/:matchId/fielding", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const [row] = await db
    .select()
    .from(fieldingStatsTable)
    .where(eq(fieldingStatsTable.matchId, matchId));
  if (!row) return res.json(null);
  return res.json(row);
});

router.post("/matches/:matchId/fielding", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const { catches, droppedCatches, runOuts, stumpings, missedStumpings } = req.body;
  const [row] = await db
    .insert(fieldingStatsTable)
    .values({
      matchId,
      catches,
      droppedCatches,
      runOuts: runOuts ?? 0,
      stumpings: stumpings ?? 0,
      missedStumpings: missedStumpings ?? 0,
    })
    .returning();
  return res.status(201).json(row);
});

router.patch("/matches/:matchId/fielding", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const { catches, droppedCatches, runOuts, stumpings, missedStumpings } = req.body;
  const updates: Record<string, unknown> = {};
  if (catches !== undefined) updates.catches = catches;
  if (droppedCatches !== undefined) updates.droppedCatches = droppedCatches;
  if (runOuts !== undefined) updates.runOuts = runOuts;
  if (stumpings !== undefined) updates.stumpings = stumpings;
  if (missedStumpings !== undefined) updates.missedStumpings = missedStumpings;
  const [row] = await db
    .update(fieldingStatsTable)
    .set(updates)
    .where(eq(fieldingStatsTable.matchId, matchId))
    .returning();
  if (!row) return res.status(404).json({ error: "Fielding stats not found" });
  return res.json(row);
});

// ── Match Report ──────────────────────────────────────────────────────────────

router.get("/matches/:matchId/report", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const [row] = await db
    .select()
    .from(matchReportsTable)
    .where(eq(matchReportsTable.matchId, matchId));
  if (!row) return res.json(null);
  return res.json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

router.post("/matches/:matchId/report", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const { notes, areasToImprove } = req.body;
  const [row] = await db
    .insert(matchReportsTable)
    .values({ matchId, notes: notes ?? null, areasToImprove: areasToImprove ?? null })
    .returning();
  return res.status(201).json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

router.patch("/matches/:matchId/report", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const { notes, areasToImprove, highlightsUrl } = req.body;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (notes !== undefined) updates.notes = notes;
  if (areasToImprove !== undefined) updates.areasToImprove = areasToImprove;
  if (highlightsUrl !== undefined) updates.highlightsUrl = highlightsUrl;
  const [row] = await db
    .update(matchReportsTable)
    .set(updates)
    .where(eq(matchReportsTable.matchId, matchId))
    .returning();
  if (!row) return res.status(404).json({ error: "Report not found" });
  return res.json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

// ── Photos ────────────────────────────────────────────────────────────────────

router.get("/matches/:matchId/photos", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const rows = await db
    .select()
    .from(photosTable)
    .where(eq(photosTable.matchId, matchId))
    .orderBy(desc(photosTable.createdAt));
  return res.json(rows.map((r) => ({ ...r, url: withObjectToken(r.url), createdAt: r.createdAt.toISOString() })));
});

router.post("/matches/:matchId/photos", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const { url, caption } = req.body;
  if (!url) return res.status(400).json({ error: "url is required" });
  if (!(await userOwnsObjectPath(req.userId!, url))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const [row] = await db
    .insert(photosTable)
    .values({ userId: req.userId!, matchId, url, caption: caption ?? null })
    .returning();
  return res.status(201).json({ ...row, url: withObjectToken(row.url), createdAt: row.createdAt.toISOString() });
});

router.delete("/photos/:photoId", async (req, res) => {
  const photoId = Number(req.params.photoId);
  await db
    .delete(photosTable)
    .where(and(eq(photosTable.id, photoId), eq(photosTable.userId, req.userId!)));
  return res.status(204).send();
});

// ── Videos ────────────────────────────────────────────────────────────────────

router.get("/matches/:matchId/videos", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const rows = await db
    .select()
    .from(videosTable)
    .where(eq(videosTable.matchId, matchId))
    .orderBy(desc(videosTable.createdAt));
  return res.json(rows.map((r) => ({ ...r, objectPath: withObjectToken(r.objectPath), createdAt: r.createdAt.toISOString() })));
});

router.post("/matches/:matchId/videos", async (req, res) => {
  const matchId = Number(req.params.matchId);
  if (!(await getOwnedMatch(req.userId!, matchId))) return res.status(404).json({ error: "Match not found" });
  const { objectPath, caption } = req.body;
  if (!objectPath) return res.status(400).json({ error: "objectPath is required" });
  if (!(await userOwnsObjectPath(req.userId!, objectPath))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const [row] = await db
    .insert(videosTable)
    .values({ userId: req.userId!, matchId, objectPath, caption: caption ?? null })
    .returning();
  return res.status(201).json({ ...row, objectPath: withObjectToken(row.objectPath), createdAt: row.createdAt.toISOString() });
});

router.delete("/videos/:videoId", async (req, res) => {
  const videoId = Number(req.params.videoId);
  await db
    .delete(videosTable)
    .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, req.userId!)));
  return res.status(204).send();
});

// ── Coaching Tips (global content, auth still required) ─────────────────────

router.get("/coaching-tips", async (req, res) => {
  const { category } = req.query as { category?: string };
  let rows;
  if (category) {
    rows = await db
      .select()
      .from(coachingTipsTable)
      .where(eq(coachingTipsTable.category, category));
  } else {
    rows = await db.select().from(coachingTipsTable);
  }
  return res.json(rows);
});

// ── Per-Match Stats (for charting) ────────────────────────────────────────────

router.get("/stats/per-match", async (req, res) => {
  const matches = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.userId, req.userId!))
    .orderBy(matchesTable.date);

  const results = await Promise.all(
    matches.map(async (m) => {
      const [batting] = await db
        .select()
        .from(battingStatsTable)
        .where(eq(battingStatsTable.matchId, m.id));
      const [bowling] = await db
        .select()
        .from(bowlingStatsTable)
        .where(eq(bowlingStatsTable.matchId, m.id));
      const [fielding] = await db
        .select()
        .from(fieldingStatsTable)
        .where(eq(fieldingStatsTable.matchId, m.id));
      return {
        matchId: m.id,
        date: m.date,
        opponent: m.opponent,
        venue: m.venue ?? null,
        matchType: m.matchType,
        playingFor: m.playingFor ?? null,
        series: m.series ?? null,
        isPractice: m.isPractice ?? false,
        runs: batting ? batting.runs : null,
        ballsFaced: batting ? batting.ballsFaced : null,
        strikeRate: batting ? Number(batting.strikeRate) : null,
        battingPosition: batting ? batting.battingPosition : null,
        fours: batting ? batting.fours : null,
        sixes: batting ? batting.sixes : null,
        howOut: batting ? batting.howOut ?? null : null,
        badUmpireDecision: batting ? batting.badUmpireDecision ?? null : null,
        ballsToFifty: batting ? batting.ballsToFifty ?? null : null,
        ballsToHundred: batting ? batting.ballsToHundred ?? null : null,
        oppositionBowler: batting ? batting.oppositionBowler ?? null : null,
        caughtPosition: batting ? batting.caughtPosition ?? null : null,
        shotData: batting ? batting.shotData ?? null : null,
        wickets: bowling ? bowling.wickets : null,
        runsConceded: bowling ? bowling.runsConceded : null,
        economyRate: bowling ? Number(bowling.economyRate) : null,
        overs: bowling ? Number(bowling.overs) : null,
        maidens: bowling ? bowling.maidens : null,
        noBalls: bowling ? bowling.noBalls : null,
        wides: bowling ? bowling.wides : null,
        hatTrick: bowling ? !!bowling.hatTrick : null,
         wicketMap: bowling ? bowling.wicketMap ?? null : null,
        bowledWickets: bowling ? bowling.bowledWickets : null,
        lbwWickets: bowling ? bowling.lbwWickets : null,
        wouldHaveReferred: bowling ? bowling.wouldHaveReferred ?? null : null,
        catches: fielding ? fielding.catches : null,
        stumpings: fielding ? fielding.stumpings : null,
        droppedCatches: fielding ? fielding.droppedCatches : null,
        missedStumpings: fielding ? fielding.missedStumpings : null,
        runOuts: fielding ? fielding.runOuts : null,
        result: m.result ?? null,
        playerOfTheMatch: m.playerOfTheMatch ?? false,
      };
    })
  );

  return res.json(results);
});

// ── Stats Summary ─────────────────────────────────────────────────────────────

router.get("/stats/summary", async (req, res) => {
  const userMatches = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.userId, req.userId!));
  const userMatchIds = new Set(userMatches.map((m) => m.id));
  // Exclude "Back Garden" matches from all career stats
  const bgIds = new Set(userMatches.filter((m) => m.matchType === "Back Garden").map((m) => m.id));
  const countableIds = new Set(userMatches.filter((m) => m.matchType !== "Back Garden").map((m) => m.id));

  const battingRows = (await db.select().from(battingStatsTable)).filter((r) => countableIds.has(r.matchId));
  const bowlingRows = (await db.select().from(bowlingStatsTable)).filter((r) => countableIds.has(r.matchId));
  const fieldingRows = (await db.select().from(fieldingStatsTable)).filter((r) => countableIds.has(r.matchId));

  const totalMatches = countableIds.size;

  const battingInnings = battingRows.length;
  const totalRuns = battingRows.reduce((s, r) => s + r.runs, 0);
  const totalBallsFaced = battingRows.reduce((s, r) => s + r.ballsFaced, 0);
  const totalFours = battingRows.reduce((s, r) => s + r.fours, 0);
  const totalSixes = battingRows.reduce((s, r) => s + r.sixes, 0);
  const highScoreRow = battingRows.reduce<(typeof battingRows)[0] | null>(
    (best, r) => (!best || r.runs > best.runs ? r : best), null
  );
  const highScore = highScoreRow?.runs ?? 0;
  const highScoreHowOut = highScoreRow?.howOut ?? null;
  const averageStrikeRate =
    totalBallsFaced > 0
      ? parseFloat(((totalRuns / totalBallsFaced) * 100).toFixed(2))
      : 0;

  const dismissals = battingRows.filter(
    (r) => !r.howOut || r.howOut.toLowerCase() !== "not out"
  );
  const notOuts = battingRows.filter(
    (r) => r.howOut && r.howOut.toLowerCase() === "not out"
  ).length;
  const battingAverage =
    dismissals.length > 0
      ? parseFloat((totalRuns / dismissals.length).toFixed(2))
      : totalRuns > 0
      ? totalRuns
      : 0;
  const centuries = battingRows.filter((r) => r.runs >= 100).length;
  const fifties = battingRows.filter((r) => r.runs >= 50 && r.runs < 100).length;
  const ducks = battingRows.filter(
    (r) => r.runs === 0 && r.howOut && r.howOut.toLowerCase() !== "not out"
  ).length;
  const goldenDucks = battingRows.filter(
    (r) =>
      r.runs === 0 &&
      r.ballsFaced <= 1 &&
      r.howOut &&
      r.howOut.toLowerCase() !== "not out"
  ).length;

  const bowlingInnings = bowlingRows.length;
  const totalWickets = bowlingRows.reduce((s, r) => s + r.wickets, 0);
  const totalOvers = bowlingRows.reduce((s, r) => s + Number(r.overs), 0);
  const totalRunsConceded = bowlingRows.reduce((s, r) => s + r.runsConceded, 0);
  const averageEconomyRate =
    totalOvers > 0 ? parseFloat((totalRunsConceded / totalOvers).toFixed(2)) : 0;
  const bowlingAverage =
    totalWickets > 0
      ? parseFloat((totalRunsConceded / totalWickets).toFixed(2))
      : 0;
  const bestBowling = bowlingRows.reduce(
    (best, r) =>
      r.wickets > best.wickets ||
      (r.wickets === best.wickets && r.runsConceded < best.runs)
        ? { wickets: r.wickets, runs: r.runsConceded }
        : best,
    { wickets: 0, runs: 0 }
  );
  const bestFigures =
    bowlingRows.length > 0
      ? `${bestBowling.wickets}/${bestBowling.runs}`
      : "0/0";
  const fiveWicketHauls = bowlingRows.filter((r) => r.wickets >= 5).length;
  const fourWicketHauls = bowlingRows.filter((r) => r.wickets === 4).length;
  const totalMaidens = bowlingRows.reduce((s, r) => s + (r.maidens ?? 0), 0);
  const totalNoBalls = bowlingRows.reduce((s, r) => s + (r.noBalls ?? 0), 0);
  const totalWides = bowlingRows.reduce((s, r) => s + (r.wides ?? 0), 0);
  const hatTricks = bowlingRows.filter((r) => r.hatTrick).length;

  const totalCatches = fieldingRows.reduce((s, r) => s + r.catches, 0);
  const totalDroppedCatches = fieldingRows.reduce((s, r) => s + r.droppedCatches, 0);
  const totalRunOuts = fieldingRows.reduce((s, r) => s + r.runOuts, 0);
  const totalStumpings = fieldingRows.reduce((s, r) => s + r.stumpings, 0);

  const potmCount = userMatches.filter((m) => m.matchType !== "Back Garden" && m.playerOfTheMatch).length;

  return res.json({
    totalMatches,
    potmCount,
    batting: {
      totalRuns,
      totalBallsFaced,
      averageStrikeRate,
      battingAverage,
      highScore,
      highScoreHowOut,
      totalFours,
      totalSixes,
      innings: battingInnings,
      centuries,
      fifties,
      ducks,
      goldenDucks,
      notOuts,
    },
    bowling: {
      totalWickets,
      totalOvers,
      totalRunsConceded,
      averageEconomyRate,
      bowlingAverage,
      bestFigures,
      innings: bowlingInnings,
      fiveWicketHauls,
      fourWicketHauls,
      totalMaidens,
      totalNoBalls,
      totalWides,
      hatTricks,
    },
    fielding: {
      totalCatches,
      totalDroppedCatches,
      totalRunOuts,
      totalStumpings,
    },
  });
});

// ── Global media gallery ──────────────────────────────────────────────────────

router.get("/media/photos", async (req, res) => {
  const photos = await db
    .select({
      id: photosTable.id,
      matchId: photosTable.matchId,
      url: photosTable.url,
      caption: photosTable.caption,
      opponent: matchesTable.opponent,
      date: matchesTable.date,
      matchType: matchesTable.matchType,
    })
    .from(photosTable)
    .leftJoin(matchesTable, eq(photosTable.matchId, matchesTable.id))
    .where(eq(photosTable.userId, req.userId!))
    .orderBy(desc(photosTable.createdAt));
  return res.json(photos.map((p) => ({ ...p, url: withObjectToken(p.url) })));
});

router.post("/media/photos", async (req, res) => {
  const { url, caption, matchId } = req.body;
  if (!url) return res.status(400).json({ error: "url is required" });
  if (matchId != null && !(await getOwnedMatch(req.userId!, Number(matchId)))) {
    return res.status(404).json({ error: "Match not found" });
  }
  if (!(await userOwnsObjectPath(req.userId!, url))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const [row] = await db
    .insert(photosTable)
    .values({ userId: req.userId!, matchId: matchId ?? null, url, caption: caption ?? null })
    .returning();
  return res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/media/photos/:photoId", async (req, res) => {
  const photoId = Number(req.params.photoId);
  const { matchId, caption } = req.body;
  const updates: Record<string, unknown> = {};
  if (matchId !== undefined) {
    if (matchId != null && !(await getOwnedMatch(req.userId!, Number(matchId)))) {
      return res.status(404).json({ error: "Match not found" });
    }
    updates.matchId = matchId ?? null;
  }
  if (caption !== undefined) updates.caption = caption;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "Nothing to update" });
  const [row] = await db
    .update(photosTable)
    .set(updates)
    .where(and(eq(photosTable.id, photoId), eq(photosTable.userId, req.userId!)))
    .returning();
  if (!row) return res.status(404).json({ error: "Photo not found" });
  return res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/media/videos", async (req, res) => {
  const videos = await db
    .select({
      id: videosTable.id,
      matchId: videosTable.matchId,
      objectPath: videosTable.objectPath,
      caption: videosTable.caption,
      opponent: matchesTable.opponent,
      date: matchesTable.date,
      matchType: matchesTable.matchType,
    })
    .from(videosTable)
    .leftJoin(matchesTable, eq(videosTable.matchId, matchesTable.id))
    .where(eq(videosTable.userId, req.userId!))
    .orderBy(desc(videosTable.createdAt));
  return res.json(videos.map((v) => ({ ...v, objectPath: withObjectToken(v.objectPath) })));
});

router.post("/media/videos", async (req, res) => {
  const { objectPath, caption, matchId } = req.body;
  if (!objectPath) return res.status(400).json({ error: "objectPath is required" });
  if (matchId != null && !(await getOwnedMatch(req.userId!, Number(matchId)))) {
    return res.status(404).json({ error: "Match not found" });
  }
  if (!(await userOwnsObjectPath(req.userId!, objectPath))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const [row] = await db
    .insert(videosTable)
    .values({ userId: req.userId!, matchId: matchId ?? null, objectPath, caption: caption ?? null })
    .returning();
  return res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/media/videos/:videoId", async (req, res) => {
  const videoId = Number(req.params.videoId);
  const { matchId, caption } = req.body;
  const updates: Record<string, unknown> = {};
  if (matchId !== undefined) {
    if (matchId != null && !(await getOwnedMatch(req.userId!, Number(matchId)))) {
      return res.status(404).json({ error: "Match not found" });
    }
    updates.matchId = matchId ?? null;
  }
  if (caption !== undefined) updates.caption = caption;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "Nothing to update" });
  const [row] = await db
    .update(videosTable)
    .set(updates)
    .where(and(eq(videosTable.id, videoId), eq(videosTable.userId, req.userId!)))
    .returning();
  if (!row) return res.status(404).json({ error: "Video not found" });
  return res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

export default router;
