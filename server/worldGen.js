import { createNoise2D } from 'simplex-noise';

// Create noise generator
const noise2D = createNoise2D();

// Chunk configuration
const CHUNK_SIZE = 16;
const CHUNK_HEIGHT = 64;

// Terrain generation parameters
const MIN_HEIGHT = 5;
const MAX_HEIGHT = 50;  // Increased for mountains
const TERRAIN_SCALE = 0.02; // Larger features
const OCTAVES = 6; // More detail
const MOUNTAIN_SCALE = 0.01; // Large mountain features
const TREE_PROBABILITY = 0.03; // 3% chance per grass block
const TALL_GRASS_PROBABILITY = 0.15; // 15% chance for tall grass
const FLOWER_PROBABILITY = 0.05; // 5% chance for flowers
const WATER_LEVEL = 12; // Sea level
const SAND_DEPTH = 3; // Blocks of sand near water
const SNOW_HEIGHT = 40; // Snow appears above this height

// Block types
export const BlockType = {
  AIR: 'air',
  GRASS: 'grass',
  DIRT: 'dirt',
  STONE: 'stone',
  WOOD: 'wood',
  LEAVES: 'leaves',
  WATER: 'water',
  SAND: 'sand',
  SNOW: 'snow',
  TALL_GRASS: 'tall_grass',
  FLOWERS: 'flowers'
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

      // Add mountain features with separate noise
      const mountainNoise = (noise2D(worldX * MOUNTAIN_SCALE, worldZ * MOUNTAIN_SCALE) + 1) / 2;

      // Combine terrain and mountains - mountains add extra height
      const mountainInfluence = Math.pow(mountainNoise, 2.5); // Power curve for dramatic peaks
      const finalNoise = noiseValue * 0.4 + mountainInfluence * 0.6;

      // Clamp between 0 and 1
      const clampedNoise = Math.max(0, Math.min(1, finalNoise));

      // Map to height range
      const height = Math.floor(MIN_HEIGHT + clampedNoise * (MAX_HEIGHT - MIN_HEIGHT));
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
  const treePositions = []; // Store tree positions for later generation
  const grassPositions = []; // Store positions for vegetation

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const terrainHeight = heightMap[x][z];
      const isNearWater = terrainHeight <= WATER_LEVEL + SAND_DEPTH;
      const isMountainTop = terrainHeight >= SNOW_HEIGHT;

      for (let y = 0; y < terrainHeight; y++) {
        if (y === terrainHeight - 1) {
          // Top layer varies by biome
          if (isMountainTop) {
            // Mountain peaks are snow
            chunk[x][y][z] = BlockType.SNOW;
          } else if (isNearWater && terrainHeight >= WATER_LEVEL) {
            // Near water but above sea level = sand
            chunk[x][y][z] = BlockType.SAND;
          } else if (terrainHeight >= WATER_LEVEL) {
            // Regular land = grass
            chunk[x][y][z] = BlockType.GRASS;

            // Store for vegetation (not on sand or snow)
            if (!isNearWater && !isMountainTop) {
              grassPositions.push({ x, y: terrainHeight, z });
            }
          } else {
            // Underwater = dirt
            chunk[x][y][z] = BlockType.DIRT;
          }
        } else if (y >= terrainHeight - 4) {
          // Next 3-4 layers are dirt or sand near water
          if (isNearWater && y >= terrainHeight - 2) {
            chunk[x][y][z] = BlockType.SAND;
          } else {
            chunk[x][y][z] = BlockType.DIRT;
          }
        } else {
          // Everything below is stone
          chunk[x][y][z] = BlockType.STONE;
        }
      }

      // Add water at low elevations
      if (terrainHeight < WATER_LEVEL) {
        for (let y = terrainHeight; y < WATER_LEVEL; y++) {
          chunk[x][y][z] = BlockType.WATER;
        }
      }
    }
  }

  // Add vegetation to grass positions
  for (const pos of grassPositions) {
    const rand = Math.random();

    if (rand < TREE_PROBABILITY) {
      // Spawn a tree
      treePositions.push(pos);
    } else if (rand < TREE_PROBABILITY + TALL_GRASS_PROBABILITY) {
      // Spawn tall grass (one block above ground)
      if (pos.y < CHUNK_HEIGHT - 1) {
        chunk[pos.x][pos.y][pos.z] = BlockType.TALL_GRASS;
      }
    } else if (rand < TREE_PROBABILITY + TALL_GRASS_PROBABILITY + FLOWER_PROBABILITY) {
      // Spawn flowers
      if (pos.y < CHUNK_HEIGHT - 1) {
        chunk[pos.x][pos.y][pos.z] = BlockType.FLOWERS;
      }
    }
  }

  // Generate trees
  for (const treePos of treePositions) {
    generateTree(chunk, treePos.x, treePos.y, treePos.z);
  }

  return chunk;
}

