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

// Block color mapping
export const BlockColors = {
  [BlockType.GRASS]: '#7EC850',      // Bright green
  [BlockType.DIRT]: '#8B4513',       // Brown
  [BlockType.STONE]: '#808080',      // Gray
  [BlockType.WOOD]: '#8B4513',       // Dark brown
  [BlockType.LEAVES]: '#228B22',     // Forest green
  [BlockType.WATER]: '#4A90E2',      // Blue
  [BlockType.SAND]: '#F4E4C1',       // Sandy beige
  [BlockType.SNOW]: '#FFFFFF',       // White
  [BlockType.TALL_GRASS]: '#90EE90', // Light green
  [BlockType.FLOWERS]: '#FF69B4',    // Pink/magenta
  [BlockType.AIR]: '#000000'         // Not rendered
};

export default class Block {
  constructor(type) {
    this.type = type;
  }

  getType() {
    return this.type;
  }

  getColor() {
    return BlockColors[this.type];
  }

  isSolid() {
    return this.type !== BlockType.AIR;
  }

  static isSolid(blockType) {
    return blockType !== BlockType.AIR;
  }

  static getColor(blockType) {
    return BlockColors[blockType] || '#FF00FF'; // Magenta for unknown blocks
  }
}
