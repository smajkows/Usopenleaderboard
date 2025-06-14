import { participants, golfers, tournamentInfo, type Participant, type InsertParticipant, type Golfer, type InsertGolfer, type TournamentInfo, type InsertTournamentInfo, type ParticipantWithGolfers } from "@shared/schema";

export interface IStorage {
  // Participants
  getParticipants(): Promise<ParticipantWithGolfers[]>;
  getParticipant(id: number): Promise<ParticipantWithGolfers | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  updateParticipant(id: number, participant: Partial<Participant>): Promise<Participant | undefined>;
  
  // Golfers
  getGolfers(): Promise<Golfer[]>;
  getGolfersByParticipant(participantId: number): Promise<Golfer[]>;
  createGolfer(golfer: InsertGolfer): Promise<Golfer>;
  updateGolfer(id: number, golfer: Partial<Golfer>): Promise<Golfer | undefined>;
  
  // Tournament Info
  getTournamentInfo(): Promise<TournamentInfo | undefined>;
  updateTournamentInfo(info: Partial<TournamentInfo>): Promise<TournamentInfo>;
  
  // Utility
  recalculateRankings(): Promise<void>;
}

export class MemStorage implements IStorage {
  private participants: Map<number, Participant>;
  private golfers: Map<number, Golfer>;
  private tournamentInfo: TournamentInfo | undefined;
  private currentParticipantId: number;
  private currentGolferId: number;

  constructor() {
    this.participants = new Map();
    this.golfers = new Map();
    this.currentParticipantId = 1;
    this.currentGolferId = 1;
    this.initializeData();
  }

  private initializeData() {
    // Initialize tournament info
    this.tournamentInfo = {
      id: 1,
      status: "Round 3 in Progress",
      round: "Round 3",
      cutLine: 3,
      playersMadeCut: 28,
      lastUpdated: new Date(),
    };

    // Initialize participants and their golfers
    const poolData = [
      {
        name: "Joey H",
        golfers: ["Xander Schauffele", "Ben Griffin", "Corey Conners", "Tom Kim"]
      },
      {
        name: "Scott M", 
        golfers: ["Scottie Scheffler", "Viktor Hovland", "Tyrrell Hatton", "Matt Fitzpatrick"]
      },
      {
        name: "Mike S",
        golfers: ["Jon Rahm", "Tommy Fleetwood", "Harris English", "Keegan Bradley"]
      },
      {
        name: "Daniel R",
        golfers: ["Bryson DeChambeau", "Hideki Matsuyama", "Russell Henley", "Justin Rose"]
      },
      {
        name: "Will C",
        golfers: ["Rory McIlroy", "Shane Lowry", "Jordan Spieth", "Tony Finau"]
      },
      {
        name: "Ryan L",
        golfers: ["Collin Morikawa", "Sepp Straka", "Patrick Cantlay", "Patrick Reed"]
      },
      {
        name: "Parker S",
        golfers: ["Joaquin Niemann", "Justin Thomas", "Maverick McNealy", "Aaron Rai"]
      },
      {
        name: "Nick M",
        golfers: ["Ludvig Åberg", "Brooks Koepka", "Sam Burns", "Jason Day"]
      }
    ];

    // Sample scores from design reference
    const sampleScores = {
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
      "Harris English": -7, // Will have MC penalty
      "Keegan Bradley": 0, // Will have MC penalty
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
      "Aaron Rai": -6, // Will have MC penalty
      "Ludvig Åberg": -2,
      "Brooks Koepka": -1,
      "Sam Burns": 0,
      "Jason Day": 0
    };

    const missedCutPlayers = ["Harris English", "Keegan Bradley", "Aaron Rai"];

    poolData.forEach((participant) => {
      const participantId = this.currentParticipantId++;
      const participantObj: Participant = {
        id: participantId,
        name: participant.name,
        totalScore: 0,
        rank: null,
      };
      
      this.participants.set(participantId, participantObj);

      participant.golfers.forEach((golferName) => {
        const golferId = this.currentGolferId++;
        const basScore = sampleScores[golferName] || 0;
        const missedCut = missedCutPlayers.includes(golferName);
        const finalScore = missedCut ? basScore + 20 : basScore;
        
        const golfer: Golfer = {
          id: golferId,
          name: golferName,
          participantId: participantId,
          scoreToPar: finalScore,
          missedCut: missedCut,
          cutScore: missedCut ? basScore : null,
        };
        
        this.golfers.set(golferId, golfer);
      });
    });

    this.recalculateRankings();
  }

  async getParticipants(): Promise<ParticipantWithGolfers[]> {
    const participants = Array.from(this.participants.values());
    const result: ParticipantWithGolfers[] = [];
    
    for (const participant of participants) {
      const golfers = await this.getGolfersByParticipant(participant.id);
      result.push({ ...participant, golfers });
    }
    
    return result.sort((a, b) => (a.rank || 0) - (b.rank || 0));
  }

  async getParticipant(id: number): Promise<ParticipantWithGolfers | undefined> {
    const participant = this.participants.get(id);
    if (!participant) return undefined;
    
    const golfers = await this.getGolfersByParticipant(id);
    return { ...participant, golfers };
  }

  async createParticipant(participant: InsertParticipant): Promise<Participant> {
    const id = this.currentParticipantId++;
    const newParticipant: Participant = { ...participant, id, rank: null };
    this.participants.set(id, newParticipant);
    return newParticipant;
  }

  async updateParticipant(id: number, participant: Partial<Participant>): Promise<Participant | undefined> {
    const existing = this.participants.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...participant };
    this.participants.set(id, updated);
    return updated;
  }

  async getGolfers(): Promise<Golfer[]> {
    return Array.from(this.golfers.values());
  }

  async getGolfersByParticipant(participantId: number): Promise<Golfer[]> {
    return Array.from(this.golfers.values()).filter(
      golfer => golfer.participantId === participantId
    );
  }

  async createGolfer(golfer: InsertGolfer): Promise<Golfer> {
    const id = this.currentGolferId++;
    const newGolfer: Golfer = { ...golfer, id };
    this.golfers.set(id, newGolfer);
    return newGolfer;
  }

  async updateGolfer(id: number, golfer: Partial<Golfer>): Promise<Golfer | undefined> {
    const existing = this.golfers.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...golfer };
    this.golfers.set(id, updated);
    return updated;
  }

  async getTournamentInfo(): Promise<TournamentInfo | undefined> {
    return this.tournamentInfo;
  }

  async updateTournamentInfo(info: Partial<TournamentInfo>): Promise<TournamentInfo> {
    this.tournamentInfo = { 
      ...this.tournamentInfo!, 
      ...info,
      lastUpdated: new Date()
    };
    return this.tournamentInfo;
  }

  async recalculateRankings(): Promise<void> {
    // Calculate total scores for each participant
    for (const [participantId, participant] of this.participants) {
      const golfers = await this.getGolfersByParticipant(participantId);
      const totalScore = golfers.reduce((sum, golfer) => sum + (golfer.scoreToPar || 0), 0);
      participant.totalScore = totalScore;
    }

    // Sort participants by total score (lowest wins)
    const sortedParticipants = Array.from(this.participants.values())
      .sort((a, b) => a.totalScore - b.totalScore);

    // Assign ranks
    sortedParticipants.forEach((participant, index) => {
      participant.rank = index + 1;
      this.participants.set(participant.id, participant);
    });
  }
}

export const storage = new MemStorage();
