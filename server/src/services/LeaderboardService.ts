import { LeaderboardEntry } from '../types/game.types.js';
import { databaseService } from './DatabaseService.js';

/**
 * LeaderboardService - Manages leaderboard with persistent storage
 * Uses both in-memory cache for active players and database for persistence
 */
export class LeaderboardService {
  // In-memory cache for active players (playerId -> entry)
  private activeEntries: Map<string, LeaderboardEntry> = new Map();

  /**
   * Update player stats (both in-memory and database)
   */
  updatePlayer(playerId: string, username: string, score: number, kills: number, deaths: number): void {
    // Update in-memory cache
    this.activeEntries.set(playerId, {
      playerId,
      username,
      score,
      kills,
      deaths,
      kd: deaths > 0 ? kills / deaths : kills,
      rank: 0 // Will be set when getting top players
    });

    // Persist to database
    databaseService.savePlayerStats({
      username,
      kills,
      deaths,
      score,
      lastPlayed: Date.now()
    });
  }

  /**
   * Remove player from active entries (but keep in database)
   */
  removePlayer(playerId: string): void {
    const entry = this.activeEntries.get(playerId);
    if (entry) {
      // Save final stats to database before removing from memory
      databaseService.savePlayerStats({
        username: entry.username,
        kills: entry.kills,
        deaths: entry.deaths,
        score: entry.score,
        lastPlayed: Date.now()
      });

      this.activeEntries.delete(playerId);
    }
  }

  /**
   * Get top players from database (persistent leaderboard)
   */
  getTop(limit: number = 10): LeaderboardEntry[] {
    const topPlayers = databaseService.getTopPlayers(limit);

    return topPlayers.map((player, index) => ({
      playerId: '', // Not applicable for database entries
      username: player.username,
      score: player.score,
      kills: player.kills,
      deaths: player.deaths,
      kd: player.deaths > 0 ? player.kills / player.deaths : player.kills,
      rank: index + 1
    }));
  }

  /**
   * Get player stats from database by username
   */
  getPlayerStats(username: string) {
    return databaseService.getPlayerStats(username);
  }

  /**
   * Clear active entries (not database)
   */
  clear(): void {
    // Save all active entries before clearing
    this.activeEntries.forEach(entry => {
      databaseService.savePlayerStats({
        username: entry.username,
        kills: entry.kills,
        deaths: entry.deaths,
        score: entry.score,
        lastPlayed: Date.now()
      });
    });

    this.activeEntries.clear();
  }
}
