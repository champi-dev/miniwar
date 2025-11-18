const CHUNK_SIZE = 16;
const LOAD_RADIUS = 3; // Load chunks within this radius
const UNLOAD_DISTANCE = 5; // Unload chunks beyond this distance

export default class World {
  constructor(socket) {
    this.socket = socket;
    this.chunks = new Map(); // Key: "x,z", Value: chunkData
    this.loadingChunks = new Set(); // Track chunks currently being loaded
    this.listeners = new Set(); // Callbacks to notify when chunks change

    this.setupSocketListeners();
  }

  setupSocketListeners() {
    // Listen for chunk data from server
    this.socket.on('chunkData', ({ chunkX, chunkZ, data }) => {
      console.log(`[WORLD] Received chunk (${chunkX}, ${chunkZ})`);
      const key = this.getChunkKey(chunkX, chunkZ);
      this.chunks.set(key, { x: chunkX, z: chunkZ, data });
      this.loadingChunks.delete(key);
      this.notifyListeners();
    });

    this.socket.on('chunkError', ({ chunkX, chunkZ, error }) => {
      console.error(`[WORLD] Error loading chunk (${chunkX}, ${chunkZ}):`, error);
      const key = this.getChunkKey(chunkX, chunkZ);
      this.loadingChunks.delete(key);
    });
  }

  /**
   * Get chunk key for Map storage
   */
  getChunkKey(chunkX, chunkZ) {
    return `${chunkX},${chunkZ}`;
  }

  /**
   * Get chunk coordinates from world position
   */
  getChunkAtPosition(worldX, worldZ) {
    return {
      x: Math.floor(worldX / CHUNK_SIZE),
      z: Math.floor(worldZ / CHUNK_SIZE)
    };
  }

  /**
   * Load a chunk from the server
   */
  loadChunk(chunkX, chunkZ) {
    const key = this.getChunkKey(chunkX, chunkZ);

    // Don't load if already loaded or loading
    if (this.chunks.has(key) || this.loadingChunks.has(key)) {
      return;
    }

    console.log(`[WORLD] Requesting chunk (${chunkX}, ${chunkZ})`);
    this.loadingChunks.add(key);
    this.socket.emit('requestChunk', { chunkX, chunkZ });
  }

  /**
   * Get chunk data
   */
  getChunk(chunkX, chunkZ) {
    const key = this.getChunkKey(chunkX, chunkZ);
    return this.chunks.get(key);
  }

  /**
   * Get all loaded chunks
   */
  getAllChunks() {
    return Array.from(this.chunks.values());
  }

  /**
   * Update loaded chunks based on player position
   */
  updateChunks(playerX, playerZ) {
    const playerChunk = this.getChunkAtPosition(playerX, playerZ);

    // Load chunks in radius around player
    for (let x = playerChunk.x - LOAD_RADIUS; x <= playerChunk.x + LOAD_RADIUS; x++) {
      for (let z = playerChunk.z - LOAD_RADIUS; z <= playerChunk.z + LOAD_RADIUS; z++) {
        this.loadChunk(x, z);
      }
    }

    // Unload chunks that are too far away
    const chunksToUnload = [];
    for (const [key, chunk] of this.chunks.entries()) {
      const dx = chunk.x - playerChunk.x;
      const dz = chunk.z - playerChunk.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance > UNLOAD_DISTANCE) {
        chunksToUnload.push(key);
      }
    }

    if (chunksToUnload.length > 0) {
      console.log(`[WORLD] Unloading ${chunksToUnload.length} chunks`);
      for (const key of chunksToUnload) {
        this.chunks.delete(key);
      }
      this.notifyListeners();
    }
  }

  /**
   * Update a single block in a chunk
   */
  updateBlock(chunkX, chunkZ, localX, localY, localZ, blockType) {
    const key = this.getChunkKey(chunkX, chunkZ);
    const chunk = this.chunks.get(key);

    if (!chunk) {
      console.warn(`[WORLD] Cannot update block - chunk (${chunkX}, ${chunkZ}) not loaded`);
      return;
    }

    // Update block in chunk data
    if (chunk.data[localX] && chunk.data[localX][localY]) {
      chunk.data[localX][localY][localZ] = blockType;
      console.log(`[WORLD] Updated block at chunk(${chunkX}, ${chunkZ}) local(${localX}, ${localY}, ${localZ}) to ${blockType}`);

      // Notify listeners to re-render chunks
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to chunk updates
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of chunk changes
   */
  notifyListeners() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.chunks.clear();
    this.loadingChunks.clear();
    this.listeners.clear();
  }
}
