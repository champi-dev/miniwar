import { PlayerEntity } from './Player.js';
import { BulletEntity } from './Bullet.js';
import { TerrainGenerator } from './Terrain.js';
import { Physics } from './Physics.js';
import { databaseService } from '../services/DatabaseService.js';
import {
  TerrainObject,
  PlayerDeathPayload,
  GAME_CONFIG
} from '../types/game.types.js';

export class World {
  players: Map<string, PlayerEntity> = new Map();
  bullets: BulletEntity[] = [];
  terrain: TerrainObject[] = [];
  private bulletIdCounter = 0;
  private pendingRespawns: Map<string, number> = new Map();

  constructor() {
    // Generate terrain
    const terrainGen = new TerrainGenerator();
    this.terrain = terrainGen.generate();
  }

  addPlayer(id: string, username: string): PlayerEntity {
    const spawnPoint = this.getSpawnPoint();

    // Load existing stats from database if available
    const existingStats = databaseService.getPlayerStats(username);

    const player = new PlayerEntity(
      id,
      username,
      spawnPoint.x,
      spawnPoint.y,
      existingStats ? {
        kills: existingStats.kills,
        deaths: existingStats.deaths,
        score: existingStats.score
      } : undefined
    );

    this.players.set(id, player);
    return player;
  }

  removePlayer(id: string): void {
    this.players.delete(id);
    this.pendingRespawns.delete(id);

    // Remove bullets owned by this player
    this.bullets = this.bullets.filter(b => b.ownerId !== id);
  }

  createBullet(playerId: string, x: number, y: number, angle: number): BulletEntity | null {
    const player = this.players.get(playerId);
    if (!player || !player.canShoot()) {
      return null;
    }

    const bulletId = `bullet_${this.bulletIdCounter++}`;
    const bullet = new BulletEntity(bulletId, x, y, angle, playerId);
    this.bullets.push(bullet);

    player.shoot();

    return bullet;
  }

  update(deltaTime: number): PlayerDeathPayload[] {
    const deaths: PlayerDeathPayload[] = [];

    // Update players
    for (const [id, player] of this.players) {
      if (player.isAlive) {
        const oldX = player.x;
        const oldY = player.y;

        player.update(deltaTime);

        // Check terrain collision and revert if needed
        if (Physics.checkPlayerTerrainCollision(player, this.terrain)) {
          player.x = oldX;
          player.y = oldY;
        } else {
          // Clamp to world bounds
          const clamped = Physics.clampToWorld(player.x, player.y);
          player.x = clamped.x;
          player.y = clamped.y;
        }
      }
    }

    // Update bullets and check collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(deltaTime);

      // Check if bullet expired
      if (bullet.isExpired()) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check terrain collision
      const hitTerrain = Physics.checkBulletTerrainCollision(bullet, this.terrain);
      if (hitTerrain) {
        // Damage crates
        if (hitTerrain.type === 'crate' && hitTerrain.health !== undefined) {
          hitTerrain.health -= bullet.damage;
          if (hitTerrain.health <= 0) {
            // Remove destroyed crate
            this.terrain = this.terrain.filter(t => t.id !== hitTerrain.id);
          }
        }
        this.bullets.splice(i, 1);
        continue;
      }

      // Check player collision
      const hitPlayer = Physics.checkBulletPlayerCollision(bullet, this.players);
      if (hitPlayer) {
        hitPlayer.takeDamage(bullet.damage);

        // If player died, award kill to shooter
        if (!hitPlayer.isAlive) {
          const shooter = this.players.get(bullet.ownerId);
          if (shooter) {
            shooter.addKill();
            deaths.push({
              playerId: hitPlayer.id,
              killerId: shooter.id,
              killerName: shooter.username,
              victimName: hitPlayer.username
            });

            // Schedule respawn
            this.scheduleRespawn(hitPlayer.id);
          }
        }

        this.bullets.splice(i, 1);
        continue;
      }
    }

    // Handle respawns
    const now = Date.now();
    for (const [playerId, respawnTime] of this.pendingRespawns) {
      if (now >= respawnTime) {
        const player = this.players.get(playerId);
        if (player) {
          const spawnPoint = this.getSpawnPoint();
          player.respawn(spawnPoint.x, spawnPoint.y);
        }
        this.pendingRespawns.delete(playerId);
      }
    }

    return deaths;
  }

  private scheduleRespawn(playerId: string): void {
    const respawnTime = Date.now() + GAME_CONFIG.RESPAWN_TIME;
    this.pendingRespawns.set(playerId, respawnTime);
  }

  private getSpawnPoint(): { x: number; y: number } {
    // Spawn in one of the four corners (with margin)
    const margin = 150;
    const spawnPoints = [
      { x: margin, y: margin }, // Top-left
      { x: GAME_CONFIG.WORLD_WIDTH - margin, y: margin }, // Top-right
      { x: margin, y: GAME_CONFIG.WORLD_HEIGHT - margin }, // Bottom-left
      { x: GAME_CONFIG.WORLD_WIDTH - margin, y: GAME_CONFIG.WORLD_HEIGHT - margin } // Bottom-right
    ];

    return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
  }

  getState() {
    return {
      players: Array.from(this.players.values()).map(p => p.toJSON()),
      bullets: this.bullets.map(b => b.toJSON()),
      terrain: this.terrain
    };
  }
}
