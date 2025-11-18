import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PlayerStats {
  username: string;
  kills: number;
  deaths: number;
  score: number;
  lastPlayed: number;
}

/**
 * DatabaseService - Manages SQLite database for persistent player stats
 */
export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath?: string) {
    // Default to data/voxelwars.db in the project root
    const defaultPath = path.join(__dirname, '../../data/voxelwars.db');
    this.db = new Database(dbPath || defaultPath);

    this.initializeSchema();
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        username TEXT PRIMARY KEY,
        kills INTEGER DEFAULT 0,
        deaths INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        last_played INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_score ON players(score DESC);
      CREATE INDEX IF NOT EXISTS idx_last_played ON players(last_played DESC);
    `);
  }

  /**
   * Get player stats by username
   */
  getPlayerStats(username: string): PlayerStats | null {
    const stmt = this.db.prepare(`
      SELECT username, kills, deaths, score, last_played as lastPlayed
      FROM players
      WHERE username = ?
    `);

    return stmt.get(username) as PlayerStats | null;
  }

  /**
   * Save or update player stats
   */
  savePlayerStats(stats: PlayerStats): void {
    const stmt = this.db.prepare(`
      INSERT INTO players (username, kills, deaths, score, last_played)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        kills = excluded.kills,
        deaths = excluded.deaths,
        score = excluded.score,
        last_played = excluded.last_played
    `);

    stmt.run(
      stats.username,
      stats.kills,
      stats.deaths,
      stats.score,
      stats.lastPlayed
    );
  }

  /**
   * Get top players by score
   */
  getTopPlayers(limit: number = 10): PlayerStats[] {
    const stmt = this.db.prepare(`
      SELECT username, kills, deaths, score, last_played as lastPlayed
      FROM players
      ORDER BY score DESC, kills DESC
      LIMIT ?
    `);

    return stmt.all(limit) as PlayerStats[];
  }

  /**
   * Get all player stats
   */
  getAllPlayers(): PlayerStats[] {
    const stmt = this.db.prepare(`
      SELECT username, kills, deaths, score, last_played as lastPlayed
      FROM players
      ORDER BY score DESC
    `);

    return stmt.all() as PlayerStats[];
  }

  /**
   * Delete a player's stats
   */
  deletePlayer(username: string): void {
    const stmt = this.db.prepare('DELETE FROM players WHERE username = ?');
    stmt.run(username);
  }

  /**
   * Clear all player stats (use with caution!)
   */
  clearAllStats(): void {
    this.db.exec('DELETE FROM players');
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Get database statistics
   */
  getStats(): { totalPlayers: number; totalKills: number; totalDeaths: number } {
    const result = this.db.prepare(`
      SELECT
        COUNT(*) as totalPlayers,
        SUM(kills) as totalKills,
        SUM(deaths) as totalDeaths
      FROM players
    `).get() as { totalPlayers: number; totalKills: number; totalDeaths: number };

    return result;
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
