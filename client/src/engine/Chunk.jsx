import { useMemo } from 'react';
import { createChunkMesh } from './VoxelMesh';

const CHUNK_SIZE = 16;

/**
 * Chunk component that renders a voxel chunk
 * @param {Object} props
 * @param {number} props.chunkX - Chunk X coordinate
 * @param {number} props.chunkZ - Chunk Z coordinate
 * @param {Array} props.chunkData - 3D array of block types [x][y][z]
 */
export default function Chunk({ chunkX, chunkZ, chunkData }) {
  // Generate mesh from chunk data (memoized to avoid regenerating on every render)
  const mesh = useMemo(() => {
    if (!chunkData) return null;

    console.log(`[CHUNK] Generating mesh for chunk (${chunkX}, ${chunkZ})`);
    const generatedMesh = createChunkMesh(chunkData);

    if (!generatedMesh) {
      console.log(`[CHUNK] Chunk (${chunkX}, ${chunkZ}) is empty`);
      return null;
    }

    return generatedMesh;
  }, [chunkX, chunkZ, chunkData]);

  if (!mesh) {
    return null;
  }

  // Position chunk at world coordinates
  const worldX = chunkX * CHUNK_SIZE;
  const worldZ = chunkZ * CHUNK_SIZE;

  return (
    <primitive
      object={mesh}
      position={[worldX, 0, worldZ]}
    />
  );
}
