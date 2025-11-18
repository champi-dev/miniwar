// Game logic and player state management

// Active players Map: socketId -> playerData
const activePlayers = new Map();

/**
 * Add a new player to the active players list
 */
export function addPlayer(socketId, username) {
  const playerData = {
    id: socketId,
    username: username || `Player_${socketId.substring(0, 4)}`,
    position: { x: 0, y: 20, z: 0 },
    rotation: { x: 0, y: 0 },
    health: 100,
    inventory: {},
    joinedAt: Date.now()
  };

  activePlayers.set(socketId, playerData);
  console.log(`[GAME] Player joined: ${playerData.username} (${socketId})`);

  return playerData;
}

/**
 * Remove a player from the active players list
 */
export function removePlayer(socketId) {
  const player = activePlayers.get(socketId);
  if (player) {
    activePlayers.delete(socketId);
    console.log(`[GAME] Player left: ${player.username} (${socketId})`);
    return player;
  }
  return null;
}

/**
 * Update a player's position
 */
export function updatePlayerPosition(socketId, position, rotation) {
  const player = activePlayers.get(socketId);
  if (player) {
    player.position = position;
    if (rotation) {
      player.rotation = rotation;
    }
    return player;
  }
  return null;
}

/**
 * Get a player by socket ID
 */
export function getPlayer(socketId) {
  return activePlayers.get(socketId);
}

/**
 * Get all active players
 */
export function getAllPlayers() {
  return Array.from(activePlayers.values());
}

/**
 * Get all players except the specified one
 */
export function getOtherPlayers(socketId) {
  return Array.from(activePlayers.values()).filter(p => p.id !== socketId);
}

/**
 * Get player count
 */
export function getPlayerCount() {
  return activePlayers.size;
}

/**
 * Update player health
 */
export function updatePlayerHealth(socketId, health) {
  const player = activePlayers.get(socketId);
  if (player) {
    player.health = Math.max(0, Math.min(100, health));
    return player;
  }
  return null;
}

/**
 * Update player inventory
 */
export function updatePlayerInventory(socketId, inventory) {
  const player = activePlayers.get(socketId);
  if (player) {
    player.inventory = inventory;
    return player;
  }
  return null;
}

/**
 * Damage a player
 */
export function damagePlayer(socketId, amount) {
  const player = activePlayers.get(socketId);
  if (player) {
    player.health = Math.max(0, player.health - amount);
    console.log(`[GAME] Player ${player.username} took ${amount} damage. Health: ${player.health}`);
    return player;
  }
  return null;
}

/**
 * Respawn a player
 */
export function respawnPlayer(socketId) {
  const player = activePlayers.get(socketId);
  if (player) {
    player.health = 100;
    player.position = { x: 0, y: 50, z: 0 }; // Spawn at higher position
    console.log(`[GAME] Player ${player.username} respawned`);
    return player;
  }
  return null;
}

/**
 * Check if two players are within range
 */
export function arePlayersInRange(player1, player2, maxDistance) {
  if (!player1 || !player2) return false;

  const dx = player1.position.x - player2.position.x;
  const dy = player1.position.y - player2.position.y;
  const dz = player1.position.z - player2.position.z;

  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return distance <= maxDistance;
}
