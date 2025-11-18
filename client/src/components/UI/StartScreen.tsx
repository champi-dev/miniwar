import { useState, FormEvent } from 'react';

interface StartScreenProps {
  onJoin: (username: string) => void;
}

export default function StartScreen({ onJoin }: StartScreenProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (username.length > 16) {
      setError('Username must be at most 16 characters');
      return;
    }

    setError('');
    onJoin(username);
  };

  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full p-8 bg-gray-800 rounded-lg shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">VoxelWars</h1>
          <p className="text-gray-400">Top-down multiplayer shooter</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Enter Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Player name (3-16 characters)"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              maxLength={16}
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Join Game
          </button>
        </form>

        <div className="mt-8 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Controls</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li><span className="text-white font-mono">WASD</span> - Move</li>
            <li><span className="text-white font-mono">Mouse</span> - Aim</li>
            <li><span className="text-white font-mono">Click</span> - Shoot</li>
            <li><span className="text-white font-mono">TAB</span> - Leaderboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
