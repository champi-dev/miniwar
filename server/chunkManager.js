import { loadChunk, saveChunk } from './db.js';
import { generateChunk } from './worldGen.js';

// In-memory cache for active chunks
// Key format: "x,z"
const chunkCache = new Map();

// Cache configuration
const MAX_CACHE_SIZE = 100; // Maximum number of chunks to keep in memory
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Track last access time for cache eviction
const chunkAccessTime = new Map();

/**
 * Get chunk key for cache and database
 * @param {number} x - Chunk X coordinate
 * @param {number} z - Chunk Z coordinate
 * @returns {string} - Chunk key
 */
function getChunkKey(x, z) {
  return `${x},${z}`;
}

/**
 * Evict old chunks from cache if it's too large
 */
function evictOldChunks() {
  if (chunkCache.size <= MAX_CACHE_SIZE) {
    return;
  }

  const now = Date.now();
  const chunksToEvict = [];

  // Find chunks that haven't been accessed recently
  for (const [key, timestamp] of chunkAccessTime.entries()) {
    if (now - timestamp > CACHE_EXPIRY_MS) {
      chunksToEvict.push(key);
    }
  }

  // If we still need to evict more, remove oldest accessed chunks
  if (chunksToEvict.length < chunkCache.size - MAX_CACHE_SIZE) {
    const sortedChunks = Array.from(chunkAccessTime.entries())
      .sort((a, b) => a[1] - b[1]);

    const additionalEvictions = chunkCache.size - MAX_CACHE_SIZE - chunksToEvict.length;
    for (let i = 0; i < additionalEvictions && i < sortedChunks.length; i++) {
      if (!chunksToEvict.includes(sortedChunks[i][0])) {
        chunksToEvict.push(sortedChunks[i][0]);
      }
    }
  }

  // Evict chunks
  for (const key of chunksToEvict) {
    chunkCache.delete(key);
    chunkAccessTime.delete(key);
  }

  if (chunksToEvict.length > 0) {
    console.log(`[CHUNK_MANAGER] Evicted ${chunksToEvict.length} chunks from cache`);
  }
}

/**
 * Get or generate a chunk
 * Checks cache first, then database, then generates if needed
 * @param {number} x - Chunk X coordinate
 * @param {number} z - Chunk Z coordinate
 * @returns {Promise<Array>} - 3D array of chunk data
 */
export async function getOrGenerateChunk(x, z) {
  const key = getChunkKey(x, z);

  // Check cache first
  if (chunkCache.has(key)) {
    chunkAccessTime.set(key, Date.now());
    console.log(`[CHUNK_MANAGER] Cache hit for chunk (${x}, ${z})`);
    return chunkCache.get(key);
  }

  // Check database
  const dbChunk = loadChunk(x, z);
  if (dbChunk) {
    console.log(`[CHUNK_MANAGER] Loaded chunk (${x}, ${z}) from database`);
    chunkCache.set(key, dbChunk);
    chunkAccessTime.set(key, Date.now());
    evictOldChunks();
    return dbChunk;
  }

  // Generate new chunk
  console.log(`[CHUNK_MANAGER] Generating new chunk (${x}, ${z})`);
  const newChunk = generateChunk(x, z);

  // Save to database
  saveChunk(x, z, newChunk);

  // Add to cache
  chunkCache.set(key, newChunk);
  chunkAccessTime.set(key, Date.now());
  evictOldChunks();

  return newChunk;
}

/**
 * Save chunk data to database
 * @param {number} x - Chunk X coordinate
 * @param {number} z - Chunk Z coordinate
 * @param {Array} chunkData - 3D array of chunk data
 */
export function saveChunkToDB(x, z, chunkData) {
  const key = getChunkKey(x, z);

  // Update cache
  chunkCache.set(key, chunkData);
  chunkAccessTime.set(key, Date.now());

  // Save to database
  saveChunk(x, z, chunkData);

  console.log(`[CHUNK_MANAGER] Saved chunk (${x}, ${z}) to database`);
}

/**
 * Update a block in a chunk
 * @param {number} chunkX - Chunk X coordinate
 * @param {number} chunkZ - Chunk Z coordinate
 * @param {number} localX - Local X coordinate within chunk (0-15)
 * @param {number} y - Y coordinate
 * @param {number} localZ - Local Z coordinate within chunk (0-15)
 * @param {string} blockType - Type of block to set
 */
export async function updateBlock(chunkX, chunkZ, localX, y, localZ, blockType) {
  const chunk = await getOrGenerateChunk(chunkX, chunkZ);

  // Update the block
  if (chunk[localX] && chunk[localX][y]) {
    chunk[localX][y][localZ] = blockType;

    // Save updated chunk
    saveChunkToDB(chunkX, chunkZ, chunk);
  }
}

/**
 * Get a block from a chunk
 * @param {number} chunkX - Chunk X coordinate
 * @param {number} chunkZ - Chunk Z coordinate
 * @param {number} localX - Local X coordinate within chunk (0-15)
 * @param {number} y - Y coordinate
 * @param {number} localZ - Local Z coordinate within chunk (0-15)
 * @returns {Promise<string>} - Block type
 */
export async function getBlock(chunkX, chunkZ, localX, y, localZ) {
  const chunk = await getOrGenerateChunk(chunkX, chunkZ);

  if (chunk[localX] && chunk[localX][y]) {
    return chunk[localX][y][localZ];
  }

  return 'air';
}

/**
 * Clear the chunk cache (useful for testing or memory management)
 */
export function clearCache() {
  chunkCache.clear();
  chunkAccessTime.clear();
  console.log('[CHUNK_MANAGER] Cache cleared');
}

/**
 * Get cache statistics
 * @returns {Object} - Cache stats
 */
export function getCacheStats() {
  return {
    size: chunkCache.size,
    maxSize: MAX_CACHE_SIZE,
    chunks: Array.from(chunkCache.keys())
  };
}
