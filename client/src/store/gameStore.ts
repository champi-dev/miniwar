import { create } from 'zustand';
import {
  Player,
  Bullet,
  TerrainObject,
  LeaderboardEntry
} from '../types/game.types';

interface GameState {
  // Connection state
  isConnected: boolean;
  playerId: string | null;

  // Game state
  players: Player[];
  bullets: Bullet[];
  terrain: TerrainObject[];
  leaderboard: LeaderboardEntry[];

  // World info
  worldSize: { width: number; height: number };

  // UI state
  showLeaderboard: boolean;
  deathMessage: string | null;

  // Actions
  setConnected: (connected: boolean) => void;
  setPlayerId: (id: string) => void;
  updateGameState: (players: Player[], bullets: Bullet[], terrain?: TerrainObject[]) => void;
  updateLeaderboard: (entries: LeaderboardEntry[]) => void;
  setWorldSize: (width: number, height: number) => void;
  toggleLeaderboard: () => void;
  setDeathMessage: (message: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  isConnected: false,
  playerId: null,
  players: [],
  bullets: [],
  terrain: [],
  leaderboard: [],
  worldSize: { width: 2000, height: 2000 },
  showLeaderboard: false,
  deathMessage: null,

  setConnected: (connected) => set({ isConnected: connected }),
  setPlayerId: (id) => set({ playerId: id }),

  updateGameState: (players, bullets, terrain) =>
    set((state) => ({
      players,
      bullets,
      terrain: terrain || state.terrain
    })),

  updateLeaderboard: (entries) => set({ leaderboard: entries }),

  setWorldSize: (width, height) => set({ worldSize: { width, height } }),

  toggleLeaderboard: () => set((state) => ({ showLeaderboard: !state.showLeaderboard })),

  setDeathMessage: (message) => set({ deathMessage: message }),

  reset: () =>
    set({
      isConnected: false,
      playerId: null,
      players: [],
      bullets: [],
      terrain: [],
      leaderboard: [],
      deathMessage: null
    })
}));
