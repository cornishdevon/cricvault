import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { matchesTable, fixturesTable, photosTable, videosTable } from "@workspace/db";
import { isNull, eq, or, sql, count } from "drizzle-orm";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Legacy data claim: rows created before auth existed have user_id NULL.
// Only the account whose email matches OWNER_EMAIL may claim them — any
// other account always starts at zero.
//
// MISCLAIMED_USER_ID: an account that briefly auto-claimed the legacy rows
// under the old "first sign-in wins" rule (2026-08-05). Its rows are folded
// back into the owner's claim exactly once, when the owner first signs in.
const OWNER_EMAIL = process.env.OWNER_EMAIL?.trim().toLowerCase();
const MISCLAIMED_USER_ID = "user_3HW9H2i14lzBZMco5csGLAbcQqA";

const LEGACY_CLAIM_LOCK_KEY = 874_512_331;

let legacyClaimDone = false;
const checkedNonOwners = new Set<string>();

// Called after a data import replaces rows with user_id NULL, so the owner's
// next request re-runs the claim.
export function resetLegacyClaimState(): void {
  legacyClaimDone = false;
  checkedNonOwners.clear();
}

async function isOwner(userId: string): Promise<boolean> {
  if (!OWNER_EMAIL) return false;
  const user = await clerkClient.users.getUser(userId);
  return user.emailAddresses.some(
    (e) => e.emailAddress.toLowerCase() === OWNER_EMAIL,
  );
}

async function claimLegacyRows(userId: string): Promise<void> {
  if (legacyClaimDone || !OWNER_EMAIL || checkedNonOwners.has(userId)) return;

  if (!(await isOwner(userId))) {
    checkedNonOwners.add(userId);
    return;
  }

  // Atomic: a Postgres advisory lock serializes concurrent sign-ins (even
  // across server instances), and the ownership check re-runs inside the
  // same transaction, so the claim can only ever happen once.
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${LEGACY_CLAIM_LOCK_KEY})`);
    const [owned] = await tx
      .select({ total: count() })
      .from(matchesTable)
      .where(eq(matchesTable.userId, userId));
    if (owned.total === 0) {
      await tx.update(matchesTable).set({ userId })
        .where(or(isNull(matchesTable.userId), eq(matchesTable.userId, MISCLAIMED_USER_ID)));
      await tx.update(fixturesTable).set({ userId })
        .where(or(isNull(fixturesTable.userId), eq(fixturesTable.userId, MISCLAIMED_USER_ID)));
      await tx.update(photosTable).set({ userId })
        .where(or(isNull(photosTable.userId), eq(photosTable.userId, MISCLAIMED_USER_ID)));
      await tx.update(videosTable).set({ userId })
        .where(or(isNull(videosTable.userId), eq(videosTable.userId, MISCLAIMED_USER_ID)));
    }
  });
  legacyClaimDone = true;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);
    const userId = (auth?.sessionClaims?.userId as string | undefined) || auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.userId = userId;
    await claimLegacyRows(userId);
    return next();
  } catch (err) {
    req.log?.error({ err }, "requireAuth failed");
    return res.status(401).json({ error: "Unauthorized" });
  }
}
