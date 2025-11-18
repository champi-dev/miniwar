import { useState } from 'react';
import StartScreen from './components/UI/StartScreen';
import Game from './components/Game';

function App() {
  const [username, setUsername] = useState<string | null>(null);

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