/**
 * Generate a tree at the specified position
 * @param {Array} chunk - The chunk data
 * @param {number} x - Local X coordinate
 * @param {number} y - Y coordinate (ground level)
 * @param {number} z - Local Z coordinate
 */
function generateTree(chunk, x, y, z) {
  const treeType = Math.random();

  if (treeType < 0.7) {
    // Oak tree (70% chance)
    generateOakTree(chunk, x, y, z);
  } else {
    // Pine tree (30% chance)
    generatePineTree(chunk, x, y, z);
  }
}

/**
 * Generate an oak tree (round canopy)
 */
function generateOakTree(chunk, x, y, z) {
  const TREE_HEIGHT = 5 + Math.floor(Math.random() * 3); // 5-7 blocks tall
  const TRUNK_HEIGHT = TREE_HEIGHT - 2;

  // Generate trunk
  for (let dy = 0; dy < TRUNK_HEIGHT; dy++) {
    const blockY = y + dy;
    if (blockY < CHUNK_HEIGHT) {
      chunk[x][blockY][z] = BlockType.WOOD;
    }
  }

  // Generate leaves (round shape)
  const leavesY = y + TRUNK_HEIGHT - 1;

  // Bottom layer (5x5)
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      const leafX = x + dx;
      const leafZ = z + dz;

      // Skip corners to make it round
      if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;

      if (leafX >= 0 && leafX < CHUNK_SIZE && leafZ >= 0 && leafZ < CHUNK_SIZE && leavesY < CHUNK_HEIGHT) {
        if (chunk[leafX][leavesY][leafZ] === BlockType.AIR) {
          chunk[leafX][leavesY][leafZ] = BlockType.LEAVES;
        }
      }
    }
  }

  // Middle layer (3x3)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const leafX = x + dx;
      const leafZ = z + dz;
      const leafY = leavesY + 1;

      if (leafX >= 0 && leafX < CHUNK_SIZE && leafZ >= 0 && leafZ < CHUNK_SIZE && leafY < CHUNK_HEIGHT) {
        chunk[leafX][leafY][leafZ] = BlockType.LEAVES;
      }
    }
  }

  // Top layers (smaller)
  for (let dy = 2; dy <= 3; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const leafX = x + dx;
        const leafZ = z + dz;
        const leafY = leavesY + dy;

        // Skip corners at top
        if (dy === 3 && (Math.abs(dx) + Math.abs(dz) > 1)) continue;

        if (leafX >= 0 && leafX < CHUNK_SIZE && leafZ >= 0 && leafZ < CHUNK_SIZE && leafY < CHUNK_HEIGHT) {
          chunk[leafX][leafY][leafZ] = BlockType.LEAVES;
        }
      }
    }
  }
}

/**
 * Generate a pine tree (conical shape)
 */
function generatePineTree(chunk, x, y, z) {
  const TREE_HEIGHT = 7 + Math.floor(Math.random() * 4); // 7-10 blocks tall

  // Generate trunk
  for (let dy = 0; dy < TREE_HEIGHT; dy++) {
    const blockY = y + dy;
    if (blockY < CHUNK_HEIGHT) {
      chunk[x][blockY][z] = BlockType.WOOD;
    }
  }

  // Generate conical leaves
  let radius = 2;
  for (let dy = Math.floor(TREE_HEIGHT * 0.3); dy < TREE_HEIGHT; dy++) {
    const leafY = y + dy;

    // Decrease radius as we go up
    if (dy > TREE_HEIGHT * 0.6) radius = 1;
    if (dy > TREE_HEIGHT * 0.8) radius = 0;

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const leafX = x + dx;
        const leafZ = z + dz;

        // Make it circular
        if (dx * dx + dz * dz <= radius * radius) {
          if (leafX >= 0 && leafX < CHUNK_SIZE && leafZ >= 0 && leafZ < CHUNK_SIZE && leafY < CHUNK_HEIGHT) {
            // Don't overwrite trunk
            if (!(dx === 0 && dz === 0)) {
              chunk[leafX][leafY][leafZ] = BlockType.LEAVES;
            }
          }
        }
      }
    }
  }
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
