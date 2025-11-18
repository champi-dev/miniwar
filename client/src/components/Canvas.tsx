import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { Renderer } from '../game/renderer';
import { Interpolator } from '../game/interpolation';

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const interpolatorRef = useRef<Interpolator>(new Interpolator());
  const animationFrameRef = useRef<number>();

  const { players, bullets, terrain, playerId, worldSize } = useGameStore();

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new Renderer(canvas);
    rendererRef.current = renderer;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Add snapshots for interpolation
  useEffect(() => {
    if (players.length > 0) {
      interpolatorRef.current.addSnapshot(players);
    }
  }, [players]);

  // Render loop
  useEffect(() => {
    const render = () => {
      if (!rendererRef.current) return;

      // Interpolate player positions for smooth rendering
      const interpolatedPlayers = interpolatorRef.current.interpolatePlayers(players);

      // Render the frame
      rendererRef.current.render(
        interpolatedPlayers,
        bullets,
        terrain,
        playerId,
        worldSize
      );

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [players, bullets, terrain, playerId, worldSize]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
}
