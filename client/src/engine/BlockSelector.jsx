import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { castRay } from '../utils/raycaster';

/**
 * Component that shows a wireframe outline around the block the player is looking at
 * @param {Object} props
 * @param {World} props.world - The world instance
 * @param {Function} props.onTargetChange - Callback when target block changes
 */
export default function BlockSelector({ world, onTargetChange }) {
  const { camera } = useThree();
  const meshRef = useRef();
  const currentTarget = useRef(null);

  useFrame(() => {
    if (!world || !meshRef.current) return;

    // Cast ray to find target block
    const rayResult = castRay(camera, world);

    if (rayResult && rayResult.hit) {
      // Position the selector box at the target block
      const { blockPosition } = rayResult;
      meshRef.current.position.set(
        blockPosition.x + 0.5,
        blockPosition.y + 0.5,
        blockPosition.z + 0.5
      );
      meshRef.current.visible = true;

      // Notify parent component if target changed
      if (onTargetChange) {
        const targetKey = `${blockPosition.x},${blockPosition.y},${blockPosition.z}`;
        if (!currentTarget.current || currentTarget.current !== targetKey) {
          currentTarget.current = targetKey;
          onTargetChange(rayResult);
        }
      }
    } else {
      // No block targeted
      meshRef.current.visible = false;
      if (currentTarget.current) {
        currentTarget.current = null;
        if (onTargetChange) {
          onTargetChange(null);
        }
      }
    }
  });

  // Create wireframe box geometry
  const geometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
  const edges = new THREE.EdgesGeometry(geometry);

  return (
    <lineSegments ref={meshRef} visible={false}>
      <primitive object={edges} attach="geometry" />
      <lineBasicMaterial attach="material" color="black" linewidth={2} />
    </lineSegments>
  );
}
