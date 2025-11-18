import { Server as SocketIOServer, Socket } from 'socket.io';
import { GameEngine } from '../game/GameEngine.js';
import { usernameService } from '../services/UsernameService.js';
import {
  PlayerJoinPayload,
  PlayerMovePayload,
  PlayerShootPayload
} from '../types/game.types.js';

export class SocketManager {
  private io: SocketIOServer;
  private gameEngine: GameEngine;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.gameEngine = new GameEngine(io);
  }

  /**
   * Get client IP address from socket
   */
  private getClientIP(socket: Socket): string {
    // Try to get real IP from headers (for proxies/load balancers)
    const forwarded = socket.handshake.headers['x-forwarded-for'];
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, get the first one
      const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
      return ips[0].trim();
    }

    // Fallback to direct connection IP
    return socket.handshake.address;
  }

  initialize(): void {
    this.io.on('connection', (socket: Socket) => {
      const clientIP = this.getClientIP(socket);
      console.log(`Client connected: ${socket.id} from IP: ${clientIP}`);

      // Send saved username to client if available
      const savedUsername = usernameService.getUsername(clientIP);
      if (savedUsername) {
        socket.emit('username:saved', { username: savedUsername });
      }

      // Handle player join
      socket.on('player:join', (data: PlayerJoinPayload) => {
        try {
          const { username } = data;

          // Validate username
          if (!username || username.length < 3 || username.length > 16) {
            socket.emit('error', { message: 'Invalid username' });
            return;
          }

          console.log(`Player joined: ${username} (${socket.id}) from IP: ${clientIP}`);

          // Save username for this IP address
          usernameService.saveUsername(clientIP, username);

          // Add player to game
          const player = this.gameEngine.addPlayer(socket.id, username);

          // Send initial game state to player
          socket.emit('game:init', {
            playerId: socket.id,
            worldState: this.gameEngine.getWorldState()
          });

          // Notify others
          socket.broadcast.emit('player:joined', {
            player: player.toJSON()
          });
        } catch (error) {
          console.error('Error handling player join:', error);
        }
      });

      // Handle player movement
      socket.on('player:move', (data: PlayerMovePayload) => {
        try {
          const { x, y, angle } = data;

          // Calculate movement direction from position
          // Note: In a real implementation, you might want to send velocity instead
          this.gameEngine.updatePlayerMovement(socket.id, x, y, angle);
        } catch (error) {
          console.error('Error handling player move:', error);
        }
      });

      // Handle player shooting
      socket.on('player:shoot', (data: PlayerShootPayload) => {
        try {
          const { angle } = data;
          this.gameEngine.playerShoot(socket.id, angle);
        } catch (error) {
          console.error('Error handling player shoot:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.gameEngine.removePlayer(socket.id);

        socket.broadcast.emit('player:left', {
          playerId: socket.id
        });
      });
    });

    // Start game engine
    this.gameEngine.start();
  }

  stop(): void {
    this.gameEngine.stop();
  }
}
