import { Router } from "express";
import { db } from "@workspace/db";
import {
  matchesTable,
  battingStatsTable,
  bowlingStatsTable,
  fieldingStatsTable,
  matchReportsTable,
  photosTable,
  coachingTipsTable,
} from "@workspace/db";
import { eq, desc, sum, max, count } from "drizzle-orm";

const router = Router();

// ── Matches ──────────────────────────────────────────────────────────────────

router.get("/matches", async (req, res) => {
  const matches = await db
    .select()
    .from(matchesTable)
    .orderBy(desc(matchesTable.createdAt));
  res.json(
    matches.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

router.post("/matches", async (req, res) => {
  const { date, opponent, venue, matchType, playingFor, result, playerOfTheMatch } = req.body;
  if (!date || !opponent || !matchType) {
    return res.status(400).json({ error: "date, opponent, and matchType are required" });
  }
  const [match] = await db
    .insert(matchesTable)
    .values({ date, opponent, venue: venue ?? null, matchType, playingFor: playingFor ?? null, result: result ?? null, playerOfTheMatch: !!playerOfTheMatch })
    .returning();
  res.status(201).json({ ...match, createdAt: match.createdAt.toISOString() });
});

router.get("/matches/:matchId", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) return res.status(404).json({ error: "Match not found" });
  res.json({ ...match, createdAt: match.createdAt.toISOString() });
});

router.patch("/matches/:matchId", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const { date, opponent, venue, matchType, playingFor, result, playerOfTheMatch } = req.body;
  const updates: Record<string, unknown> = {};
  if (date !== undefined) updates.date = date;
  if (opponent !== undefined) updates.opponent = opponent;
  if (venue !== undefined) updates.venue = venue;
  if (matchType !== undefined) updates.matchType = matchType;
  if (playingFor !== undefined) updates.playingFor = playingFor;
  if (result !== undefined) updates.result = result;
  if (playerOfTheMatch !== undefined) updates.playerOfTheMatch = !!playerOfTheMatch;
  const [match] = await db
    .update(matchesTable)
    .set(updates)
    .where(eq(matchesTable.id, matchId))
    .returning();
  if (!match) return res.status(404).json({ error: "Match not found" });
  res.json({ ...match, createdAt: match.createdAt.toISOString() });
});

router.delete("/matches/:matchId", async (req, res) => {
  const matchId = Number(req.params.matchId);
  await db.delete(matchesTable).where(eq(matchesTable.id, matchId));
  res.status(204).send();
});

// ── Batting ───────────────────────────────────────────────────────────────────

function calcStrikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return parseFloat(((runs / balls) * 100).toFixed(2));
}

router.get("/matches/:matchId/batting", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const [row] = await db
    .select()
    .from(battingStatsTable)
    .where(eq(battingStatsTable.matchId, matchId));
  if (!row) return res.json(null);
  res.json({ ...row, strikeRate: Number(row.strikeRate) });
});

router.post("/matches/:matchId/batting", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const { runs, ballsFaced, fours, sixes, battingPosition, howOut, badUmpireDecision } = req.body;
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
    })
    .returning();
  res.status(201).json({ ...row, strikeRate: Number(row.strikeRate) });
});

router.patch("/matches/:matchId/batting", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const { runs, ballsFaced, fours, sixes, battingPosition, howOut, badUmpireDecision } = req.body;
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
  const newRuns = runs ?? existing.runs;
  const newBalls = ballsFaced ?? existing.ballsFaced;
  updates.strikeRate = String(calcStrikeRate(newRuns, newBalls));
  const [row] = await db
    .update(battingStatsTable)
    .set(updates)
    .where(eq(battingStatsTable.matchId, matchId))
    .returning();
  res.json({ ...row, strikeRate: Number(row.strikeRate) });
});

// ── Bowling ───────────────────────────────────────────────────────────────────

function calcEconomy(runs: number, overs: number): number {
  if (overs === 0) return 0;
  return parseFloat((runs / overs).toFixed(2));
}

