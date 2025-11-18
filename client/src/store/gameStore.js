import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  // Current player
  currentPlayer: null,

  // Other players (Map: playerId -> playerData)
  otherPlayers: new Map(),

  // Chunks (Map: "x,z" -> chunkData)
  chunks: new Map(),

  // Inventory
  inventory: {},

  // ===== PLAYER ACTIONS =====

  /**
   * Set current player
   */
  setCurrentPlayer: (player) => set({ currentPlayer: player }),

  /**
   * Add or update another player
   */
  addPlayer: (player) => set((state) => {
    const newPlayers = new Map(state.otherPlayers);
    newPlayers.set(player.id, player);
    return { otherPlayers: newPlayers };
  }),

  /**
   * Remove a player
   */
  removePlayer: (playerId) => set((state) => {
    const newPlayers = new Map(state.otherPlayers);
    newPlayers.delete(playerId);
    return { otherPlayers: newPlayers };
  }),

  /**
   * Update player position
   */
  updatePlayerPosition: (playerId, position, rotation) => set((state) => {
    const newPlayers = new Map(state.otherPlayers);
    const player = newPlayers.get(playerId);

    if (player) {
      newPlayers.set(playerId, {
        ...player,
        position,
        rotation: rotation || player.rotation
      });
    }

    return { otherPlayers: newPlayers };
  }),

  /**
   * Get all other players as array
   */
  getOtherPlayersArray: () => {
    return Array.from(get().otherPlayers.values());
  },

  // ===== CHUNK ACTIONS =====

  /**
   * Add a chunk
   */
  addChunk: (chunkX, chunkZ, chunkData) => set((state) => {
    const newChunks = new Map(state.chunks);
    const key = `${chunkX},${chunkZ}`;
    newChunks.set(key, { x: chunkX, z: chunkZ, data: chunkData });
    return { chunks: newChunks };
  }),

  /**
   * Get chunk
   */
  getChunk: (chunkX, chunkZ) => {
    const key = `${chunkX},${chunkZ}`;
    return get().chunks.get(key);
  },

  /**
   * Remove chunk
   */
  removeChunk: (chunkX, chunkZ) => set((state) => {
    const newChunks = new Map(state.chunks);
    const key = `${chunkX},${chunkZ}`;
    newChunks.delete(key);
    return { chunks: newChunks };
  }),

  /**
   * Get all chunks as array
   */
  getAllChunks: () => {
    return Array.from(get().chunks.values());
  },

  // ===== INVENTORY ACTIONS =====

  /**
   * Update inventory
   */
  setInventory: (inventory) => set({ inventory }),

  /**
   * Add item to inventory
   */
  addItem: (itemType, count = 1) => set((state) => {
    const newInventory = { ...state.inventory };
    newInventory[itemType] = (newInventory[itemType] || 0) + count;
    return { inventory: newInventory };
  }),

  /**
   * Remove item from inventory
   */
  removeItem: (itemType, count = 1) => set((state) => {
    const newInventory = { ...state.inventory };
    if (newInventory[itemType]) {
      newInventory[itemType] = Math.max(0, newInventory[itemType] - count);
      if (newInventory[itemType] === 0) {
        delete newInventory[itemType];
      }
    }
    return { inventory: newInventory };
  }),

  // ===== UTILITY ACTIONS =====

  /**
   * Reset store
   */
  reset: () => set({
    currentPlayer: null,
    otherPlayers: new Map(),
    chunks: new Map(),
    inventory: {}
  })
}));

export default useGameStore;
