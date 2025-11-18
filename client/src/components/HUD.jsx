import useInventoryStore from '../store/inventoryStore';
import useGameStore from '../store/gameStore';
import { BlockType, BlockColors } from '../engine/Block';

const blockEmojis = {
  [BlockType.GRASS]: '🌱',
  [BlockType.DIRT]: '🟤',
  [BlockType.STONE]: '⛰️'
};

export default function HUD({ player, isLocked, isDead, respawnTimer, health }) {
  const inventory = useInventoryStore((state) => state.inventory);
  const hotbar = useInventoryStore((state) => state.hotbar);
  const selectedSlot = useInventoryStore((state) => state.selectedSlot);
  const otherPlayers = useGameStore((state) => state.otherPlayers);

  const getBlockName = (blockType) => {
    if (!blockType) return 'Empty';
    return blockType.charAt(0).toUpperCase() + blockType.slice(1);
  };

  const healthPercent = Math.max(0, Math.min(100, health || player?.getHealth() || 100));
  const healthColor = healthPercent > 60 ? '#4ade80' : healthPercent > 30 ? '#fbbf24' : '#ef4444';

  // Death screen
  if (isDead) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-500 mb-4">YOU DIED</h1>
          <p className="text-2xl text-white">
            Respawning in {Math.ceil(respawnTimer / 1000)}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top-left info panel */}
      <div
        className="absolute top-5 left-5"
        style={{ opacity: isLocked ? 1 : 0.5 }}
      >
        {/* Health bar */}
        <div className="mb-3 bg-black bg-opacity-50 rounded-lg p-3 min-w-[200px]">
          <div className="text-white font-mono text-sm mb-2">Health</div>
          <div className="w-full h-6 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
              style={{
                width: `${healthPercent}%`,
                background: `linear-gradient(90deg, ${healthColor} 0%, ${healthColor}dd 100%)`
              }}
            >
              {healthPercent}%
            </div>
          </div>
        </div>

        {/* Player info */}
        <div className="bg-black bg-opacity-50 rounded-lg p-3">
          <div className="text-white font-mono text-sm space-y-1">
            <div className="text-blue-400">Player: {player?.username || 'Unknown'}</div>
            <div>
              Position: {player
                ? `${player.position.x.toFixed(0)}, ${player.position.y.toFixed(0)}, ${player.position.z.toFixed(0)}`
                : 'Loading...'}
            </div>
            <div>Players: {otherPlayers.size + 1}</div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="text-white font-mono text-xs text-gray-300 mb-2">Inventory</div>
            <div className="space-y-1">
              {Object.entries(inventory).filter(([_, count]) => count > 0).map(([blockType, count]) => (
                <div key={blockType} className="text-white font-mono text-xs flex items-center gap-2">
                  <span>{blockEmojis[blockType] || '■'}</span>
                  <span className="text-gray-300">{getBlockName(blockType)}:</span>
                  <span className="text-white font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hotbar at bottom */}
      {isLocked && (
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-2">
          {hotbar.map((blockType, index) => {
            const isSelected = index === selectedSlot;
            const count = blockType ? (inventory[blockType] || 0) : 0;

            return (
              <div
                key={index}
                className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg transition-all ${
                  isSelected
                    ? 'bg-white bg-opacity-30 border-2 border-white scale-110'
                    : 'bg-black bg-opacity-50 border-2 border-gray-600'
                }`}
              >
                {/* Slot number */}
                <div className="absolute top-0.5 left-1 text-[10px] text-gray-400">
                  {index + 1}
                </div>

                {/* Block preview */}
                {blockType && (
                  <>
                    <div className="text-2xl">{blockEmojis[blockType] || '■'}</div>
                    <div className="text-[10px] text-white font-mono font-bold">
                      {count}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Crosshair */}
      {isLocked && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative w-5 h-5">
            {/* Horizontal line */}
            <div className="absolute w-5 h-0.5 bg-white top-1/2 left-0 transform -translate-y-1/2 shadow-lg" />
            {/* Vertical line */}
            <div className="absolute w-0.5 h-5 bg-white left-1/2 top-0 transform -translate-x-1/2 shadow-lg" />
          </div>
        </div>
      )}

      {/* Controls info */}
      {isLocked && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
          <div className="text-white font-mono text-xs text-center space-y-1">
            <div>WASD: Move | SPACE: Jump | Mouse: Look</div>
            <div>Left Click: Break/Attack | Right Click: Place | 1-5: Select | T: Chat</div>
          </div>
        </div>
      )}
    </>
  );
}