router.get("/matches/:matchId/bowling", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const [row] = await db
    .select()
    .from(bowlingStatsTable)
    .where(eq(bowlingStatsTable.matchId, matchId));
  if (!row) return res.json(null);
  res.json({ ...row, overs: Number(row.overs), economyRate: Number(row.economyRate) });
});

router.post("/matches/:matchId/bowling", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const { overs, maidens, runsConceded, wickets, noBalls, wides, hatTrick, bowledWickets, lbwWickets, wouldHaveReferred } = req.body;
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
    })
    .returning();
  res.status(201).json({ ...row, overs: Number(row.overs), economyRate: Number(row.economyRate), hatTrick: !!row.hatTrick });
});

router.patch("/matches/:matchId/bowling", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const { overs, maidens, runsConceded, wickets, noBalls, wides, hatTrick, bowledWickets, lbwWickets, wouldHaveReferred } = req.body;
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
  const newRuns = runsConceded ?? existing.runsConceded;
  const newOvers = overs ?? Number(existing.overs);
  updates.economyRate = String(calcEconomy(newRuns, newOvers));
  const [row] = await db
    .update(bowlingStatsTable)
    .set(updates)
    .where(eq(bowlingStatsTable.matchId, matchId))
    .returning();
  res.json({ ...row, overs: Number(row.overs), economyRate: Number(row.economyRate), hatTrick: !!row.hatTrick });
});

// ── Fielding ──────────────────────────────────────────────────────────────────

router.get("/matches/:matchId/fielding", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const [row] = await db
    .select()
    .from(fieldingStatsTable)
    .where(eq(fieldingStatsTable.matchId, matchId));
  if (!row) return res.json(null);
  res.json(row);
});

router.post("/matches/:matchId/fielding", async (req, res) => {
  const matchId = Number(req.params.matchId);
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
  res.status(201).json(row);
});

router.patch("/matches/:matchId/fielding", async (req, res) => {
  const matchId = Number(req.params.matchId);
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
  res.json(row);
});

// ── Match Report ──────────────────────────────────────────────────────────────

router.get("/matches/:matchId/report", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const [row] = await db
    .select()
    .from(matchReportsTable)
    .where(eq(matchReportsTable.matchId, matchId));
  if (!row) return res.json(null);
  res.json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

router.post("/matches/:matchId/report", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const { notes, areasToImprove } = req.body;
  const [row] = await db
    .insert(matchReportsTable)
    .values({ matchId, notes: notes ?? null, areasToImprove: areasToImprove ?? null })
    .returning();
  res.status(201).json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

router.patch("/matches/:matchId/report", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const { notes, areasToImprove } = req.body;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (notes !== undefined) updates.notes = notes;
  if (areasToImprove !== undefined) updates.areasToImprove = areasToImprove;
  const [row] = await db
    .update(matchReportsTable)
    .set(updates)
    .where(eq(matchReportsTable.matchId, matchId))
    .returning();
  if (!row) return res.status(404).json({ error: "Report not found" });
  res.json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

// ── Photos ────────────────────────────────────────────────────────────────────

router.get("/matches/:matchId/photos", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const rows = await db
    .select()
    .from(photosTable)
    .where(eq(photosTable.matchId, matchId))
    .orderBy(desc(photosTable.createdAt));
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/matches/:matchId/photos", async (req, res) => {
  const matchId = Number(req.params.matchId);
  const { url, caption } = req.body;
  if (!url) return res.status(400).json({ error: "url is required" });
  const [row] = await db
    .insert(photosTable)
    .values({ matchId, url, caption: caption ?? null })
    .returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/photos/:photoId", async (req, res) => {
  const photoId = Number(req.params.photoId);
  await db.delete(photosTable).where(eq(photosTable.id, photoId));
  res.status(204).send();
});

// ── Coaching Tips ─────────────────────────────────────────────────────────────

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
  res.json(rows);
});

// ── Per-Match Stats (for charting) ────────────────────────────────────────────

