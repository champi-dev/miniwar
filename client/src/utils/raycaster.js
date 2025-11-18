import * as THREE from 'three';

const CHUNK_SIZE = 16;
const CHUNK_HEIGHT = 64;
const MAX_DISTANCE = 5; // Maximum reach distance in blocks

/**
 * Cast a ray from the camera to find the block the player is looking at
 * @param {THREE.Camera} camera - The player's camera
 * @param {World} world - The world instance with chunks
 * @returns {Object|null} - {hit: boolean, blockPosition: {x,y,z}, faceNormal: {x,y,z}, chunkCoords: {x,z}, adjacentPosition: {x,y,z}} or null
 */
export function castRay(camera, world) {
  if (!world) return null;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera); // Center of screen

  const origin = raycaster.ray.origin.clone();
  const direction = raycaster.ray.direction.clone();

  // Step along the ray and check for block collisions
  const step = 0.1; // Step size for raymarching
  let currentPos = origin.clone();

  for (let distance = 0; distance < MAX_DISTANCE; distance += step) {
    currentPos.add(direction.clone().multiplyScalar(step));

    // Convert world position to block coordinates
    const blockX = Math.floor(currentPos.x);
    const blockY = Math.floor(currentPos.y);
    const blockZ = Math.floor(currentPos.z);

    // Check if this position is out of bounds
    if (blockY < 0 || blockY >= CHUNK_HEIGHT) continue;

    // Get chunk coordinates
    const chunkX = Math.floor(blockX / CHUNK_SIZE);
    const chunkZ = Math.floor(blockZ / CHUNK_SIZE);

    // Get local coordinates within chunk
    const localX = ((blockX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localY = blockY;
    const localZ = ((blockZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    // Get the chunk
    const chunk = world.getChunk(chunkX, chunkZ);
    if (!chunk) continue;

    // Check if there's a block at this position
    const blockType = chunk.data[localX]?.[localY]?.[localZ];

    if (blockType && blockType !== 'air') {
      // We hit a block! Now determine which face we hit
      const blockCenter = new THREE.Vector3(blockX + 0.5, blockY + 0.5, blockZ + 0.5);
      const hitPoint = currentPos.clone();
      const localHit = hitPoint.sub(blockCenter); // Position relative to block center

      // Determine which face was hit based on which component is largest
      let faceNormal = { x: 0, y: 0, z: 0 };
      const absX = Math.abs(localHit.x);
      const absY = Math.abs(localHit.y);
      const absZ = Math.abs(localHit.z);

      if (absX > absY && absX > absZ) {
        faceNormal.x = localHit.x > 0 ? 1 : -1;
      } else if (absY > absX && absY > absZ) {
        faceNormal.y = localHit.y > 0 ? 1 : -1;
      } else {
        faceNormal.z = localHit.z > 0 ? 1 : -1;
      }

      // Calculate adjacent block position (for placement)
      const adjacentPosition = {
        x: blockX + faceNormal.x,
        y: blockY + faceNormal.y,
        z: blockZ + faceNormal.z
      };

      return {
        hit: true,
        blockPosition: { x: blockX, y: blockY, z: blockZ },
        faceNormal,
        chunkCoords: { x: chunkX, z: chunkZ },
        localPosition: { x: localX, y: localY, z: localZ },
        adjacentPosition,
        blockType
      };
    }
  }

  return null;
}

/**
 * Check if a position would collide with a player
 * @param {Object} position - {x, y, z} world position
 * @param {Player} localPlayer - The local player
 * @param {Array} otherPlayers - Array of other players
 * @returns {boolean} - True if position collides with any player
 */
export function checkPlayerCollision(position, localPlayer, otherPlayers = []) {
  // Check collision with local player
  if (localPlayer) {
    const playerPos = localPlayer.getPosition();
    const dx = Math.abs(position.x - playerPos.x);
    const dy = Math.abs(position.y - playerPos.y);
    const dz = Math.abs(position.z - playerPos.z);

    // Player occupies roughly 1x2x1 space
    if (dx < 1 && dy < 2 && dz < 1) {
      return true;
    }
  }

  // Check collision with other players
  for (const player of otherPlayers) {
    const dx = Math.abs(position.x - player.position.x);
    const dy = Math.abs(position.y - player.position.y);
    const dz = Math.abs(position.z - player.position.z);

    if (dx < 1 && dy < 2 && dz < 1) {
      return true;
    }
  }

  return false;
}
