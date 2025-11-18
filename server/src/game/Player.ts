import { Player as PlayerType, GAME_CONFIG } from '../types/game.types.js';

export class PlayerEntity implements PlayerType {
  id: string;
  username: string;
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  score: number;
  kills: number;
  deaths: number;
  color: string;
  isAlive: boolean;
  lastShot: number;

  private velocityX: number = 0;
  private velocityY: number = 0;

  constructor(
    id: string,
    username: string,
    spawnX: number,
    spawnY: number,
    existingStats?: { kills: number; deaths: number; score: number }
  ) {
    this.id = id;
    this.username = username;
    this.x = spawnX;
    this.y = spawnY;
    this.angle = 0;
    this.health = GAME_CONFIG.PLAYER_MAX_HEALTH;
    this.maxHealth = GAME_CONFIG.PLAYER_MAX_HEALTH;

    // Load existing stats if available, otherwise start fresh
    this.score = existingStats?.score ?? 0;
    this.kills = existingStats?.kills ?? 0;
    this.deaths = existingStats?.deaths ?? 0;

    this.color = this.generateColor();
    this.isAlive = true;
    this.lastShot = 0;
  }

  private generateColor(): string {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 50%)`;
  }

  setMovement(dx: number, dy: number): void {
    this.velocityX = dx;
    this.velocityY = dy;
  }

  update(deltaTime: number): void {
    if (!this.isAlive) return;

    // Update position based on velocity
    if (this.velocityX !== 0 || this.velocityY !== 0) {
      // Normalize diagonal movement
      const magnitude = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
      if (magnitude > 0) {
        const normalizedX = this.velocityX / magnitude;
        const normalizedY = this.velocityY / magnitude;

        this.x += normalizedX * GAME_CONFIG.PLAYER_SPEED * deltaTime;
        this.y += normalizedY * GAME_CONFIG.PLAYER_SPEED * deltaTime;
      }
    }
  }

  takeDamage(damage: number): void {
    if (!this.isAlive) return;

    this.health = Math.max(0, this.health - damage);

    if (this.health <= 0) {
      this.die();
    }
  }

  die(): void {
    this.isAlive = false;
    this.health = 0;
    this.deaths++;
    this.score = Math.max(0, this.score - GAME_CONFIG.DEATH_PENALTY);
  }

  respawn(spawnX: number, spawnY: number): void {
    this.x = spawnX;
    this.y = spawnY;
    this.health = this.maxHealth;
    this.isAlive = true;
    this.velocityX = 0;
    this.velocityY = 0;
  }

  addKill(): void {
    this.kills++;
    this.score += GAME_CONFIG.KILL_SCORE;
  }

  canShoot(): boolean {
    const now = Date.now();
    return this.isAlive && (now - this.lastShot) >= GAME_CONFIG.FIRE_RATE;
  }

  shoot(): void {
    this.lastShot = Date.now();
  }

  toJSON(): PlayerType {
    return {
      id: this.id,
      username: this.username,
      x: this.x,
      y: this.y,
      angle: this.angle,
      health: this.health,
      maxHealth: this.maxHealth,
      score: this.score,
      kills: this.kills,
      deaths: this.deaths,
      color: this.color,
      isAlive: this.isAlive,
      lastShot: this.lastShot,
      isBot: false
    };
  }
}
