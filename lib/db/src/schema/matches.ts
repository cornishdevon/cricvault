import { pgTable, serial, text, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  opponent: text("opponent").notNull(),
  venue: text("venue"),
  matchType: text("match_type").notNull().default("Club"),
  result: text("result"),
  playerOfTheMatch: boolean("player_of_the_match").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;

export const battingStatsTable = pgTable("batting_stats", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matchesTable.id, { onDelete: "cascade" }),
  runs: integer("runs").notNull().default(0),
  ballsFaced: integer("balls_faced").notNull().default(0),
  fours: integer("fours").notNull().default(0),
  sixes: integer("sixes").notNull().default(0),
  strikeRate: numeric("strike_rate", { precision: 6, scale: 2 }).notNull().default("0"),
  battingPosition: integer("batting_position"),
  howOut: text("how_out"),
});

export const insertBattingStatsSchema = createInsertSchema(battingStatsTable).omit({ id: true });
export type InsertBattingStats = z.infer<typeof insertBattingStatsSchema>;
export type BattingStats = typeof battingStatsTable.$inferSelect;

export const bowlingStatsTable = pgTable("bowling_stats", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matchesTable.id, { onDelete: "cascade" }),
  overs: numeric("overs", { precision: 5, scale: 1 }).notNull().default("0"),
  maidens: integer("maidens").notNull().default(0),
  runsConceded: integer("runs_conceded").notNull().default(0),
  wickets: integer("wickets").notNull().default(0),
  economyRate: numeric("economy_rate", { precision: 6, scale: 2 }).notNull().default("0"),
  noBalls: integer("no_balls").notNull().default(0),
  wides: integer("wides").notNull().default(0),
  hatTrick: integer("hat_trick").notNull().default(0),
  bowledWickets: integer("bowled_wickets").notNull().default(0),
  lbwWickets: integer("lbw_wickets").notNull().default(0),
});

export const insertBowlingStatsSchema = createInsertSchema(bowlingStatsTable).omit({ id: true });
export type InsertBowlingStats = z.infer<typeof insertBowlingStatsSchema>;
export type BowlingStats = typeof bowlingStatsTable.$inferSelect;

export const fieldingStatsTable = pgTable("fielding_stats", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matchesTable.id, { onDelete: "cascade" }),
  catches: integer("catches").notNull().default(0),
  droppedCatches: integer("dropped_catches").notNull().default(0),
  runOuts: integer("run_outs").notNull().default(0),
  stumpings: integer("stumpings").notNull().default(0),
  missedStumpings: integer("missed_stumpings").notNull().default(0),
});

export const insertFieldingStatsSchema = createInsertSchema(fieldingStatsTable).omit({ id: true });
export type InsertFieldingStats = z.infer<typeof insertFieldingStatsSchema>;
export type FieldingStats = typeof fieldingStatsTable.$inferSelect;

export const matchReportsTable = pgTable("match_reports", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matchesTable.id, { onDelete: "cascade" }),
  notes: text("notes"),
  areasToImprove: text("areas_to_improve"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMatchReportSchema = createInsertSchema(matchReportsTable).omit({ id: true, updatedAt: true });
export type InsertMatchReport = z.infer<typeof insertMatchReportSchema>;
export type MatchReport = typeof matchReportsTable.$inferSelect;

export const photosTable = pgTable("photos", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matchesTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPhotoSchema = createInsertSchema(photosTable).omit({ id: true, createdAt: true });
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photosTable.$inferSelect;

export const coachingTipsTable = pgTable("coaching_tips", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  tip: text("tip").notNull(),
  detail: text("detail"),
});

export const insertCoachingTipSchema = createInsertSchema(coachingTipsTable).omit({ id: true });
export type InsertCoachingTip = z.infer<typeof insertCoachingTipSchema>;
export type CoachingTip = typeof coachingTipsTable.$inferSelect;
