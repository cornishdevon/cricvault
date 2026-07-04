import { Router } from "express";
import { db } from "@workspace/db";
import { fixturesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

router.get("/fixtures", async (_req, res) => {
  const fixtures = await db
    .select()
    .from(fixturesTable)
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
    .where(eq(fixturesTable.id, id))
    .returning();
  if (!fixture) return res.status(404).json({ error: "Fixture not found" });
  res.json({ ...fixture, createdAt: fixture.createdAt.toISOString() });
});

router.delete("/fixtures/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(fixturesTable).where(eq(fixturesTable.id, id));
  res.status(204).send();
});

export default router;
