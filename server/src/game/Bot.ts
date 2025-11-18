import { PlayerEntity } from './Player.js';
import { GAME_CONFIG } from '../types/game.types.js';

interface BotTarget {
  id: string;
  x: number;
  y: number;
  distance: number;
}

export class BotEntity extends PlayerEntity {
  private aiState: 'idle' | 'hunting' | 'fleeing' | 'wandering' = 'wandering';
  private targetId: string | null = null;
  private wanderAngle: number = Math.random() * Math.PI * 2;
  private lastStateChange: number = Date.now();
  private lastDirectionChange: number = Date.now();
  private reactionTime: number;
  private accuracy: number;
  private aggression: number;
  private isBot: boolean = true;

  constructor(
    id: string,
    username: string,
    spawnX: number,
    spawnY: number,
    difficulty: 'medium' | 'hard' = 'medium'
  ) {
    super(id, username, spawnX, spawnY);

    // Configure difficulty settings
    if (difficulty === 'hard') {
      this.reactionTime = 100; // 100ms reaction time
      this.accuracy = 0.85; // 85% accuracy
      this.aggression = 0.8; // 80% aggressive
    } else {
      this.reactionTime = 300; // 300ms reaction time
      this.accuracy = 0.65; // 65% accuracy
      this.aggression = 0.5; // 50% aggressive
    }
  }

  // AI decision making
  updateAI(players: Map<string, PlayerEntity>, deltaTime: number): void {
    if (!this.isAlive) return;

    const now = Date.now();

    // Find nearest player
    const nearestPlayer = this.findNearestPlayer(players);

    // State machine
    if (nearestPlayer) {
      const distance = nearestPlayer.distance;
      const detectionRange = 400;
      const fleeRange = 150;

      if (this.health < 30 && distance < fleeRange) {
        this.aiState = 'fleeing';
        this.targetId = nearestPlayer.id;
      } else if (distance < detectionRange) {
        if (Math.random() < this.aggression) {
          this.aiState = 'hunting';
          this.targetId = nearestPlayer.id;
        } else {
          this.aiState = 'wandering';
        }
      } else {
        this.aiState = 'wandering';
      }
    } else {
      this.aiState = 'wandering';
    }

    // Execute behavior based on state
    switch (this.aiState) {
      case 'hunting':
        if (nearestPlayer) {
          this.huntTarget(nearestPlayer, players);
        }
        break;
      case 'fleeing':
        if (nearestPlayer) {
          this.fleeFromTarget(nearestPlayer);
        }
        break;
      case 'wandering':
        this.wander(now);
        break;
    }
  }

  private findNearestPlayer(players: Map<string, PlayerEntity>): BotTarget | null {
    let nearest: BotTarget | null = null;
    let minDistance = Infinity;

    for (const [id, player] of players) {
      // Skip self and dead players
      if (id === this.id || !player.isAlive) continue;

      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = {
          id: player.id,
          x: player.x,
          y: player.y,
          distance
        };
      }
    }

    return nearest;
  }

  private huntTarget(target: BotTarget, players: Map<string, PlayerEntity>): void {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate angle to target with accuracy variance
    const perfectAngle = Math.atan2(dy, dx);
    const angleVariance = (1 - this.accuracy) * 0.3; // Max 30% angle error
    const aimError = (Math.random() - 0.5) * angleVariance;
    this.angle = perfectAngle + aimError;

    // Move towards target but maintain some distance
    const optimalDistance = 250;
    if (distance > optimalDistance) {
      // Move closer
      this.setMovement(dx / distance, dy / distance);
    } else if (distance < optimalDistance * 0.7) {
      // Strafe around target (circle strafe)
      const strafeAngle = perfectAngle + Math.PI / 2;
      this.setMovement(Math.cos(strafeAngle), Math.sin(strafeAngle));
    } else {
      // In optimal range, strafe
      const strafeAngle = perfectAngle + Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);
      this.setMovement(Math.cos(strafeAngle) * 0.5, Math.sin(strafeAngle) * 0.5);
    }

    // Shooting is handled by wantsToShoot() and game engine
    // No need to shoot here directly
  }

  private fleeFromTarget(target: BotTarget): void {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Run away from target
    this.setMovement(-dx / distance, -dy / distance);

    // Still aim at target while fleeing
    this.angle = Math.atan2(dy, dx);

    // Shooting is handled by wantsToShoot() and game engine
  }

  private wander(now: number): void {
    // Change direction every 2-4 seconds
    const directionChangeInterval = 2000 + Math.random() * 2000;
    if (now - this.lastDirectionChange > directionChangeInterval) {
      this.wanderAngle = Math.random() * Math.PI * 2;
      this.lastDirectionChange = now;
    }

    // Move in wander direction
    this.setMovement(
      Math.cos(this.wanderAngle) * 0.6,
      Math.sin(this.wanderAngle) * 0.6
    );

    this.angle = this.wanderAngle;
  }

  // Check if bot wants to shoot (for game engine to create bullet)
  wantsToShoot(): boolean {
    // Only shoot with some probability to avoid spamming
    const shootChance = this.aiState === 'hunting' ? 0.3 : 0.2;
    return this.canShoot() &&
           (this.aiState === 'hunting' || this.aiState === 'fleeing') &&
           Math.random() < shootChance;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      isBot: this.isBot
    };
  }
}
