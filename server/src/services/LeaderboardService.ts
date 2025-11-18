import { LeaderboardEntry } from '../types/game.types.js';

// Simple in-memory leaderboard (could be replaced with Redis)
export class LeaderboardService {
  private entries: Map<string, LeaderboardEntry> = new Map();

  updatePlayer(playerId: string, username: string, score: number, kills: number, deaths: number): void {
    this.entries.set(playerId, {
      playerId,
      username,
      score,
      kills,
      deaths,
      kd: deaths > 0 ? kills / deaths : kills,
      rank: 0 // Will be set when getting top players
    });
  }

  removePlayer(playerId: string): void {
    this.entries.delete(playerId);
  }

  getTop(limit: number = 10): LeaderboardEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
  }

  clear(): void {
    this.entries.clear();
  }
}
