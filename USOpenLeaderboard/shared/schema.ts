import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  totalScore: integer("total_score").default(0),
  rank: integer("rank"),
});

export const golfers = pgTable("golfers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  participantId: integer("participant_id").references(() => participants.id),
  scoreToPar: integer("score_to_par").default(0),
  missedCut: boolean("missed_cut").default(false),
  cutScore: integer("cut_score"),
});

export const tournamentInfo = pgTable("tournament_info", {
  id: serial("id").primaryKey(),
  status: text("status").default("In Progress"),
  round: text("round").default("Round 1"),
  cutLine: integer("cut_line"),
  playersMadeCut: integer("players_made_cut"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  rank: true,
});

export const insertGolferSchema = createInsertSchema(golfers).omit({
  id: true,
});

export const insertTournamentInfoSchema = createInsertSchema(tournamentInfo).omit({
  id: true,
});

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Golfer = typeof golfers.$inferSelect;
export type InsertGolfer = z.infer<typeof insertGolferSchema>;
export type TournamentInfo = typeof tournamentInfo.$inferSelect;
export type InsertTournamentInfo = z.infer<typeof insertTournamentInfoSchema>;

export type ParticipantWithGolfers = Participant & {
  golfers: Golfer[];
};
