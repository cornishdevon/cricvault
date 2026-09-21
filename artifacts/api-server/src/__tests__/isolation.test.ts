/**
 * Per-user data isolation integration tests.
 *
 * Clerk's getAuth is mocked so requests authenticate via an `x-test-user`
 * header; everything else (Express app, routers, Drizzle, Postgres) is real.
 * OWNER_EMAIL is cleared so the legacy-claim logic never runs for test users.
 */
process.env.OWNER_EMAIL = "";

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { Request } from "express";

vi.mock("@clerk/express", () => ({
  getAuth: (req: Request) => ({
    userId: (req.headers["x-test-user"] as string | undefined) || null,
    sessionClaims: undefined,
  }),
  clerkClient: { users: { getUser: async () => ({ emailAddresses: [] }) } },
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import express from "express";
import router from "../routes";
import { db, matchesTable, bowlingStatsTable, photosTable, objectUploadsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { signObjectToken } from "../lib/signedObjectUrls";

const USER_A = "user_test_isolation_a";
const USER_B = "user_test_isolation_b";

let server: import("http").Server;
let base: string;

async function api(
  path: string,
  opts: { method?: string; user?: string; body?: unknown } = {},
) {
  const res = await fetch(`${base}/api${path}`, {
    method: opts.method ?? "GET",
    headers: {
      ...(opts.user ? { "x-test-user": opts.user } : {}),
      ...(opts.body !== undefined ? { "content-type": "application/json" } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, data, headers: res.headers };
}

async function cleanup() {
  await db.delete(photosTable).where(inArray(photosTable.userId, [USER_A, USER_B]));
  await db.delete(matchesTable).where(inArray(matchesTable.userId, [USER_A, USER_B]));
  await db.delete(objectUploadsTable).where(inArray(objectUploadsTable.userId, [USER_A, USER_B]));
}

beforeAll(async () => {
  await cleanup();
  const app = express();
  app.use(express.json());
  app.use("/api", router);
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const addr = server.address();
  if (typeof addr === "object" && addr) base = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await cleanup();
  server?.close();
});

describe("unauthenticated access", () => {
  it("serves anonymous liveness checks without exposing data", async () => {
    for (const path of ["", "/", "/healthz"]) {
      const res = await api(path);
      expect(res.status, path).toBe(200);
      expect(res.data).toEqual({ status: "ok" });
      expect(res.headers.get("cache-control")).toBe("no-store");
    }
  });

  it("rejects all data routes with 401", async () => {
    for (const path of ["/matches", "/fixtures", "/stats/per-match", "/media/photos", "/media/videos"]) {
      const res = await api(path);
      expect(res.status, path).toBe(401);
    }
  });

  it("rejects private object streaming without a token", async () => {
    const res = await api("/storage/objects/uploads/some-uuid");
    expect(res.status).toBe(401);
  });

  it("rejects private object streaming with a tampered or mismatched token", async () => {
    const wrongPath = signObjectToken("/objects/uploads/other-object");
    const res = await api(`/storage/objects/uploads/some-uuid?token=${wrongPath}`);
    expect(res.status).toBe(401);
    const tampered = await api(`/storage/objects/uploads/some-uuid?token=123.abc`);
    expect(tampered.status).toBe(401);
  });
});

describe("two-account isolation", () => {
  let matchIdA: number;

  it("user A can create and read their own match", async () => {
    const created = await api("/matches", {
      method: "POST",
      user: USER_A,
      body: { date: "2026-08-18", opponent: "Isolation Test XI", matchType: "T20" },
    });
    expect(created.status).toBe(201);
    matchIdA = (created.data as { id: number }).id;

    const list = await api("/matches", { user: USER_A });
    expect(list.status).toBe(200);
    expect((list.data as Array<{ id: number }>).some((m) => m.id === matchIdA)).toBe(true);
  });

  it("persists, validates, and clears a bowling wicket map", async () => {
    const match = await api("/matches", {
      method: "POST",
      user: USER_A,
      body: { date: "2026-08-19", opponent: "Wicket Map Test XI", matchType: "T20" },
    });
    expect(match.status).toBe(201);
    const wicketMatchId = (match.data as { id: number }).id;
    const wicketMap = JSON.stringify([
      {
        id: "wicket-1",
        kind: "caught",
        x: 0.25,
        y: 0.75,
        batter: "Alex Batter",
        over: "4.5",
        note: "Taken cleanly at slip",
      },
      { id: "wicket-2", kind: "bowled", x: 1, y: 0 },
      { id: "wicket-3", kind: "lbw", x: 0.5, y: 0.4, batter: "Sam Batter", over: "0" },
    ]);
    const bowlingWithMap = {
      overs: 4,
      maidens: 0,
      runsConceded: 20,
      wickets: 3,
      bowledWickets: 1,
      lbwWickets: 1,
      wicketMap,
    };
    for (const totals of [
      { wickets: 2, bowledWickets: 1, lbwWickets: 1 },
      { wickets: 3, bowledWickets: 0, lbwWickets: 1 },
      { wickets: 3, bowledWickets: 1, lbwWickets: 0 },
      { wickets: 3, bowledWickets: 2, lbwWickets: 2 },
    ]) {
      const inconsistent = await api(`/matches/${wicketMatchId}/bowling`, {
        method: "POST",
        user: USER_A,
        body: { ...bowlingWithMap, ...totals },
      });
      expect(inconsistent.status).toBe(400);
    }
    const created = await api(`/matches/${wicketMatchId}/bowling`, {
      method: "POST",
      user: USER_A,
      body: bowlingWithMap,
    });
    expect(created.status).toBe(201);
    expect((created.data as { wicketMap: string }).wicketMap).toBe(wicketMap);
    expect((created.data as { lbwWickets: number }).lbwWickets).toBe(1);

    const fetched = await api(`/matches/${wicketMatchId}/bowling`, { user: USER_A });
    expect(fetched.status).toBe(200);
    expect((fetched.data as { wicketMap: string }).wicketMap).toBe(wicketMap);

    const perMatch = await api("/stats/per-match", { user: USER_A });
    expect(perMatch.status).toBe(200);
    const perMatchRows = perMatch.data as Array<{ matchId: number; wicketMap: string | null }>;
    expect(perMatchRows.find((row) => row.matchId === wicketMatchId)?.wicketMap).toBe(wicketMap);
    expect(perMatchRows.find((row) => row.matchId === matchIdA)?.wicketMap).toBeNull();

    const patched = await api(`/matches/${wicketMatchId}/bowling`, {
      method: "PATCH",
      user: USER_A,
      body: { lbwWickets: 1 },
    });
    expect(patched.status).toBe(200);
    expect((patched.data as { lbwWickets: number }).lbwWickets).toBe(1);
    expect((patched.data as { wicketMap: string }).wicketMap).toBe(wicketMap);

    const legacyWicketMap = JSON.stringify([
      { id: "wicket-1", kind: "caught", x: 0.25, y: 0.75, over: 4 },
      { id: "wicket-2", kind: "bowled", x: 1, y: 0 },
      { id: "wicket-3", kind: "lbw", x: 0.5, y: 0.4 },
    ]);
    await db
      .update(bowlingStatsTable)
      .set({ wicketMap: legacyWicketMap })
      .where(eq(bowlingStatsTable.matchId, wicketMatchId));

    const legacyPatched = await api(`/matches/${wicketMatchId}/bowling`, {
      method: "PATCH",
      user: USER_A,
      body: { maidens: 1 },
    });
    expect(legacyPatched.status).toBe(200);
    expect((legacyPatched.data as { wicketMap: string }).wicketMap).toBe(legacyWicketMap);

    const explicitLegacyMap = await api(`/matches/${wicketMatchId}/bowling`, {
      method: "PATCH",
      user: USER_A,
      body: { wicketMap: legacyWicketMap },
    });
    expect(explicitLegacyMap.status).toBe(400);

    for (const updates of [
      { wickets: 2 },
      { bowledWickets: 0 },
      { lbwWickets: 0 },
      { wickets: 3, bowledWickets: 2, lbwWickets: 2 },
    ]) {
      const inconsistent = await api(`/matches/${wicketMatchId}/bowling`, {
        method: "PATCH",
        user: USER_A,
        body: updates,
      });
      expect(inconsistent.status).toBe(400);
    }

    for (const invalidMap of [
      "not-json",
      JSON.stringify({ id: "wicket-1", kind: "caught", x: 0.25, y: 0.75 }),
      JSON.stringify([{ id: "wicket-1", kind: "stumped", x: 0.25, y: 0.75 }]),
      JSON.stringify([{ id: "wicket-1", kind: "caught", x: 1.1, y: 0.75 }]),
      JSON.stringify([{ id: "wicket-1", kind: "caught", x: 0.25, y: null }]),
      JSON.stringify([{ id: "wicket-1", kind: "caught", x: 0.25, y: 0.75, over: "4.6" }]),
      JSON.stringify([{ id: "wicket-1", kind: "caught", x: 0.25, y: 0.75, over: "-1" }]),
      JSON.stringify([{ id: "wicket-1", kind: "caught", x: 0.25, y: 0.75, note: "n".repeat(1001) }]),
      JSON.stringify(Array.from({ length: 101 }, (_, i) => ({ id: String(i), kind: "caught", x: 0.5, y: 0.5 }))),
    ]) {
      const invalid = await api(`/matches/${wicketMatchId}/bowling`, {
        method: "PATCH",
        user: USER_A,
        body: { wicketMap: invalidMap },
      });
      expect(invalid.status).toBe(400);
    }

    const cleared = await api(`/matches/${wicketMatchId}/bowling`, {
      method: "PATCH",
      user: USER_A,
      body: { wicketMap: null },
    });
    expect(cleared.status).toBe(200);
    expect((cleared.data as { wicketMap: string | null }).wicketMap).toBeNull();
  });

  it("user B starts at zero and cannot see user A's data", async () => {
    const list = await api("/matches", { user: USER_B });
    expect(list.status).toBe(200);
    expect(list.data).toEqual([]);

    const perMatch = await api("/stats/per-match", { user: USER_B });
    expect(perMatch.status).toBe(200);
    expect(perMatch.data).toEqual([]);

    const photos = await api("/media/photos", { user: USER_B });
    expect(photos.data).toEqual([]);
    const videos = await api("/media/videos", { user: USER_B });
    expect(videos.data).toEqual([]);
  });

  it("user B cannot read, edit, or attach stats to user A's match by id", async () => {
    expect((await api(`/matches/${matchIdA}`, { user: USER_B })).status).toBe(404);
    expect(
      (await api(`/matches/${matchIdA}`, { method: "PATCH", user: USER_B, body: { opponent: "Hacked" } })).status,
    ).toBe(404);
    expect((await api(`/matches/${matchIdA}/batting`, { user: USER_B })).status).toBe(404);
    expect(
      (await api(`/matches/${matchIdA}/batting`, {
        method: "POST",
        user: USER_B,
        body: { runs: 100, ballsFaced: 50, fours: 10, sixes: 5 },
      })).status,
    ).toBe(404);
    expect(
      (await api(`/matches/${matchIdA}/bowling`, {
        method: "POST",
        user: USER_B,
        body: { overs: 1, maidens: 0, runsConceded: 0, wickets: 0, wicketMap: "[]" },
      })).status,
    ).toBe(404);
    expect(
      (await api(`/matches/${matchIdA}/bowling`, {
        method: "PATCH",
        user: USER_B,
        body: {
          wicketMap: JSON.stringify([
            { id: "wicket-1", kind: "caught", x: 0.25, y: 0.75, over: "4.5" },
          ]),
        },
      })).status,
    ).toBe(404);
    expect((await api(`/matches/${matchIdA}/photos`, { user: USER_B })).status).toBe(404);
    expect((await api(`/matches/${matchIdA}/videos`, { user: USER_B })).status).toBe(404);

    // Deleting another user's match silently affects nothing.
    await api(`/matches/${matchIdA}`, { method: "DELETE", user: USER_B });
    const [still] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchIdA));
    expect(still).toBeDefined();
    expect(still.userId).toBe(USER_A);
  });

  const OBJECT_PATH = "/objects/uploads/test-isolation-photo";

  it("media URLs returned to the owner carry a signed token; the raw path alone is rejected", async () => {
    // Simulate the upload-URL issuance binding the object to user A.
    await db
      .insert(objectUploadsTable)
      .values({ objectPath: OBJECT_PATH, userId: USER_A })
      .onConflictDoNothing();

    const created = await api(`/matches/${matchIdA}/photos`, {
      method: "POST",
      user: USER_A,
      body: { url: `/api/storage${OBJECT_PATH}` },
    });
    expect(created.status).toBe(201);
    const url = (created.data as { url: string }).url;
    expect(url).toContain("token=");

    // Without the token the storage route refuses to stream.
    const bare = await api("/storage/objects/uploads/test-isolation-photo");
    expect(bare.status).toBe(401);

    // With the owner's valid token, authorization passes — the request reaches
    // object retrieval (404 here because no real object exists in storage).
    const token = new URL(url, "http://x").searchParams.get("token");
    const streamed = await api(`/storage/objects/uploads/test-isolation-photo?token=${token}`);
    expect([200, 404, 500]).toContain(streamed.status);
    expect(streamed.status).not.toBe(401);
  });

  it("user B cannot turn user A's object path into a media row (and thus a signed URL)", async () => {
    for (const [path, body] of [
      ["/media/photos", { url: `/api/storage${OBJECT_PATH}` }],
      ["/media/videos", { objectPath: `/api/storage${OBJECT_PATH}` }],
    ] as const) {
      const res = await api(path, { method: "POST", user: USER_B, body });
      expect(res.status, path).toBe(403);
    }
    // An object path never uploaded by anyone is rejected too.
    const unknown = await api("/media/photos", {
      method: "POST",
      user: USER_B,
      body: { url: "/api/storage/objects/uploads/never-uploaded" },
    });
    expect(unknown.status).toBe(403);
    // External (non-private-object) URLs remain allowed.
    const external = await api("/media/photos", {
      method: "POST",
      user: USER_B,
      body: { url: "https://example.com/photo.jpg" },
    });
    expect(external.status).toBe(201);
  });
});
