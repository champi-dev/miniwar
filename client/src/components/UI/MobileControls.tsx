import { useEffect, useRef, useState } from 'react';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onFire: () => void;
}

export default function MobileControls({ onMove, onFire }: MobileControlsProps) {
  const moveJoystickRef = useRef<HTMLDivElement>(null);
  const fireButtonRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [moveStickPosition, setMoveStickPosition] = useState({ x: 0, y: 0 });
  const moveTouchIdRef = useRef<number | null>(null);
  const fireIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Detect if device is mobile or touch-enabled
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fire Button
  useEffect(() => {
    if (!isMobile) return;

    const handleFireStart = (e: TouchEvent) => {
      if (!fireButtonRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      // Start continuous firing
      onFire(); // Fire immediately
      fireIntervalRef.current = window.setInterval(() => {
        onFire();
      }, 500); // Fire every 500ms while pressed
    };

    const handleFireEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Stop firing
      if (fireIntervalRef.current !== null) {
        clearInterval(fireIntervalRef.current);
        fireIntervalRef.current = null;
      }
    };

    const fireButton = fireButtonRef.current;

    if (fireButton) {
      fireButton.addEventListener('touchstart', handleFireStart, { passive: false });
      fireButton.addEventListener('touchend', handleFireEnd, { passive: false });
      fireButton.addEventListener('touchcancel', handleFireEnd, { passive: false });
    }

    return () => {
      if (fireButton) {
        fireButton.removeEventListener('touchstart', handleFireStart);
        fireButton.removeEventListener('touchend', handleFireEnd);
        fireButton.removeEventListener('touchcancel', handleFireEnd);
      }
      if (fireIntervalRef.current !== null) {
        clearInterval(fireIntervalRef.current);
      }
    };
  }, [isMobile, onFire]);

  // Movement Joystick
  useEffect(() => {
    if (!isMobile) return;

    const handleMoveStart = (e: TouchEvent) => {
      if (!moveJoystickRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      // Only capture touches that are actually within this control's bounds
      const rect = moveJoystickRef.current.getBoundingClientRect();
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const x = touch.clientX;
        const y = touch.clientY;

        // Check if touch is within this control
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          if (moveTouchIdRef.current === null) {
            moveTouchIdRef.current = touch.identifier;
            handleMoveJoystick(e);
            break;
          }
        }
      }
    };

    const handleMoveJoystick = (e: TouchEvent) => {
      if (!moveJoystickRef.current || moveTouchIdRef.current === null) return;
      e.preventDefault();
      e.stopPropagation();

      // Find our specific touch
      let ourTouch: Touch | null = null;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === moveTouchIdRef.current) {
          ourTouch = e.touches[i];
          break;
        }
      }

      if (!ourTouch) return;

      const rect = moveJoystickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxDistance = rect.width / 2;

      let deltaX = ourTouch.clientX - centerX;
      let deltaY = ourTouch.clientY - centerY;

      // Calculate distance from center
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Limit stick movement to joystick boundary
      if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        deltaX = Math.cos(angle) * maxDistance;
        deltaY = Math.sin(angle) * maxDistance;
      }

      // Update visual stick position
      setMoveStickPosition({ x: deltaX, y: deltaY });

      // Normalize movement (-1 to 1)
      const normalizedX = deltaX / maxDistance;
      const normalizedY = deltaY / maxDistance;

      // Apply deadzone (10%)
      const deadzone = 0.15;
      const moveX = Math.abs(normalizedX) > deadzone ? normalizedX : 0;
      const moveY = Math.abs(normalizedY) > deadzone ? normalizedY : 0;

      onMove(moveX, moveY);
    };

    const handleMoveEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Check if our touch ended
      let touchEnded = true;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === moveTouchIdRef.current) {
          touchEnded = false;
          break;
        }
      }

      if (touchEnded) {
        moveTouchIdRef.current = null;
        setMoveStickPosition({ x: 0, y: 0 });
        onMove(0, 0);
      }
    };

    const moveJoystick = moveJoystickRef.current;

    if (moveJoystick) {
      moveJoystick.addEventListener('touchstart', handleMoveStart, { passive: false });
      moveJoystick.addEventListener('touchmove', handleMoveJoystick, { passive: false });
      moveJoystick.addEventListener('touchend', handleMoveEnd, { passive: false });
    }

    return () => {
      if (moveJoystick) {
        moveJoystick.removeEventListener('touchstart', handleMoveStart);
        moveJoystick.removeEventListener('touchmove', handleMoveJoystick);
        moveJoystick.removeEventListener('touchend', handleMoveEnd);
      }
    };
  }, [isMobile, onMove]);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Movement Joystick - Left Side */}
      <div className="absolute left-4 bottom-4 sm:left-8 sm:bottom-8 pointer-events-auto z-10">
        <div
          ref={moveJoystickRef}
          className="relative w-28 h-28 sm:w-36 sm:h-36 bg-gray-800/60 rounded-full border-2 border-blue-600/70 backdrop-blur-sm"
        >
          {/* Joystick outer ring */}
          <div className="absolute inset-2 border-2 border-blue-500/40 rounded-full" />

          {/* Joystick stick */}
          <div
            className="absolute w-12 h-12 sm:w-14 sm:h-14 bg-blue-500 rounded-full border-2 border-blue-300 shadow-lg transition-transform"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${moveStickPosition.x}px), calc(-50% + ${moveStickPosition.y}px))`,
            }}
          >
            <div className="absolute inset-2 bg-blue-400 rounded-full" />
          </div>

          {/* Center label */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-300 text-[10px] font-bold pointer-events-none">
            MOVE
          </div>
        </div>
      </div>

      {/* Fire Button - Right Side */}
      <div className="absolute right-4 bottom-4 sm:right-8 sm:bottom-8 pointer-events-auto z-10">
        <div
          ref={fireButtonRef}
          className="relative w-28 h-28 sm:w-36 sm:h-36 bg-gray-800/60 rounded-full border-2 border-red-600/70 backdrop-blur-sm active:bg-red-900/40"
        >
          {/* Fire button outer ring */}
          <div className="absolute inset-2 border-2 border-red-500/40 rounded-full" />

          {/* Fire icon */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 rounded-full border-2 border-red-300 shadow-lg flex items-center justify-center">
              <div className="text-white text-2xl sm:text-3xl font-bold">🔥</div>
            </div>
          </div>

          {/* Center label */}
          <div className="absolute left-1/2 bottom-2 -translate-x-1/2 text-red-300 text-[10px] font-bold pointer-events-none">
            FIRE
          </div>
        </div>
      </div>
    </div>
  );
}
