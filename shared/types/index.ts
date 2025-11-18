// Player data structure
export interface Player {
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
  color: string; // hex color
  isAlive: boolean;
  lastShot: number; // timestamp
}

// Bullet data structure
export interface Bullet {
  id: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  ownerId: string;
  damage: number;
  distanceTraveled: number;
  maxDistance: number;
}

// Terrain object types
export type TerrainType = 'wall' | 'crate' | 'bush';

export interface TerrainObject {
  id: string;
  type: TerrainType;
  x: number;
  y: number;
  width: number;
  height: number;
  health?: number; // for destructibles (crates)
  blocking: boolean; // blocks bullets and movement
}

// World state
export interface WorldState {
  players: Player[];
  bullets: Bullet[];
  terrain: TerrainObject[];
  worldSize: { width: number; height: number };
}

// Leaderboard entry
export interface LeaderboardEntry {
  playerId: string;
  username: string;
  score: number;
  kills: number;
  deaths: number;
  kd: number;
  rank: number;
}

// Socket.io event payloads
export interface PlayerJoinPayload {
  username: string;
}

export interface PlayerMovePayload {
  x: number;
  y: number;
  angle: number;
}

export interface PlayerShootPayload {
  angle: number;
  timestamp: number;
}

export interface GameInitPayload {
  playerId: string;
  worldState: WorldState;
}

export interface GameUpdatePayload {
  players: Player[];
  bullets: Bullet[];
  terrain: TerrainObject[];
}

export interface PlayerHitPayload {
  playerId: string;
  damage: number;
  shooterId: string;
}

export interface PlayerDeathPayload {
  playerId: string;
  killerId: string;
  killerName: string;
  victimName: string;
}

export interface LeaderboardUpdatePayload {
  entries: LeaderboardEntry[];
}

// Game constants
export const GAME_CONFIG = {
  WORLD_WIDTH: 2000,
  WORLD_HEIGHT: 2000,
  PLAYER_SPEED: 200, // px/s
  PLAYER_RADIUS: 16,
  PLAYER_MAX_HEALTH: 100,
  BULLET_SPEED: 600, // px/s
  BULLET_MAX_DISTANCE: 1000,
  BULLET_DAMAGE: 20,
  FIRE_RATE: 500, // ms cooldown
  TICK_RATE: 60, // TPS
  RESPAWN_TIME: 3000, // ms
  KILL_SCORE: 10,
  DEATH_PENALTY: 5
};
