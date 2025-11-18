import { useGameStore } from '../../store/gameStore';

export default function Leaderboard() {
  const { leaderboard, showLeaderboard, playerId } = useGameStore();

  if (!showLeaderboard) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-700 w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-lg">
          <h2 className="text-3xl font-bold text-white text-center">Leaderboard</h2>
          <p className="text-center text-blue-100 text-sm mt-1">Top Players</p>
        </div>

        {/* Table */}
        <div className="p-6">
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No players yet
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700 text-left">
                    <th className="px-4 py-3 text-gray-300 font-semibold w-16">Rank</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold">Player</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold text-center">Kills</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold text-center">Deaths</th>
                    <th className="px-4 py-3 text-gray-300 font-semibold text-center">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => {
                    const isCurrentPlayer = entry.playerId === playerId;
                    const bgColor = isCurrentPlayer
                      ? 'bg-blue-900 bg-opacity-50'
                      : index % 2 === 0
                      ? 'bg-gray-750'
                      : 'bg-gray-700';

                    return (
                      <tr
                        key={entry.playerId}
                        className={`${bgColor} ${
                          isCurrentPlayer ? 'border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            {index === 0 && (
                              <span className="text-2xl">🥇</span>
                            )}
                            {index === 1 && (
                              <span className="text-2xl">🥈</span>
                            )}
                            {index === 2 && (
                              <span className="text-2xl">🥉</span>
                            )}
                            {index > 2 && (
                              <span className="text-gray-400 font-semibold">
                                #{entry.rank}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-semibold ${
                              isCurrentPlayer ? 'text-blue-300' : 'text-white'
                            }`}
                          >
                            {entry.username}
                            {isCurrentPlayer && (
                              <span className="ml-2 text-xs text-blue-400">(You)</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-green-400 font-semibold">
                          {entry.kills}
                        </td>
                        <td className="px-4 py-3 text-center text-red-400 font-semibold">
                          {entry.deaths}
                        </td>
                        <td className="px-4 py-3 text-center text-yellow-400 font-bold">
                          {entry.score}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-700 px-6 py-4 rounded-b-lg text-center text-gray-400 text-sm">
          Press <span className="text-white font-mono bg-gray-600 px-2 py-1 rounded">TAB</span> to close
        </div>
      </div>
    </div>
  );
}
