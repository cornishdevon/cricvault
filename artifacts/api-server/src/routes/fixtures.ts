import { Router } from "express";
import { db } from "@workspace/db";
import { fixturesTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/fixtures", async (req, res) => {
  const fixtures = await db
    .select()
    .from(fixturesTable)
    .where(eq(fixturesTable.userId, req.userId!))
    .orderBy(asc(fixturesTable.date));
  res.json(fixtures.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })));
});

router.post("/fixtures", async (req, res) => {
  const { date, time, opponent, venue, matchType, playingFor, series, notes } = req.body;
  if (!date || !opponent) {
    return res.status(400).json({ error: "date and opponent are required" });
  }
  const [fixture] = await db
    .insert(fixturesTable)
    .values({
      userId: req.userId!,
      date,
      time: time ?? null,
      opponent,
      venue: venue ?? null,
      matchType: matchType ?? "Club",
      playingFor: playingFor ?? null,
      series: series ?? null,
      notes: notes ?? null,
    })
    .returning();
  res.status(201).json({ ...fixture, createdAt: fixture.createdAt.toISOString() });
});

router.patch("/fixtures/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { date, time, opponent, venue, matchType, playingFor, series, notes } = req.body;
  const [fixture] = await db
    .update(fixturesTable)
    .set({
      ...(date !== undefined && { date }),
      ...(time !== undefined && { time: time ?? null }),
      ...(opponent !== undefined && { opponent }),
      ...(venue !== undefined && { venue: venue ?? null }),
      ...(matchType !== undefined && { matchType }),
      ...(playingFor !== undefined && { playingFor: playingFor ?? null }),
      ...(series !== undefined && { series: series ?? null }),
      ...(notes !== undefined && { notes: notes ?? null }),
    })
    .where(and(eq(fixturesTable.id, id), eq(fixturesTable.userId, req.userId!)))
    .returning();
  if (!fixture) return res.status(404).json({ error: "Fixture not found" });
  res.json({ ...fixture, createdAt: fixture.createdAt.toISOString() });
});

router.delete("/fixtures/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db
    .delete(fixturesTable)
    .where(and(eq(fixturesTable.id, id), eq(fixturesTable.userId, req.userId!)));
  res.status(204).send();
});

export default router;
