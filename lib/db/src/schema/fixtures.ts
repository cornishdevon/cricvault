import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fixturesTable = pgTable("fixtures", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time"),
  opponent: text("opponent").notNull(),
  venue: text("venue"),
  matchType: text("match_type").notNull().default("Club"),
  playingFor: text("playing_for"),
  series: text("series"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFixtureSchema = createInsertSchema(fixturesTable).omit({ id: true, createdAt: true });
export type InsertFixture = z.infer<typeof insertFixtureSchema>;
export type Fixture = typeof fixturesTable.$inferSelect;
