import { useState } from 'react';
import Renderer from './engine/Renderer';

function App() {
  const [isInGame, setIsInGame] = useState(false);
  const [username, setUsername] = useState('');

  const handleJoinWorld = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsInGame(true);
    }
  };

  if (isInGame) {
    return <Renderer username={username} />;
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="text-center space-y-8 p-8">
        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-7xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-transparent bg-clip-text animate-pulse">
            VoxelWars
          </h1>
          <p className="text-xl text-gray-400">
            A Multiplayer Voxel Adventure
          </p>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoinWorld} className="space-y-6 mt-12">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-80 px-6 py-4 text-lg bg-gray-700 text-white border-2 border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              maxLength={20}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!username.trim()}
            className="w-80 px-8 py-4 text-lg font-semibold bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Join World
          </button>
        </form>

        {/* Instructions */}
        <div className="mt-12 text-gray-500 space-y-2">
          <p className="text-sm">Controls: WASD to move, SPACE to jump</p>
          <p className="text-sm">Click and drag to look around</p>
        </div>
      </div>
    </div>
  );
}

export default App;
