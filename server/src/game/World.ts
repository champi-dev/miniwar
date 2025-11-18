import { PlayerEntity } from './Player.js';
import { BotEntity } from './Bot.js';
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
  private botIdCounter = 0;
  private lastBotSpawn = Date.now();
  private readonly MIN_BOTS = 3;
  private readonly MAX_BOTS = 6;

  constructor() {
    // Generate terrain
    const terrainGen = new TerrainGenerator();
    this.terrain = terrainGen.generate();

    // Spawn initial bots
    this.spawnInitialBots();
  }

  private spawnInitialBots(): void {
    const botNames = [
      'AlphaBot', 'BetaBot', 'GammaBot', 'DeltaBot',
      'OmegaBot', 'SigmaBot', 'ThetaBot', 'ZetaBot'
    ];

    const initialBotCount = this.MIN_BOTS;
    for (let i = 0; i < initialBotCount; i++) {
      this.spawnBot(botNames[i % botNames.length] + (i > 7 ? i : ''));
    }
  }

  private spawnBot(name?: string): BotEntity {
    const botId = `bot_${this.botIdCounter++}`;
    const botName = name || `Bot${this.botIdCounter}`;
    const spawnPoint = this.getSpawnPoint();

    // Random difficulty: 50% medium, 50% hard
    const difficulty = Math.random() > 0.5 ? 'hard' : 'medium';

    const bot = new BotEntity(botId, botName, spawnPoint.x, spawnPoint.y, difficulty);
    this.players.set(botId, bot);

    console.log(`Spawned ${difficulty} bot: ${botName}`);
    return bot;
  }

  private manageBots(): void {
    // Count current bots
    let botCount = 0;
    for (const player of this.players.values()) {
      if (player instanceof BotEntity) {
        botCount++;
      }
    }

    // Spawn new bots if below minimum
    if (botCount < this.MIN_BOTS) {
      const botsToSpawn = this.MIN_BOTS - botCount;
      for (let i = 0; i < botsToSpawn; i++) {
        this.spawnBot();
      }
    }

    // Occasionally spawn additional bots up to max (every 30-60 seconds)
    const now = Date.now();
    const spawnInterval = 30000 + Math.random() * 30000; // 30-60s
    if (botCount < this.MAX_BOTS && now - this.lastBotSpawn > spawnInterval) {
      this.spawnBot();
      this.lastBotSpawn = now;
    }
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

    // Manage bot population
    this.manageBots();

    // Update players (including bots)
    for (const [id, player] of this.players) {
      // Update bot AI
      if (player instanceof BotEntity && player.isAlive) {
        player.updateAI(this.players, deltaTime);

        // Bots shoot when they want to
        if (player.wantsToShoot() && player.canShoot()) {
          const spawnDistance = GAME_CONFIG.PLAYER_RADIUS + 5;
          const bulletX = player.x + Math.cos(player.angle) * spawnDistance;
          const bulletY = player.y + Math.sin(player.angle) * spawnDistance;
          this.createBullet(player.id, bulletX, bulletY, player.angle);
        }
      }

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
