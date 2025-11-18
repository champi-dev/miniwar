import { TerrainObject, GAME_CONFIG } from '../types/game.types.js';

export class TerrainGenerator {
  private terrain: TerrainObject[] = [];
  private nextId = 0;

  generate(): TerrainObject[] {
    this.terrain = [];

    // Create border walls
    this.createBorderWalls();

    // Create interior obstacles
    this.createInteriorObstacles();

    return this.terrain;
  }

  private createBorderWalls(): void {
    const wallThickness = 20;
    const { WORLD_WIDTH, WORLD_HEIGHT } = GAME_CONFIG;

    // Top wall
    this.terrain.push({
      id: `wall_${this.nextId++}`,
      type: 'wall',
      x: 0,
      y: 0,
      width: WORLD_WIDTH,
      height: wallThickness,
      blocking: true
    });

    // Bottom wall
    this.terrain.push({
      id: `wall_${this.nextId++}`,
      type: 'wall',
      x: 0,
      y: WORLD_HEIGHT - wallThickness,
      width: WORLD_WIDTH,
      height: wallThickness,
      blocking: true
    });

    // Left wall
    this.terrain.push({
      id: `wall_${this.nextId++}`,
      type: 'wall',
      x: 0,
      y: 0,
      width: wallThickness,
      height: WORLD_HEIGHT,
      blocking: true
    });

    // Right wall
    this.terrain.push({
      id: `wall_${this.nextId++}`,
      type: 'wall',
      x: WORLD_WIDTH - wallThickness,
      y: 0,
      width: wallThickness,
      height: WORLD_HEIGHT,
      blocking: true
    });
  }

  private createInteriorObstacles(): void {
    // Create strategic walls
    this.addWall(400, 400, 200, 30);
    this.addWall(1400, 400, 200, 30);
    this.addWall(400, 1570, 200, 30);
    this.addWall(1400, 1570, 200, 30);

    // Center walls
    this.addWall(900, 900, 30, 200);
    this.addWall(1070, 900, 30, 200);

    // Create crates (destructible)
    this.addCrate(700, 700, 60, 60);
    this.addCrate(1300, 700, 60, 60);
    this.addCrate(700, 1300, 60, 60);
    this.addCrate(1300, 1300, 60, 60);
    this.addCrate(1000, 500, 60, 60);
    this.addCrate(1000, 1500, 60, 60);

    // Create bushes (visual cover)
    this.addBush(300, 600, 80, 80);
    this.addBush(1700, 600, 80, 80);
    this.addBush(300, 1400, 80, 80);
    this.addBush(1700, 1400, 80, 80);
    this.addBush(1000, 1000, 100, 100);
  }

  private addWall(x: number, y: number, width: number, height: number): void {
    this.terrain.push({
      id: `wall_${this.nextId++}`,
      type: 'wall',
      x,
      y,
      width,
      height,
      blocking: true
    });
  }

  private addCrate(x: number, y: number, width: number, height: number): void {
    this.terrain.push({
      id: `crate_${this.nextId++}`,
      type: 'crate',
      x,
      y,
      width,
      height,
      health: 60, // Takes 3 hits to destroy
      blocking: true
    });
  }

  private addBush(x: number, y: number, width: number, height: number): void {
    this.terrain.push({
      id: `bush_${this.nextId++}`,
      type: 'bush',
      x,
      y,
      width,
      height,
      blocking: false // Bushes don't block movement or bullets
    });
  }
}
