import { useState, useEffect } from 'react';

export default function DamageIndicator({ lastDamage }) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (lastDamage) {
      // Flash red
      setOpacity(0.5);

      // Fade out
      const timeout = setTimeout(() => {
        setOpacity(0);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [lastDamage]);

  if (opacity === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'red',
        opacity,
        pointerEvents: 'none',
        transition: 'opacity 0.5s ease-out',
        zIndex: 100
      }}
    />
  );
}
