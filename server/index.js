import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import { getOrGenerateChunk, saveChunkToDB, updateBlock } from './chunkManager.js';
import * as GameLogic from './gameLogic.js';

const ATTACK_DAMAGE = 25;
const ATTACK_RANGE = 3;
const RESPAWN_DELAY = 3000; // 3 seconds

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = 3001;

// Initialize database
initDatabase();

// Serve static files from client/dist in production
app.use(express.static(path.join(__dirname, '../client/dist')));

// Throttle map for position updates (socketId -> lastUpdateTime)
const positionUpdateThrottle = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[SERVER] Player connected: ${socket.id}`);

  // Send welcome message with socket ID
  socket.emit('welcome', {
    playerId: socket.id,
    message: 'Connected to VoxelWars server!'
  });

  // Handle player join event
  socket.on('join', ({ username }) => {
    const player = GameLogic.addPlayer(socket.id, username);

    // Send player list to the joining player
    socket.emit('player-list', {
      players: GameLogic.getOtherPlayers(socket.id)
    });

    // Broadcast to other players that a new player joined
    socket.broadcast.emit('player-joined', {
      player: {
        id: player.id,
        username: player.username,
        position: player.position,
        rotation: player.rotation,
        health: player.health
      }
    });
  });

  // Handle player list request
  socket.on('player-list-request', () => {
    socket.emit('player-list', {
      players: GameLogic.getAllPlayers()
    });
  });

  // Handle chunk requests
  socket.on('requestChunk', async ({ chunkX, chunkZ }) => {
    try {
      const chunkData = await getOrGenerateChunk(chunkX, chunkZ);
      socket.emit('chunkData', {
        chunkX,
        chunkZ,
        data: chunkData
      });
    } catch (error) {
      console.error(`[SERVER] Error loading chunk (${chunkX}, ${chunkZ}):`, error);
      socket.emit('chunkError', { chunkX, chunkZ, error: error.message });
    }
  });

  // Handle player position updates (throttled to 20/sec = 50ms)
  socket.on('move', ({ position, rotation }) => {
    const now = Date.now();
    const lastUpdate = positionUpdateThrottle.get(socket.id) || 0;

    // Throttle: Only process if 50ms have passed since last update
    if (now - lastUpdate >= 50) {
      const player = GameLogic.updatePlayerPosition(socket.id, position, rotation);
      if (player) {
        positionUpdateThrottle.set(socket.id, now);

        // Broadcast position to other players
        socket.broadcast.emit('player-moved', {
          playerId: socket.id,
          position,
          rotation
        });
      }
    }
  });

  // Handle block placement
  socket.on('place-block', async ({ chunkX, chunkZ, localX, localY, localZ, blockType }) => {
    try {
      console.log(`[SERVER] Player ${socket.id} placing ${blockType} at chunk(${chunkX}, ${chunkZ}) local(${localX}, ${localY}, ${localZ})`);

      // Update chunk in database
      await updateBlock(chunkX, chunkZ, localX, localY, localZ, blockType);

      // Broadcast block update to all players (including sender for confirmation)
      io.emit('block-update', {
        chunkX,
        chunkZ,
        localX,
        localY,
        localZ,
        blockType
      });
    } catch (error) {
      console.error('[SERVER] Error placing block:', error);
    }
  });

  // Handle block destruction
  socket.on('break-block', async ({ chunkX, chunkZ, localX, localY, localZ }) => {
    try {
      console.log(`[SERVER] Player ${socket.id} breaking block at chunk(${chunkX}, ${chunkZ}) local(${localX}, ${localY}, ${localZ})`);

      // Update chunk in database (set to air)
      await updateBlock(chunkX, chunkZ, localX, localY, localZ, 'air');

      // Broadcast block update to all players (including sender for confirmation)
      io.emit('block-update', {
        chunkX,
        chunkZ,
        localX,
        localY,
        localZ,
        blockType: 'air'
      });
    } catch (error) {
      console.error('[SERVER] Error breaking block:', error);
    }
  });

  // Handle attack
  socket.on('attack', ({ targetPlayerId }) => {
    const attacker = GameLogic.getPlayer(socket.id);
    const target = GameLogic.getPlayer(targetPlayerId);

    if (!attacker || !target) {
      console.log('[SERVER] Attack failed: player not found');
      return;
    }

    // Validate range
    if (!GameLogic.arePlayersInRange(attacker, target, ATTACK_RANGE)) {
      console.log('[SERVER] Attack failed: out of range');
      return;
    }

    // Damage target
    GameLogic.damagePlayer(targetPlayerId, ATTACK_DAMAGE);
    const damagedTarget = GameLogic.getPlayer(targetPlayerId);

    console.log(`[SERVER] ${attacker.username} attacked ${target.username} for ${ATTACK_DAMAGE} damage`);

    // Notify target they took damage
    io.to(targetPlayerId).emit('take-damage', {
      amount: ATTACK_DAMAGE,
      from: attacker.username,
      health: damagedTarget.health
    });

    // Check if target died
    if (damagedTarget.health <= 0) {
      console.log(`[SERVER] ${target.username} died`);

      // Broadcast death
      io.emit('player-died', {
        playerId: targetPlayerId,
        killedBy: attacker.username
      });

      // Schedule respawn
      setTimeout(() => {
        const respawnedPlayer = GameLogic.respawnPlayer(targetPlayerId);
        if (respawnedPlayer) {
          console.log(`[SERVER] ${respawnedPlayer.username} respawned`);

          // Notify player of respawn
          io.to(targetPlayerId).emit('player-respawn', {
            position: respawnedPlayer.position,
            health: respawnedPlayer.health
          });

          // Broadcast position update
          io.emit('player-moved', {
            playerId: targetPlayerId,
            position: respawnedPlayer.position,
            rotation: respawnedPlayer.rotation
          });
        }
      }, RESPAWN_DELAY);
    }
  });

  // Handle chat messages
  socket.on('chat-message', ({ message }) => {
    const player = GameLogic.getPlayer(socket.id);
    if (player && message && message.trim()) {
      console.log(`[SERVER] Chat from ${player.username}: ${message}`);

      // Broadcast to all players
      io.emit('chat-message', {
        username: player.username,
        message: message.trim(),
        timestamp: Date.now()
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const player = GameLogic.removePlayer(socket.id);
    positionUpdateThrottle.delete(socket.id);

    if (player) {
      // Broadcast to other players that this player left
      socket.broadcast.emit('player-left', {
        playerId: socket.id,
        username: player.username
      });
    }
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    players: GameLogic.getPlayerCount(),
    uptime: process.uptime()
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`[SERVER] VoxelWars server running on port ${PORT}`);
  console.log(`[SERVER] Ready to accept connections`);
});
