import { useEffect, useRef } from 'react';
import Canvas from './Canvas';
import HUD from './UI/HUD';
import Leaderboard from './UI/Leaderboard';
import { socketClient } from '../network/socket';
import { inputManager } from '../game/input';
import { useGameStore } from '../store/gameStore';

interface GameProps {
  username: string;
}

export default function Game({ username }: GameProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const lastShotRef = useRef<number>(0);
  const updateIntervalRef = useRef<number>();

  const { players, playerId, toggleLeaderboard } = useGameStore();

  // Connect to server and join game
  useEffect(() => {
    socketClient.connect();
    socketClient.joinGame(username);

    return () => {
      socketClient.disconnect();
    };
  }, [username]);

  // Initialize input manager
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    inputManager.initialize(canvas);

    // Handle TAB key for leaderboard
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        toggleLeaderboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      inputManager.reset();
    };
  }, [toggleLeaderboard]);

  // Game update loop - send input to server
  useEffect(() => {
    const FIRE_RATE = 500; // milliseconds between shots

    const updateLoop = () => {
      const now = Date.now();
      lastUpdateRef.current = now;

      // Get movement input
      const movement = inputManager.getMovementVector();

      // Get mouse position and calculate angle
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      const mousePos = inputManager.getMousePosition();
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const angle = Math.atan2(mousePos.y - centerY, mousePos.x - centerX);

      // Send movement direction to server (not position)
      socketClient.sendMovement(movement.x, movement.y, angle);

      // Handle shooting
      if (inputManager.isMouseDown() && now - lastShotRef.current > FIRE_RATE) {
        socketClient.sendShoot(angle);
        lastShotRef.current = now;
      }
    };

    // Run update loop at 60 FPS
    updateIntervalRef.current = window.setInterval(updateLoop, 1000 / 60);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  return (
    <div ref={canvasRef} className="relative w-full h-full overflow-hidden bg-gray-900">
      <Canvas />
      <HUD />
      <Leaderboard />
    </div>
  );
}
