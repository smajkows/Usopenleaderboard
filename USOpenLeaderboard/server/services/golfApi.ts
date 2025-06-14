// Golf API service for fetching live tournament data
// In a real implementation, this would connect to PGA Tour API or similar

export interface GolferScore {
  name: string;
  scoreToPar: number;
  missedCut: boolean;
  cutScore?: number;
}

export interface TournamentStatus {
  status: string;
  round: string;
  cutLine: number;
  playersMadeCut: number;
}

export class GolfApiService {
  private apiKey: string;
  private apiHost: string;

  constructor() {
    this.apiKey = "6707052a3fmshfde39ec4b1992bfp11a59bjsn224932e2bdb9";
    this.apiHost = "golf-leaderboard-data.p.rapidapi.com";
  }

  async getTournamentStatus(): Promise<TournamentStatus> {
    try {
      const response = await fetch(`https://${this.apiHost}/leaderboard/759`, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': this.apiHost,
          'x-rapidapi-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Tournament API Response sample:", JSON.stringify(data, null, 2).substring(0, 500));

      // Parse the API response structure
      const tournament = data.results?.tournament || data.tournament || {};
      const leaderboard = data.results?.leaderboard || data.leaderboard || [];
      
      // Count players who made the cut
      const playersMadeCut = leaderboard.filter((player: any) => 
        player.status !== "cut" && player.status !== "wd" && player.status !== "dq"
      ).length;

      return {
        status: tournament.status || "In Progress",
        round: `Round ${tournament.current_round || 1}`,
        cutLine: tournament.cut_line || 0,
        playersMadeCut: playersMadeCut
      };
    } catch (error) {
      console.error("Error fetching tournament status:", error);
      throw new Error("Failed to fetch tournament status from API");
    }
  }

  async getGolferScores(golferNames: string[]): Promise<GolferScore[]> {
    try {
      const response = await fetch(`https://${this.apiHost}/leaderboard/759`, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': this.apiHost,
          'x-rapidapi-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Leaderboard API Response sample:", JSON.stringify(data, null, 2).substring(0, 1000));

      // Extract player data from API response using the actual structure
      const leaderboard = data.results?.leaderboard || [];
      
      const scores: GolferScore[] = golferNames.map(golferName => {
        // Find golfer in API response using the actual API structure
        const apiPlayer = leaderboard.find((p: any) => {
          const fullName = `${p.first_name} ${p.last_name}`;
          return this.normalizePlayerName(fullName) === this.normalizePlayerName(golferName);
        });

        if (apiPlayer) {
          const scoreToPar = apiPlayer.total_to_par || 0;
          const missedCut = apiPlayer.status === "cut" || apiPlayer.status === "wd" || apiPlayer.status === "dq";
          
          return {
            name: golferName,
            scoreToPar: missedCut ? scoreToPar + 20 : scoreToPar,
            missedCut,
            cutScore: missedCut ? scoreToPar : undefined
          };
        } else {
          // Player not found in API response
          console.warn(`Player ${golferName} not found in API response`);
          return {
            name: golferName,
            scoreToPar: 0,
            missedCut: false
          };
        }
      });
      
      return scores;
    } catch (error) {
      console.error("Error fetching golfer scores from API:", error);
      throw new Error("Failed to fetch golfer scores from API");
    }
  }

  private normalizePlayerName(name: string): string {
    return name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  }

  private getBaseScore(golferName: string): number {
    // Base scores from the design reference
    const baseScores: Record<string, number> = {
      "Xander Schauffele": -4,
      "Ben Griffin": -3,
      "Corey Conners": -3,
      "Tom Kim": -2,
      "Scottie Scheffler": -5,
      "Viktor Hovland": -2,
      "Tyrrell Hatton": -1,
      "Matt Fitzpatrick": -1,
      "Jon Rahm": 0,
      "Tommy Fleetwood": 2,
      "Harris English": -7,
      "Keegan Bradley": 0,
      "Bryson DeChambeau": -2,
      "Hideki Matsuyama": -1,
      "Russell Henley": -1,
      "Justin Rose": 0,
      "Rory McIlroy": -3,
      "Shane Lowry": -2,
      "Jordan Spieth": -1,
      "Tony Finau": -1,
      "Collin Morikawa": -2,
      "Sepp Straka": -2,
      "Patrick Cantlay": -1,
      "Patrick Reed": -1,
      "Joaquin Niemann": -1,
      "Justin Thomas": 0,
      "Maverick McNealy": 3,
      "Aaron Rai": -6,
      "Ludvig Åberg": -2,
      "Brooks Koepka": -1,
      "Sam Burns": 0,
      "Jason Day": 0
    };
    
    return baseScores[golferName] || 0;
  }

  private isMissedCut(golferName: string): boolean {
    const missedCutPlayers = ["Harris English", "Keegan Bradley", "Aaron Rai"];
    return missedCutPlayers.includes(golferName);
  }
}

export const golfApiService = new GolfApiService();
