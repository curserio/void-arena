
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Vector2D } from '../types';

interface JoystickProps {
  onMove: (dir: Vector2D) => void;
  className?: string; // To define the hit zone (left/right)
}

const Joystick: React.FC<JoystickProps> = ({ onMove, className }) => {
  const [basePos, setBasePos] = useState<Vector2D | null>(null);
  const [stickPos, setStickPos] = useState<Vector2D>({ x: 0, y: 0 });
  
  // Track the specific touch ID that started this joystick interaction
  const touchIdRef = useRef<number | null>(null);
  const joystickRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback((clientX: number, clientY: number, id: number | null) => {
    touchIdRef.current = id;
    setBasePos({ x: clientX, y: clientY });
    setStickPos({ x: 0, y: 0 });
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!basePos) return;

    const dx = clientX - basePos.x;
    const dy = clientY - basePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 60;
    
    const limitedDistance = Math.min(distance, maxRadius);
    const angle = Math.atan2(dy, dx);
    
    const sx = Math.cos(angle) * limitedDistance;
    const sy = Math.sin(angle) * limitedDistance;

    setStickPos({ x: sx, y: sy });
    
    // Normalize output (-1 to 1)
    onMove({ x: sx / maxRadius, y: sy / maxRadius });
  }, [basePos, onMove]);

  const handleEnd = useCallback(() => {
    touchIdRef.current = null;
    setBasePos(null);
    setStickPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  }, [onMove]);

  // Touch Events (Multi-touch support)
  useEffect(() => {
    const el = joystickRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      // Prevent default on the joystick element to stop mouse emulation and scrolling start
      if (e.cancelable) e.preventDefault();
      
      // Only take the first changed touch if we aren't already active
      if (touchIdRef.current === null && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        handleStart(touch.clientX, touch.clientY, touch.identifier);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      // Only prevent default if this event involves OUR joystick touch
      if (touchIdRef.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchIdRef.current) {
            if (e.cancelable) e.preventDefault();
            handleMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
            break;
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      // Only prevent default if this event involves OUR joystick touch
      if (touchIdRef.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchIdRef.current) {
             // We don't necessarily need to preventDefault on end, 
             // but it helps prevent ghost clicks on the joystick area itself.
             if (e.cancelable) e.preventDefault();
             handleEnd();
             break;
          }
        }
      }
    };

    // Passive false is crucial for preventing scrolling
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  // Mouse Fallback for testing on desktop
  useEffect(() => {
    const el = joystickRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      // e.preventDefault(); // Optional for mouse
      handleStart(e.clientX, e.clientY, 999); // Fake ID
    };

    const onMouseMove = (e: MouseEvent) => {
      if (touchIdRef.current === 999) {
        // e.preventDefault();
        handleMove(e.clientX, e.clientY);
      }
    };

    const onMouseUp = () => {
      if (touchIdRef.current === 999) {
        handleEnd();
      }
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleStart, handleMove, handleEnd]);

  return (
    <>
      {/* Hit Zone */}
      <div ref={joystickRef} className={`${className} touch-none`} />

      {/* Visual Representation (Only when active) */}
      {basePos && (
        <div className="fixed z-[999] pointer-events-none" style={{ left: basePos.x, top: basePos.y }}>
          <div className="absolute -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-cyan-400/20 rounded-full bg-cyan-900/10 backdrop-blur-sm flex items-center justify-center">
            <div 
              className="w-14 h-14 bg-cyan-400 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.8)] border-2 border-white/40"
              style={{ transform: `translate(${stickPos.x}px, ${stickPos.y}px)` }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Joystick;
