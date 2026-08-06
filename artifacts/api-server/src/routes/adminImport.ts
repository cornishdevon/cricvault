import { Router, type IRouter, json } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { resetLegacyClaimState } from "../middlewares/requireAuth";

// One-time data migration endpoint: replaces all cricket data with a supplied
// dump (used to copy the development database's full history into production,
// where direct SQL access is read-only). Guarded by DATA_IMPORT_TOKEN; rows are
// imported with user_id NULL so the OWNER_EMAIL claim in requireAuth assigns
// them to the owner's account on their next signed-in request.
//
// Safe to leave mounted: without a matching token header it always 404s.

const router: IRouter = Router();

// Parents first for insert; deleted in reverse order (children first).
const TABLES = [
  "matches",
  "fixtures",
  "batting_stats",
  "bowling_stats",
  "fielding_stats",
  "match_reports",
  "photos",
  "videos",
] as const;
const IDENT_RE = /^[a-z_][a-z0-9_]*$/;

router.post("/admin/import-data", json({ limit: "20mb" }), async (req, res) => {
  const token = process.env.DATA_IMPORT_TOKEN;
  if (!token || req.get("x-import-token") !== token) {
    return res.status(404).json({ error: "Not found" });
  }

  const dump = req.body as Record<string, { columns: string[]; rows: unknown[][] }>;
  for (const t of TABLES) {
    if (!dump[t] || !Array.isArray(dump[t].columns) || !Array.isArray(dump[t].rows)) {
      return res.status(400).json({ error: `Missing table in dump: ${t}` });
    }
    if (!dump[t].columns.every((c) => IDENT_RE.test(c))) {
      return res.status(400).json({ error: `Bad column name in ${t}` });
    }
  }

  try {
    const counts: Record<string, number> = {};
    await db.transaction(async (tx) => {
      for (const t of [...TABLES].reverse()) {
        await tx.execute(sql.raw(`DELETE FROM ${t}`));
      }
      for (const t of TABLES) {
        const { columns, rows } = dump[t];
        // Import ownership-scoped tables with user_id NULL so the owner claim
        // (email-gated) assigns them on the owner's next request.
        const userIdIdx = columns.indexOf("user_id");
        for (const row of rows) {
          const values = row.map((v, i) =>
            i === userIdIdx ? sql`${null}` : sql`${v}`,
          );
          await tx.execute(
            sql`INSERT INTO ${sql.raw(t)} (${sql.raw(columns.join(", "))}) VALUES (${sql.join(values, sql`, `)})`,
          );
        }
        counts[t] = rows.length;
        if (columns.includes("id")) {
          await tx.execute(
            sql.raw(
              `SELECT setval(pg_get_serial_sequence('${t}', 'id'), GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${t}), 1))`,
            ),
          );
        }
      }
    });
    resetLegacyClaimState();
    return res.json({ ok: true, imported: counts });
  } catch (err) {
    req.log?.error({ err }, "import failed");
    return res.status(500).json({ error: "Import failed" });
  }
});

export default router;
