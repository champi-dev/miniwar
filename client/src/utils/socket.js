import { io } from 'socket.io-client';

// Connect to the server
const socket = io('http://localhost:3001', {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Connection event handlers
socket.on('connect', () => {
  console.log('[SOCKET] Connected to server:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('[SOCKET] Disconnected from server:', reason);
});

socket.on('connect_error', (error) => {
  console.error('[SOCKET] Connection error:', error);
});

socket.on('welcome', (data) => {
  console.log('[SOCKET] Welcome message:', data);
});

// ===== EMITTERS =====

/**
 * Emit join event to server
 */
export function emitJoin(username) {
  socket.emit('join', { username });
  console.log('[SOCKET] Emitted join:', username);
}

/**
 * Emit player movement to server
 */
export function emitMove(position, rotation) {
  socket.emit('move', { position, rotation });
}

/**
 * Request a chunk from the server
 */
export function requestChunk(chunkX, chunkZ) {
  socket.emit('requestChunk', { chunkX, chunkZ });
}

/**
 * Request player list from server
 */
export function requestPlayerList() {
  socket.emit('player-list-request');
}

/**
 * Emit block placement to server
 */
export function emitPlaceBlock(chunkX, chunkZ, localX, localY, localZ, blockType) {
  socket.emit('place-block', { chunkX, chunkZ, localX, localY, localZ, blockType });
  console.log('[SOCKET] Emitted place-block:', { chunkX, chunkZ, localX, localY, localZ, blockType });
}

/**
 * Emit block breaking to server
 */
export function emitBreakBlock(chunkX, chunkZ, localX, localY, localZ) {
  socket.emit('break-block', { chunkX, chunkZ, localX, localY, localZ });
  console.log('[SOCKET] Emitted break-block:', { chunkX, chunkZ, localX, localY, localZ });
}

/**
 * Emit attack to server
 */
export function emitAttack(targetPlayerId) {
  socket.emit('attack', { targetPlayerId });
  console.log('[SOCKET] Emitted attack:', targetPlayerId);
}

/**
 * Emit chat message to server
 */
export function emitChatMessage(message) {
  socket.emit('chat-message', { message });
}

// ===== LISTENERS =====

/**
 * Listen for player joined event
 */
export function onPlayerJoined(callback) {
  socket.on('player-joined', callback);
  return () => socket.off('player-joined', callback);
}

/**
 * Listen for player moved event
 */
export function onPlayerMoved(callback) {
  socket.on('player-moved', callback);
  return () => socket.off('player-moved', callback);
}

/**
 * Listen for player left event
 */
export function onPlayerLeft(callback) {
  socket.on('player-left', callback);
  return () => socket.off('player-left', callback);
}

/**
 * Listen for chunk data event
 */
export function onChunkData(callback) {
  socket.on('chunkData', callback);
  return () => socket.off('chunkData', callback);
}

/**
 * Listen for player list event
 */
export function onPlayerList(callback) {
  socket.on('player-list', callback);
  return () => socket.off('player-list', callback);
}

/**
 * Listen for chunk error event
 */
export function onChunkError(callback) {
  socket.on('chunkError', callback);
  return () => socket.off('chunkError', callback);
}

/**
 * Listen for block update event (when any player places/breaks a block)
 */
export function onBlockUpdate(callback) {
  socket.on('block-update', callback);
  return () => socket.off('block-update', callback);
}

/**
 * Listen for take damage event
 */
export function onTakeDamage(callback) {
  socket.on('take-damage', callback);
  return () => socket.off('take-damage', callback);
}

/**
 * Listen for player death event
 */
export function onPlayerDied(callback) {
  socket.on('player-died', callback);
  return () => socket.off('player-died', callback);
}

/**
 * Listen for player respawn event
 */
export function onPlayerRespawn(callback) {
  socket.on('player-respawn', callback);
  return () => socket.off('player-respawn', callback);
}

/**
 * Listen for chat message event
 */
export function onChatMessage(callback) {
  socket.on('chat-message', callback);
  return () => socket.off('chat-message', callback);
}

export default socket;
