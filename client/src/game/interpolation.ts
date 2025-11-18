import { Player } from '../types/game.types';

interface InterpolationSnapshot {
  timestamp: number;
  players: Map<string, { x: number; y: number; angle: number }>;
}

export class Interpolator {
  private snapshots: InterpolationSnapshot[] = [];
  private readonly renderDelay = 100; // 100ms render delay for interpolation
  private readonly maxSnapshots = 10;

  addSnapshot(players: Player[]) {
    const snapshot: InterpolationSnapshot = {
      timestamp: Date.now(),
      players: new Map()
    };

    players.forEach((player) => {
      snapshot.players.set(player.id, {
        x: player.x,
        y: player.y,
        angle: player.angle
      });
    });

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  interpolatePlayers(players: Player[]): Player[] {
    if (this.snapshots.length < 2) {
      return players;
    }

    const now = Date.now();
    const renderTime = now - this.renderDelay;

    // Find the two snapshots to interpolate between
    let before: InterpolationSnapshot | null = null;
    let after: InterpolationSnapshot | null = null;

    for (let i = 0; i < this.snapshots.length - 1; i++) {
      if (
        this.snapshots[i].timestamp <= renderTime &&
        this.snapshots[i + 1].timestamp >= renderTime
      ) {
        before = this.snapshots[i];
        after = this.snapshots[i + 1];
        break;
      }
    }

    // If we can't find two snapshots, use the most recent
    if (!before || !after) {
      return players;
    }

    // Calculate interpolation factor
    const totalDelta = after.timestamp - before.timestamp;
    const currentDelta = renderTime - before.timestamp;
    const t = totalDelta > 0 ? currentDelta / totalDelta : 0;

    // Interpolate each player's position
    return players.map((player) => {
      const beforePos = before!.players.get(player.id);
      const afterPos = after!.players.get(player.id);

      if (!beforePos || !afterPos) {
        return player;
      }

      return {
        ...player,
        x: this.lerp(beforePos.x, afterPos.x, t),
        y: this.lerp(beforePos.y, afterPos.y, t),
        angle: this.lerpAngle(beforePos.angle, afterPos.angle, t)
      };
    });
  }

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  private lerpAngle(start: number, end: number, t: number): number {
    // Handle angle wrapping for smooth rotation
    let diff = end - start;

    // Normalize to [-PI, PI]
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    return start + diff * t;
  }

  clear() {
    this.snapshots = [];
  }
}

// Client-side prediction for own player
export class ClientPrediction {
  private pendingInputs: Array<{
    timestamp: number;
    keys: Set<string>;
    mouseAngle: number;
  }> = [];

  private readonly maxInputs = 50;

  addInput(keys: Set<string>, mouseAngle: number) {
    this.pendingInputs.push({
      timestamp: Date.now(),
      keys: new Set(keys),
      mouseAngle
    });

    if (this.pendingInputs.length > this.maxInputs) {
      this.pendingInputs.shift();
    }
  }

  reconcile(_serverPosition: { x: number; y: number; angle: number }, serverTimestamp: number) {
    // Remove inputs that the server has processed
    this.pendingInputs = this.pendingInputs.filter(
      (input) => input.timestamp > serverTimestamp
    );
  }

  predictPosition(
    baseX: number,
    baseY: number,
    baseAngle: number,
    speed: number,
    deltaTime: number
  ): { x: number; y: number; angle: number } {
    let x = baseX;
    let y = baseY;
    let angle = baseAngle;

    // Apply pending inputs to predict current position
    this.pendingInputs.forEach((input) => {
      const dx = this.getMovementX(input.keys, speed, deltaTime);
      const dy = this.getMovementY(input.keys, speed, deltaTime);

      x += dx;
      y += dy;
      angle = input.mouseAngle;
    });

    return { x, y, angle };
  }

  private getMovementX(keys: Set<string>, speed: number, deltaTime: number): number {
    let dx = 0;
    if (keys.has('d') || keys.has('D')) dx += 1;
    if (keys.has('a') || keys.has('A')) dx -= 1;
    return dx * speed * deltaTime;
  }

  private getMovementY(keys: Set<string>, speed: number, deltaTime: number): number {
    let dy = 0;
    if (keys.has('s') || keys.has('S')) dy += 1;
    if (keys.has('w') || keys.has('W')) dy -= 1;
    return dy * speed * deltaTime;
  }

  clear() {
    this.pendingInputs = [];
  }
}
