import { useEffect, useRef } from 'react';

/**
 * Mini map component showing player position and terrain
 */
export default function MiniMap({ player, world, otherPlayers = [] }) {
  const canvasRef = useRef(null);
  const MAP_SIZE = 150; // Size of mini map in pixels
  const VIEW_RADIUS = 50; // How many blocks to show around player

  useEffect(() => {
    if (!player || !world || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

      const playerPos = player.getPosition();

      // Draw terrain chunks
      const centerX = Math.floor(playerPos.x);
      const centerZ = Math.floor(playerPos.z);

      for (let x = centerX - VIEW_RADIUS; x < centerX + VIEW_RADIUS; x++) {
        for (let z = centerZ - VIEW_RADIUS; z < centerZ + VIEW_RADIUS; z++) {
          // Convert world coords to screen coords
          const screenX = ((x - centerX) / VIEW_RADIUS) * (MAP_SIZE / 2) + MAP_SIZE / 2;
          const screenZ = ((z - centerZ) / VIEW_RADIUS) * (MAP_SIZE / 2) + MAP_SIZE / 2;

          // Sample terrain height to determine color
          const blockType = world.getBlockAt(x, 20, z); // Sample at middle height

          if (blockType && blockType !== 'air') {
            // Color based on block type
            let color = '#4a4a4a'; // Default gray

            if (blockType === 'grass') color = '#7EC850';
            else if (blockType === 'sand') color = '#F4E4C1';
            else if (blockType === 'water') color = '#4A90E2';
            else if (blockType === 'snow') color = '#FFFFFF';
            else if (blockType === 'stone') color = '#808080';

            ctx.fillStyle = color;
            ctx.fillRect(screenX, screenZ, 2, 2);
          }
        }
      }

      // Draw grid lines
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const pos = (i / 4) * MAP_SIZE;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, MAP_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(MAP_SIZE, pos);
        ctx.stroke();
      }

      // Draw other players
      otherPlayers.forEach(other => {
        const dx = other.position.x - centerX;
        const dz = other.position.z - centerZ;

        if (Math.abs(dx) < VIEW_RADIUS && Math.abs(dz) < VIEW_RADIUS) {
          const screenX = (dx / VIEW_RADIUS) * (MAP_SIZE / 2) + MAP_SIZE / 2;
          const screenZ = (dz / VIEW_RADIUS) * (MAP_SIZE / 2) + MAP_SIZE / 2;

          // Draw player dot
          ctx.fillStyle = '#FF6B6B';
          ctx.beginPath();
          ctx.arc(screenX, screenZ, 3, 0, Math.PI * 2);
          ctx.fill();

          // Draw player name
          ctx.fillStyle = '#FFF';
          ctx.font = '10px monospace';
          ctx.fillText(other.username, screenX + 5, screenZ);
        }
      });

      // Draw player in center (yellow dot)
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(MAP_SIZE / 2, MAP_SIZE / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw player direction indicator
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(MAP_SIZE / 2, MAP_SIZE / 2);
      const angle = player.rotation?.y || 0;
      ctx.lineTo(
        MAP_SIZE / 2 + Math.sin(angle) * 10,
        MAP_SIZE / 2 + Math.cos(angle) * 10
      );
      ctx.stroke();

      // Draw border
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [player, world, otherPlayers]);

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '10px',
      padding: '10px',
      border: '2px solid #666',
      zIndex: 100
    }}>
      <div style={{
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        marginBottom: '5px',
        textAlign: 'center'
      }}>
        Mini Map
      </div>
      <canvas
        ref={canvasRef}
        width={MAP_SIZE}
        height={MAP_SIZE}
        style={{
          display: 'block',
          imageRendering: 'pixelated'
        }}
      />
      {player && (
        <div style={{
          color: '#aaa',
          fontFamily: 'monospace',
          fontSize: '10px',
          marginTop: '5px',
          textAlign: 'center'
        }}>
          X: {Math.floor(player.getPosition().x)} Z: {Math.floor(player.getPosition().z)}
        </div>
      )}
    </div>
  );
}
