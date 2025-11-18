import { World } from './World.js';
import { GAME_CONFIG } from '../types/game.types.js';
import { LeaderboardService } from '../services/LeaderboardService.js';
import type { Server as SocketIOServer } from 'socket.io';

export class GameEngine {
  private world: World;
  private io: SocketIOServer;
  private lastUpdate: number;
  private lastLeaderboardUpdate: number;
  private isRunning: boolean = false;
  private leaderboardService: LeaderboardService;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.world = new World();
    this.lastUpdate = Date.now();
    this.lastLeaderboardUpdate = Date.now();
    this.leaderboardService = new LeaderboardService();
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastUpdate = Date.now();
    this.gameLoop();

    console.log('Game engine started');
  }

  stop(): void {
    this.isRunning = false;
    console.log('Game engine stopped');
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
    this.lastUpdate = now;

    // Update game world
    const deaths = this.world.update(deltaTime);

    // Broadcast deaths
    for (const death of deaths) {
      this.io.emit('player:death', death);
    }

    // Broadcast game state
    const state = this.world.getState();
    this.io.emit('game:update', {
      players: state.players,
      bullets: state.bullets,
      terrain: state.terrain
    });

    // Broadcast leaderboard periodically (every 2 seconds)
    if (now - this.lastLeaderboardUpdate >= 2000) {
      this.broadcastLeaderboard();
      this.lastLeaderboardUpdate = now;
    }

    // Schedule next tick
    const tickInterval = 1000 / GAME_CONFIG.TICK_RATE;
    const processingTime = Date.now() - now;
    const nextTickDelay = Math.max(0, tickInterval - processingTime);

    setTimeout(() => this.gameLoop(), nextTickDelay);
  }

  private broadcastLeaderboard(): void {
    // Update leaderboard with current active players
    for (const player of this.world.players.values()) {
      this.leaderboardService.updatePlayer(
        player.id,
        player.username,
        player.score,
        player.kills,
        player.deaths
      );
    }

    // Get top players from database (persistent leaderboard)
    const entries = this.leaderboardService.getTop(10);

    this.io.emit('leaderboard:update', { entries });
  }

  // Player actions
  addPlayer(socketId: string, username: string) {
    const player = this.world.addPlayer(socketId, username);
    return player;
  }

  removePlayer(socketId: string) {
    // Save player stats before removing
    const player = this.world.players.get(socketId);
    if (player) {
      this.leaderboardService.updatePlayer(
        player.id,
        player.username,
        player.score,
        player.kills,
        player.deaths
      );
      this.leaderboardService.removePlayer(player.id);
    }

    this.world.removePlayer(socketId);
  }

  updatePlayerMovement(socketId: string, dx: number, dy: number, angle: number) {
    const player = this.world.players.get(socketId);
    if (player) {
      player.setMovement(dx, dy);
      player.angle = angle;
    }
  }

  playerShoot(socketId: string, angle: number) {
    const player = this.world.players.get(socketId);
    if (player && player.isAlive) {
      // Calculate bullet spawn position (in front of player)
      const spawnDistance = GAME_CONFIG.PLAYER_RADIUS + 5;
      const bulletX = player.x + Math.cos(angle) * spawnDistance;
      const bulletY = player.y + Math.sin(angle) * spawnDistance;

      this.world.createBullet(socketId, bulletX, bulletY, angle);
    }
  }

  getWorldState() {
    return {
      worldSize: {
        width: GAME_CONFIG.WORLD_WIDTH,
        height: GAME_CONFIG.WORLD_HEIGHT
      },
      ...this.world.getState()
    };
  }
}
