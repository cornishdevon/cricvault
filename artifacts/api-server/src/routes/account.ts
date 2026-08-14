import { Router, type IRouter } from "express";
import { clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import {
  matchesTable,
  fixturesTable,
  photosTable,
  videosTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(requireAuth);

/**
 * DELETE /account
 *
 * Permanently deletes the signed-in user's account:
 * 1. All their data rows (matches cascade to batting/bowling/fielding
 *    stats and match reports; photos/videos/fixtures deleted directly).
 * 2. Their Clerk user, which invalidates all sessions.
 *
 * Required by App Store guideline 5.1.1(v): apps that support account
 * creation must offer in-app account deletion.
 */
router.delete("/account", async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    await db.transaction(async (tx) => {
      await tx.delete(photosTable).where(eq(photosTable.userId, userId));
      await tx.delete(videosTable).where(eq(videosTable.userId, userId));
      await tx.delete(fixturesTable).where(eq(fixturesTable.userId, userId));
      await tx.delete(matchesTable).where(eq(matchesTable.userId, userId));
    });

    await clerkClient.users.deleteUser(userId);

    return res.status(200).json({ deleted: true });
  } catch (err) {
    console.error("Account deletion failed:", err);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
