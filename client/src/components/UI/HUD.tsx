import { useGameStore } from '../../store/gameStore';

export default function HUD() {
  const { players, playerId, deathMessage } = useGameStore();

  const currentPlayer = players.find((p) => p.id === playerId);

  if (!currentPlayer) return null;

  const healthPercentage = (currentPlayer.health / currentPlayer.maxHealth) * 100;
  const isLowHealth = healthPercentage < 30;

  return (
    <>
      {/* Health Bar */}
      <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-80 p-4 rounded-lg border border-gray-700 min-w-[250px]">
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300 font-semibold">{currentPlayer.username}</span>
            <span className={`font-bold ${isLowHealth ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {currentPlayer.health} / {currentPlayer.maxHealth} HP
            </span>
          </div>
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                isLowHealth ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${healthPercentage}%` }}
            />
          </div>
        </div>

        {/* Score Info */}
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-gray-400">Score: </span>
            <span className="text-white font-bold">{currentPlayer.score}</span>
          </div>
          <div>
            <span className="text-gray-400">K/D: </span>
            <span className="text-white font-bold">
              {currentPlayer.kills}/{currentPlayer.deaths}
            </span>
          </div>
        </div>
      </div>

      {/* Player Count */}
      <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-80 px-4 py-2 rounded-lg border border-gray-700">
        <span className="text-gray-300 text-sm">
          <span className="text-green-400 font-bold">{players.length}</span> players online
        </span>
      </div>

      {/* Death Message */}
      {deathMessage && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-900 bg-opacity-90 px-8 py-4 rounded-lg border-2 border-red-500 animate-pulse">
          <p className="text-white text-xl font-bold text-center">{deathMessage}</p>
        </div>
      )}

      {/* Low Health Warning */}
      {isLowHealth && currentPlayer.isAlive && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-4 border-red-500 animate-pulse" />
        </div>
      )}

      {/* Controls Hint */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-70 px-4 py-2 rounded-lg text-xs text-gray-400">
        Press <span className="text-white font-mono">TAB</span> for leaderboard
      </div>
    </>
  );
}
