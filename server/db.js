import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'voxelwars.db');
let db;

/**
 * Initialize the SQLite database and create tables if they don't exist
 */
export function initDatabase() {
  db = new Database(dbPath);

  console.log('[DB] Initializing database...');

  // Create chunks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      x INTEGER NOT NULL,
      z INTEGER NOT NULL,
      data TEXT NOT NULL,
      last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(x, z)
    )
  `);

  // Create players table
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      x REAL DEFAULT 0,
      y REAL DEFAULT 20,
      z REAL DEFAULT 0,
      health INTEGER DEFAULT 100,
      inventory TEXT DEFAULT '{}',
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create structures table
  db.exec(`
    CREATE TABLE IF NOT EXISTS structures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      z INTEGER NOT NULL,
      block_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id)
    )
  `);

  // Create indices for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chunks_coords ON chunks(x, z);
    CREATE INDEX IF NOT EXISTS idx_structures_coords ON structures(x, y, z);
    CREATE INDEX IF NOT EXISTS idx_structures_player ON structures(player_id);
  `);

  console.log('[DB] Database initialized successfully');
}

/**
 * Save a chunk to the database
 * @param {number} x - Chunk X coordinate
 * @param {number} z - Chunk Z coordinate
 * @param {Array} chunkData - 3D array of voxel data
 */
export function saveChunk(x, z, chunkData) {
  const stmt = db.prepare(`
    INSERT INTO chunks (x, z, data, last_modified)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(x, z)
    DO UPDATE SET data = ?, last_modified = CURRENT_TIMESTAMP
  `);

  const dataJson = JSON.stringify(chunkData);
  stmt.run(x, z, dataJson, dataJson);
}

/**
 * Load a chunk from the database
 * @param {number} x - Chunk X coordinate
 * @param {number} z - Chunk Z coordinate
 * @returns {Array|null} - 3D array of voxel data or null if not found
 */
export function loadChunk(x, z) {
  const stmt = db.prepare('SELECT data FROM chunks WHERE x = ? AND z = ?');
  const row = stmt.get(x, z);

  if (row) {
    return JSON.parse(row.data);
  }

  return null;
}

/**
 * Save player data to the database
 * @param {string} id - Player ID
 * @param {Object} playerData - Player data object
 */
export function savePlayer(id, playerData) {
  const stmt = db.prepare(`
    INSERT INTO players (id, username, x, y, z, health, inventory, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id)
    DO UPDATE SET
      username = ?,
      x = ?,
      y = ?,
      z = ?,
      health = ?,
      inventory = ?,
      last_seen = CURRENT_TIMESTAMP
  `);

  const inventoryJson = JSON.stringify(playerData.inventory || {});

  stmt.run(
    id,
    playerData.username,
    playerData.x,
    playerData.y,
    playerData.z,
    playerData.health,
    inventoryJson,
    // For the UPDATE clause
    playerData.username,
    playerData.x,
    playerData.y,
    playerData.z,
    playerData.health,
    inventoryJson
  );
}

/**
 * Load player data from the database
 * @param {string} id - Player ID
 * @returns {Object|null} - Player data object or null if not found
 */
export function loadPlayer(id) {
  const stmt = db.prepare('SELECT * FROM players WHERE id = ?');
  const row = stmt.get(id);

  if (row) {
    return {
      id: row.id,
      username: row.username,
      x: row.x,
      y: row.y,
      z: row.z,
      health: row.health,
      inventory: JSON.parse(row.inventory),
      lastSeen: row.last_seen
    };
  }

  return null;
}

/**
 * Save a structure (placed block) to the database
 * @param {string} playerId - Player ID who placed the block
 * @param {number} x - Block X coordinate
 * @param {number} y - Block Y coordinate
 * @param {number} z - Block Z coordinate
 * @param {string} blockType - Type of block
 */
export function saveStructure(playerId, x, y, z, blockType) {
  const stmt = db.prepare(`
    INSERT INTO structures (player_id, x, y, z, block_type)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(playerId, x, y, z, blockType);
}

/**
 * Load all structures in a given chunk
 * @param {number} chunkX - Chunk X coordinate
 * @param {number} chunkZ - Chunk Z coordinate
 * @returns {Array} - Array of structure objects
 */
export function loadStructuresInChunk(chunkX, chunkZ) {
  // Each chunk is 16x16, so calculate world coordinates
  const minX = chunkX * 16;
  const maxX = minX + 16;
  const minZ = chunkZ * 16;
  const maxZ = minZ + 16;

  const stmt = db.prepare(`
    SELECT * FROM structures
    WHERE x >= ? AND x < ? AND z >= ? AND z < ?
  `);

  return stmt.all(minX, maxX, minZ, maxZ);
}

/**
 * Close the database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    console.log('[DB] Database connection closed');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
