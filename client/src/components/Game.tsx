import { useEffect, useRef, useState } from 'react';
import Canvas from './Canvas';
import HUD from './UI/HUD';
import Leaderboard from './UI/Leaderboard';
import MobileControls from './UI/MobileControls';
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
  const mobileMovementRef = useRef({ x: 0, y: 0 });
  const mobileAngleRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);

  const { toggleLeaderboard } = useGameStore();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

      // Get movement input (either keyboard or mobile joystick)
      let movement = isMobile ? mobileMovementRef.current : inputManager.getMovementVector();

      // Get angle (either mouse or mobile shoot pad)
      let angle = mobileAngleRef.current;

      if (!isMobile) {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        const mousePos = inputManager.getMousePosition();
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        angle = Math.atan2(mousePos.y - centerY, mousePos.x - centerX);
      } else {
        // On mobile, face the direction of movement (joystick direction)
        // Shoot pad does NOT affect facing angle
        if (movement.x !== 0 || movement.y !== 0) {
          angle = Math.atan2(movement.y, movement.x);
          mobileAngleRef.current = angle;
        }
      }

      // Send movement direction to server (not position)
      socketClient.sendMovement(movement.x, movement.y, angle);

      // Handle shooting (desktop only - mobile uses shoot pad)
      if (!isMobile && inputManager.isMouseDown() && now - lastShotRef.current > FIRE_RATE) {
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
  }, [isMobile]); // Only recreate when isMobile changes

  // Mobile control handlers
  const handleMobileMove = (x: number, y: number) => {
    mobileMovementRef.current = { x, y };
  };

  const handleMobileFire = () => {
    const now = Date.now();
    const FIRE_RATE = 500;

    if (now - lastShotRef.current > FIRE_RATE) {
      socketClient.sendShoot(mobileAngleRef.current);
      lastShotRef.current = now;
    }
  };

  return (
    <div ref={canvasRef} className="relative w-full h-full overflow-hidden bg-gray-900">
      <Canvas />
      <HUD />
      <Leaderboard />
      <MobileControls
        onMove={handleMobileMove}
        onFire={handleMobileFire}
      />
    </div>
  );
}
