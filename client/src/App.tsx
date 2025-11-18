import { useState, useEffect } from 'react';
import StartScreen from './components/UI/StartScreen';
import Game from './components/Game';

const USERNAME_STORAGE_KEY = 'voxelwars_username';

function App() {
  const [username, setUsername] = useState<string | null>(null);

  // Auto-load username from localStorage on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem(USERNAME_STORAGE_KEY);
    if (savedUsername && savedUsername.length >= 3 && savedUsername.length <= 16) {
      setUsername(savedUsername);
    }
  }, []);

  const handleJoinGame = (name: string) => {
    setUsername(name);
  };

  return (
    <div className="w-full h-full bg-gray-900">
      {!username ? (
        <StartScreen onJoin={handleJoinGame} />
      ) : (
        <Game username={username} />
      )}
    </div>
  );
}

export default App;
