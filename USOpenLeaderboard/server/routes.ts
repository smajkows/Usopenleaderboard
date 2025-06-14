import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { golfApiService } from "./services/golfApi";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get leaderboard data
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const participants = await storage.getParticipants();
      const tournamentInfo = await storage.getTournamentInfo();
      
      res.json({
        participants,
        tournamentInfo
      });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard data" });
    }
  });

  // Refresh scores from live data
  app.post("/api/refresh-scores", async (req, res) => {
    try {
      // Get all current golfers
      const golfers = await storage.getGolfers();
      const golferNames = golfers.map(g => g.name);
      
      // Fetch live scores
      const [liveScores, tournamentStatus] = await Promise.all([
        golfApiService.getGolferScores(golferNames),
        golfApiService.getTournamentStatus()
      ]);
      
      // Update golfer scores
      for (const liveScore of liveScores) {
        const golfer = golfers.find(g => g.name === liveScore.name);
        if (golfer) {
          await storage.updateGolfer(golfer.id, {
            scoreToPar: liveScore.scoreToPar,
            missedCut: liveScore.missedCut,
            cutScore: liveScore.cutScore
          });
        }
      }
      
      // Update tournament info
      await storage.updateTournamentInfo(tournamentStatus);
      
      // Recalculate rankings
      await storage.recalculateRankings();
      
      // Return updated data
      const participants = await storage.getParticipants();
      const tournamentInfo = await storage.getTournamentInfo();
      
      res.json({
        participants,
        tournamentInfo,
        message: "Scores updated successfully"
      });
      
    } catch (error) {
      console.error("Error refreshing scores:", error);
      res.status(500).json({ message: "Failed to refresh scores" });
    }
  });

  // Get tournament info
  app.get("/api/tournament-info", async (req, res) => {
    try {
      const tournamentInfo = await storage.getTournamentInfo();
      res.json(tournamentInfo);
    } catch (error) {
      console.error("Error fetching tournament info:", error);
      res.status(500).json({ message: "Failed to fetch tournament info" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
