import OpenAI from 'openai';
import { saveAIBiome, saveAIStructureTemplate } from './db.js';

// Initialize OpenAI client (will use OPENAI_API_KEY environment variable)
let openai = null;

/**
 * Initialize OpenAI client
 */
export function initAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('[AI] OpenAI API key not found - AI content generation disabled');
    console.warn('[AI] Set OPENAI_API_KEY environment variable to enable');
    return false;
  }

  try {
    openai = new OpenAI({ apiKey });
    console.log('[AI] OpenAI client initialized successfully');
    return true;
  } catch (error) {
    console.error('[AI] Failed to initialize OpenAI:', error.message);
    return false;
  }
}

/**
 * Generate a unique biome using GPT-4o mini
 * @returns {Promise<Object>} - Generated biome data
 */
export async function generateBiome() {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  console.log('[AI] Generating new biome...');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Generate a unique and creative voxel game biome definition. The biome should be visually interesting and thematically cohesive.

Return ONLY valid JSON with this exact structure:
{
  "name": "Biome Name",
  "description": "Brief description",
  "blockTypes": {
    "primary": "grass|sand|snow|stone|dirt",
    "secondary": "dirt|sand|stone",
    "accent": "flowers|tall_grass|leaves"
  },
  "colors": {
    "primary": "#hexcolor",
    "secondary": "#hexcolor",
    "accent": "#hexcolor"
  },
  "features": {
    "treeType": "oak|pine|none",
    "treeDensity": 0.0-1.0,
    "specialFeature": "description of unique feature"
  },
  "terrainModifiers": {
    "heightVariation": "low|medium|high",
    "roughness": 0.0-1.0
  }
}

Examples of creative biomes:
- Crystal Caves: blue/purple crystals, glowing blocks, low trees
- Mushroom Forest: giant mushrooms instead of trees, purple/red colors
- Volcanic Wasteland: dark stone, lava pools, sparse vegetation
- Candy Land: bright pastel colors, cotton candy trees, sugar crystals
- Frozen Tundra: ice and snow, sparse pine trees, blue-white palette

Be creative and unique!`
    }],
    response_format: { type: 'json_object' },
    temperature: 1.2
  });

  const biome = JSON.parse(response.choices[0].message.content);
  console.log(`[AI] Generated biome: ${biome.name}`);

  // Save to database
  saveAIBiome(biome.name, biome);

  return biome;
}

/**
 * Generate a structure template using GPT-4o mini
 * @param {string} type - Type of structure (tower, house, ruins, etc.)
 * @returns {Promise<Object>} - Generated structure template
 */
export async function generateStructureTemplate(type = 'house') {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  console.log(`[AI] Generating ${type} structure...`);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Generate a ${type} structure template for a voxel game. The structure should be interesting and detailed.

Return ONLY valid JSON with this exact structure:
{
  "name": "Structure Name",
  "type": "${type}",
  "size": {
    "width": 5-15,
    "height": 5-20,
    "depth": 5-15
  },
  "blocks": [
    {
      "x": 0,
      "y": 0,
      "z": 0,
      "type": "stone|wood|grass|dirt|leaves|sand|snow"
    }
  ],
  "features": ["feature1", "feature2"],
  "description": "Brief description of the structure"
}

Keep structures reasonably sized (not too big). Use standard block types: stone, wood, grass, dirt, leaves, sand, snow.
The blocks array should define the structure's shape. Make it architecturally interesting!`
    }],
    response_format: { type: 'json_object' },
    temperature: 1.1
  });

  const structure = JSON.parse(response.choices[0].message.content);
  console.log(`[AI] Generated structure: ${structure.name}`);

  // Save to database
  saveAIStructureTemplate(structure.name, type, structure);

  return structure;
}

/**
 * Generate multiple biomes at once
 * @param {number} count - Number of biomes to generate
 * @returns {Promise<Array>} - Array of generated biomes
 */
export async function generateMultipleBiomes(count = 5) {
  const biomes = [];

  for (let i = 0; i < count; i++) {
    try {
      const biome = await generateBiome();
      biomes.push(biome);

      // Rate limiting - wait 1 second between requests
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`[AI] Failed to generate biome ${i + 1}:`, error.message);
    }
  }

  console.log(`[AI] Generated ${biomes.length}/${count} biomes`);
  return biomes;
}

/**
 * Generate multiple structure templates at once
 * @param {Array<string>} types - Array of structure types
 * @returns {Promise<Array>} - Array of generated structures
 */
export async function generateMultipleStructures(types = ['house', 'tower', 'ruins', 'temple', 'shrine']) {
  const structures = [];

  for (let i = 0; i < types.length; i++) {
    try {
      const structure = await generateStructureTemplate(types[i]);
      structures.push(structure);

      // Rate limiting - wait 1 second between requests
      if (i < types.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`[AI] Failed to generate ${types[i]}:`, error.message);
    }
  }

  console.log(`[AI] Generated ${structures.length}/${types.length} structures`);
  return structures;
}
