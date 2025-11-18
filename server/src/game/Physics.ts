import { Player, Bullet, TerrainObject, GAME_CONFIG } from '../types/game.types.js';
import type { PlayerEntity } from './Player.js';

export class Physics {
  // AABB collision detection
  static checkAABB(
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean {
    return (
      x1 < x2 + w2 &&
      x1 + w1 > x2 &&
      y1 < y2 + h2 &&
      y1 + h1 > y2
    );
  }

  // Circle collision detection (for players)
  static checkCircleCollision(
    x1: number, y1: number, r1: number,
    x2: number, y2: number, r2: number
  ): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
  }

  // Check if player collides with terrain
  static checkPlayerTerrainCollision(player: Player, terrain: TerrainObject[]): boolean {
    const playerRadius = GAME_CONFIG.PLAYER_RADIUS;

    for (const obj of terrain) {
      if (!obj.blocking) continue;

      // Check AABB collision with player's bounding box
      if (this.checkAABB(
        player.x - playerRadius,
        player.y - playerRadius,
        playerRadius * 2,
        playerRadius * 2,
        obj.x,
        obj.y,
        obj.width,
        obj.height
      )) {
        return true;
      }
    }
    return false;
  }

  // Check if bullet collides with terrain
  static checkBulletTerrainCollision(bullet: Bullet, terrain: TerrainObject[]): TerrainObject | null {
    const bulletRadius = 3;

    for (const obj of terrain) {
      if (!obj.blocking) continue;

      // Check if bullet intersects with terrain
      if (this.checkAABB(
        bullet.x - bulletRadius,
        bullet.y - bulletRadius,
        bulletRadius * 2,
        bulletRadius * 2,
        obj.x,
        obj.y,
        obj.width,
        obj.height
      )) {
        return obj;
      }
    }
    return null;
  }

  // Check if bullet hits a player
  static checkBulletPlayerCollision<T extends Player>(bullet: Bullet, players: Map<string, T>): T | null {
    const bulletRadius = 3;

    for (const [playerId, player] of players) {
      // Skip if bullet owner or player is dead
      if (playerId === bullet.ownerId || !player.isAlive) continue;

      if (this.checkCircleCollision(
        bullet.x,
        bullet.y,
        bulletRadius,
        player.x,
        player.y,
        GAME_CONFIG.PLAYER_RADIUS
      )) {
        return player;
      }
    }
    return null;
  }

  // Clamp position to world bounds
  static clampToWorld(x: number, y: number): { x: number; y: number } {
    const margin = GAME_CONFIG.PLAYER_RADIUS + 20; // Wall thickness
    return {
      x: Math.max(margin, Math.min(GAME_CONFIG.WORLD_WIDTH - margin, x)),
      y: Math.max(margin, Math.min(GAME_CONFIG.WORLD_HEIGHT - margin, y))
    };
  }
}
