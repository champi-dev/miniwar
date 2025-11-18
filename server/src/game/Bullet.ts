import { Bullet as BulletType, GAME_CONFIG } from '../types/game.types.js';

export class BulletEntity implements BulletType {
  id: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  ownerId: string;
  damage: number;
  distanceTraveled: number;
  maxDistance: number;

  constructor(id: string, x: number, y: number, angle: number, ownerId: string) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = GAME_CONFIG.BULLET_SPEED;
    this.ownerId = ownerId;
    this.damage = GAME_CONFIG.BULLET_DAMAGE;
    this.distanceTraveled = 0;
    this.maxDistance = GAME_CONFIG.BULLET_MAX_DISTANCE;
  }

  update(deltaTime: number): void {
    const dx = Math.cos(this.angle) * this.speed * deltaTime;
    const dy = Math.sin(this.angle) * this.speed * deltaTime;

    this.x += dx;
    this.y += dy;

    const distance = Math.sqrt(dx ** 2 + dy ** 2);
    this.distanceTraveled += distance;
  }

  isExpired(): boolean {
    return this.distanceTraveled >= this.maxDistance;
  }

  toJSON(): BulletType {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      angle: this.angle,
      speed: this.speed,
      ownerId: this.ownerId,
      damage: this.damage,
      distanceTraveled: this.distanceTraveled,
      maxDistance: this.maxDistance
    };
  }
}
