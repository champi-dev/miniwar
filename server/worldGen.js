import { createNoise2D } from 'simplex-noise';

// Create noise generator
const noise2D = createNoise2D();

// Chunk configuration
const CHUNK_SIZE = 16;
const CHUNK_HEIGHT = 64;

// Terrain generation parameters
const MIN_HEIGHT = 8;
const MAX_HEIGHT = 32;
const TERRAIN_SCALE = 0.05; // Controls smoothness of terrain
const OCTAVES = 4; // Number of noise layers for detail

// Block types
export const BlockType = {
  AIR: 'air',
  GRASS: 'grass',
  DIRT: 'dirt',
  STONE: 'stone'
};

/**
 * Generate a 2D Perlin noise height map for a chunk
 * @param {number} chunkX - Chunk X coordinate
 * @param {number} chunkZ - Chunk Z coordinate
 * @returns {Array<Array<number>>} - 2D array of height values
 */
function generateHeightMap(chunkX, chunkZ) {
  const heightMap = [];

  for (let x = 0; x < CHUNK_SIZE; x++) {
    heightMap[x] = [];
    for (let z = 0; z < CHUNK_SIZE; z++) {
      // World coordinates
      const worldX = chunkX * CHUNK_SIZE + x;
      const worldZ = chunkZ * CHUNK_SIZE + z;

      // Generate multi-octave noise for more detail
      let noiseValue = 0;
      let amplitude = 1;
      let frequency = TERRAIN_SCALE;
      let maxValue = 0;

      for (let i = 0; i < OCTAVES; i++) {
        noiseValue += noise2D(worldX * frequency, worldZ * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }

      // Normalize to 0-1 range
      noiseValue = (noiseValue / maxValue + 1) / 2;

      // Clamp between 0 and 1
      noiseValue = Math.max(0, Math.min(1, noiseValue));

      // Map to height range
      const height = Math.floor(MIN_HEIGHT + noiseValue * (MAX_HEIGHT - MIN_HEIGHT));
      heightMap[x][z] = height;
    }
  }

  return heightMap;
}

/**
 * Generate a voxel chunk with terrain
 * @param {number} chunkX - Chunk X coordinate
 * @param {number} chunkZ - Chunk Z coordinate
 * @returns {Array} - 3D array of block types [x][y][z]
 */
export function generateChunk(chunkX, chunkZ) {
  const chunk = [];

  // Initialize chunk with air
  for (let x = 0; x < CHUNK_SIZE; x++) {
    chunk[x] = [];
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      chunk[x][y] = [];
      for (let z = 0; z < CHUNK_SIZE; z++) {
        chunk[x][y][z] = BlockType.AIR;
      }
    }
  }

  // Generate height map
  const heightMap = generateHeightMap(chunkX, chunkZ);

  // Fill in terrain based on height map
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const terrainHeight = heightMap[x][z];

      for (let y = 0; y < terrainHeight; y++) {
        if (y === terrainHeight - 1) {
          // Top layer is grass
          chunk[x][y][z] = BlockType.GRASS;
        } else if (y >= terrainHeight - 4) {
          // Next 3 layers are dirt
          chunk[x][y][z] = BlockType.DIRT;
        } else {
          // Everything below is stone
          chunk[x][y][z] = BlockType.STONE;
        }
      }
    }
  }

  return chunk;
}

/**
 * Get the height of terrain at a specific world position
 * @param {number} worldX - World X coordinate
 * @param {number} worldZ - World Z coordinate
 * @returns {number} - Terrain height at this position
 */
export function getTerrainHeight(worldX, worldZ) {
  // Simple noise-based height calculation
  const noiseValue = Math.abs(Math.sin(worldX * TERRAIN_SCALE) * Math.cos(worldZ * TERRAIN_SCALE));
  return Math.floor(MIN_HEIGHT + noiseValue * (MAX_HEIGHT - MIN_HEIGHT));
}

/**
 * Check if a position is solid ground
 * @param {Array} chunk - The chunk data
 * @param {number} x - Local X coordinate (0-15)
 * @param {number} y - Y coordinate
 * @param {number} z - Local Z coordinate (0-15)
 * @returns {boolean} - True if position is solid
 */
export function isSolid(chunk, x, y, z) {
  if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT) {
    return false;
  }

  const blockType = chunk[x][y][z];
  return blockType !== BlockType.AIR;
}
