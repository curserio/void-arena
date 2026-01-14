
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Vector2D } from '../types';

interface JoystickProps {
  onMove: (dir: Vector2D) => void;
}

const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
  const [basePos, setBasePos] = useState<Vector2D | null>(null);
  const [stickPos, setStickPos] = useState<Vector2D>({ x: 0, y: 0 });
  const activeRef = useRef(false);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    activeRef.current = true;
    setBasePos({ x: clientX, y: clientY });
    setStickPos({ x: 0, y: 0 });
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!activeRef.current || !basePos) return;

    const dx = clientX - basePos.x;
    const dy = clientY - basePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 60;
    
    const limitedDistance = Math.min(distance, maxRadius);
    const angle = Math.atan2(dy, dx);
    
    const sx = Math.cos(angle) * limitedDistance;
    const sy = Math.sin(angle) * limitedDistance;

    setStickPos({ x: sx, y: sy });
    onMove({ x: sx / maxRadius, y: sy / maxRadius });
  }, [basePos, onMove]);

  const handleEnd = useCallback(() => {
    activeRef.current = false;
    setBasePos(null);
    setStickPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  }, [onMove]);

  useEffect(() => {
    const onTS = (e: TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
    const onTM = (e: TouchEvent) => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onMS = (e: MouseEvent) => handleStart(e.clientX, e.clientY);
    const onMM = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onU = () => handleEnd();

    window.addEventListener('touchstart', onTS, { passive: false });
    window.addEventListener('touchmove', onTM, { passive: false });
    window.addEventListener('mousedown', onMS);
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mouseup', onU);
    window.addEventListener('touchend', onU);

    return () => {
      window.removeEventListener('touchstart', onTS);
      window.removeEventListener('touchmove', onTM);
      window.removeEventListener('mousedown', onMS);
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mouseup', onU);
      window.removeEventListener('touchend', onU);
    };
  }, [handleStart, handleMove, handleEnd]);

  if (!basePos) return null;

  return (
    <div className="fixed z-[999] pointer-events-none" style={{ left: basePos.x, top: basePos.y }}>
      <div className="absolute -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-cyan-400/20 rounded-full bg-cyan-900/10 backdrop-blur-sm flex items-center justify-center">
        <div 
          className="w-14 h-14 bg-cyan-400 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.8)] border-2 border-white/40"
          style={{ transform: `translate(${stickPos.x}px, ${stickPos.y}px)` }}
        />
      </div>
    </div>
  );
};

export default Joystick;