router.get("/stats/per-match", async (req, res) => {
  const matches = await db
    .select()
    .from(matchesTable)
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
        matchType: m.matchType,
        runs: batting ? batting.runs : null,
        ballsFaced: batting ? batting.ballsFaced : null,
        strikeRate: batting ? Number(batting.strikeRate) : null,
        wickets: bowling ? bowling.wickets : null,
        runsConceded: bowling ? bowling.runsConceded : null,
        economyRate: bowling ? Number(bowling.economyRate) : null,
        overs: bowling ? Number(bowling.overs) : null,
        fours: batting ? batting.fours : null,
        sixes: batting ? batting.sixes : null,
        howOut: batting ? batting.howOut ?? null : null,
        badUmpireDecision: batting ? batting.badUmpireDecision ?? null : null,
        hatTrick: bowling ? !!bowling.hatTrick : null,
        bowledWickets: bowling ? bowling.bowledWickets : null,
        lbwWickets: bowling ? bowling.lbwWickets : null,
        wouldHaveReferred: bowling ? bowling.wouldHaveReferred ?? null : null,
        catches: fielding ? fielding.catches : null,
        stumpings: fielding ? fielding.stumpings : null,
        droppedCatches: fielding ? fielding.droppedCatches : null,
        missedStumpings: fielding ? fielding.missedStumpings : null,
        result: m.result ?? null,
        playerOfTheMatch: m.playerOfTheMatch ?? false,
      };
    })
  );

  res.json(results);
});

// ── Stats Summary ─────────────────────────────────────────────────────────────

router.get("/stats/summary", async (req, res) => {
  const [matchCount] = await db
    .select({ total: count() })
    .from(matchesTable);

  const battingRows = await db.select().from(battingStatsTable);
  const bowlingRows = await db.select().from(bowlingStatsTable);
  const fieldingRows = await db.select().from(fieldingStatsTable);

  const totalMatches = matchCount.total;

  const battingInnings = battingRows.length;
  const totalRuns = battingRows.reduce((s, r) => s + r.runs, 0);
  const totalBallsFaced = battingRows.reduce((s, r) => s + r.ballsFaced, 0);
  const totalFours = battingRows.reduce((s, r) => s + r.fours, 0);
  const totalSixes = battingRows.reduce((s, r) => s + r.sixes, 0);
  const highScore = battingRows.reduce((m, r) => Math.max(m, r.runs), 0);
  const averageStrikeRate =
    totalBallsFaced > 0
      ? parseFloat(((totalRuns / totalBallsFaced) * 100).toFixed(2))
      : 0;

  const bowlingInnings = bowlingRows.length;
  const totalWickets = bowlingRows.reduce((s, r) => s + r.wickets, 0);
  const totalOvers = bowlingRows.reduce((s, r) => s + Number(r.overs), 0);
  const totalRunsConceded = bowlingRows.reduce((s, r) => s + r.runsConceded, 0);
  const averageEconomyRate =
    totalOvers > 0 ? parseFloat((totalRunsConceded / totalOvers).toFixed(2)) : 0;
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

  const totalCatches = fieldingRows.reduce((s, r) => s + r.catches, 0);
  const totalDroppedCatches = fieldingRows.reduce((s, r) => s + r.droppedCatches, 0);
  const totalRunOuts = fieldingRows.reduce((s, r) => s + r.runOuts, 0);
  const totalStumpings = fieldingRows.reduce((s, r) => s + r.stumpings, 0);

  res.json({
    totalMatches,
    batting: {
      totalRuns,
      totalBallsFaced,
      averageStrikeRate,
      highScore,
      totalFours,
      totalSixes,
      innings: battingInnings,
    },
    bowling: {
      totalWickets,
      totalOvers,
      totalRunsConceded,
      averageEconomyRate,
      bestFigures,
      innings: bowlingInnings,
    },
    fielding: {
      totalCatches,
      totalDroppedCatches,
      totalRunOuts,
      totalStumpings,
    },
  });
});

export default router;
