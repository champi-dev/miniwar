import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import {
  GameInitPayload,
  GameUpdatePayload,
  PlayerDeathPayload,
  LeaderboardUpdatePayload
} from '../types/game.types';

class SocketClient {
  private socket: Socket | null = null;
  private serverUrl: string;

  constructor() {
    this.serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
  }

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();

    return this.socket;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
      useGameStore.getState().setConnected(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      useGameStore.getState().setConnected(false);
    });

    this.socket.on('game:init', (data: GameInitPayload) => {
      console.log('Game initialized', data);
      const { playerId, worldState } = data;

      useGameStore.getState().setPlayerId(playerId);
      useGameStore.getState().setWorldSize(
        worldState.worldSize.width,
        worldState.worldSize.height
      );
      useGameStore.getState().updateGameState(
        worldState.players,
        worldState.bullets,
        worldState.terrain
      );
    });

    this.socket.on('game:update', (data: GameUpdatePayload) => {
      useGameStore.getState().updateGameState(
        data.players,
        data.bullets,
        data.terrain
      );
    });

    this.socket.on('player:death', (data: PlayerDeathPayload) => {
      const { playerId } = useGameStore.getState();

      if (data.playerId === playerId) {
        useGameStore.getState().setDeathMessage(
          `You were eliminated by ${data.killerName}`
        );
        setTimeout(() => {
          useGameStore.getState().setDeathMessage(null);
        }, 3000);
      } else if (data.killerId === playerId) {
        // Show kill notification (optional)
        console.log(`You eliminated ${data.victimName}`);
      }
    });

    this.socket.on('leaderboard:update', (data: LeaderboardUpdatePayload) => {
      useGameStore.getState().updateLeaderboard(data.entries);
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  joinGame(username: string): void {
    this.socket?.emit('player:join', { username });
  }

  sendMovement(x: number, y: number, angle: number): void {
    this.socket?.emit('player:move', { x, y, angle });
  }

  sendShoot(angle: number): void {
    this.socket?.emit('player:shoot', { angle, timestamp: Date.now() });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketClient = new SocketClient();
