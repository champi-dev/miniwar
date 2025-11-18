import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Component to render other players in the game
 * @param {Object} props
 * @param {string} props.playerId - Player ID
 * @param {string} props.username - Player username
 * @param {Object} props.position - Target position {x, y, z}
 * @param {Object} props.rotation - Player rotation {x, y}
 */
export default function OtherPlayer({ playerId, username, position, rotation }) {
  const meshRef = useRef();
  const targetPosition = useRef(new THREE.Vector3(position.x, position.y, position.z));
  const currentPosition = useRef(new THREE.Vector3(position.x, position.y, position.z));

  // Update target position when prop changes
  useFrame(() => {
    if (!meshRef.current) return;

    // Update target
    targetPosition.current.set(position.x, position.y, position.z);

    // Smooth interpolation (lerp) between current and target position
    currentPosition.current.lerp(targetPosition.current, 0.15);

    // Apply to mesh
    meshRef.current.position.copy(currentPosition.current);

    // Apply rotation if provided
    if (rotation) {
      meshRef.current.rotation.y = rotation.y || 0;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Player capsule/body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.4, 1.2, 8, 16]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>

      {/* Username label above player */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {username}
      </Text>
    </group>
  );
}
