/**
 * DpsMeter Component
 * 
 * Lightweight DPS (Damage Per Second) overlay.
 * Uses a circular buffer to track damage in rolling 5-second window.
 * Updates only twice per second to minimize CPU overhead.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DpsMeterProps {
    enabled: boolean;
}

// Rolling window size in seconds
const WINDOW_SIZE = 5;
// How often to update display (ms)
const UPDATE_INTERVAL = 500;

// Global damage accumulator (accessed from collision system)
let damageAccumulator = 0;

export function recordDamage(amount: number): void {
    damageAccumulator += amount;
}

export function resetDamageMeter(): void {
    damageAccumulator = 0;
}

const DpsMeter: React.FC<DpsMeterProps> = ({ enabled }) => {
    const [dps, setDps] = useState(0);
    const [peak, setPeak] = useState(0);
    const bufferRef = useRef<number[]>([]);
    const lastUpdateRef = useRef(0);

    const update = useCallback(() => {
        const now = performance.now();

        // Only update at interval
        if (now - lastUpdateRef.current < UPDATE_INTERVAL) return;
        lastUpdateRef.current = now;

        // Add current accumulator to buffer
        bufferRef.current.push(damageAccumulator);
        damageAccumulator = 0;

        // Keep only last WINDOW_SIZE seconds of samples
        const maxSamples = Math.ceil((WINDOW_SIZE * 1000) / UPDATE_INTERVAL);
        while (bufferRef.current.length > maxSamples) {
            bufferRef.current.shift();
        }

        // Calculate DPS from buffer
        const totalDamage = bufferRef.current.reduce((a, b) => a + b, 0);
        const windowSeconds = (bufferRef.current.length * UPDATE_INTERVAL) / 1000;
        const currentDps = windowSeconds > 0 ? totalDamage / windowSeconds : 0;

        setDps(Math.round(currentDps));
        setPeak(prev => Math.max(prev, Math.round(currentDps)));
    }, []);

    useEffect(() => {
        if (!enabled) return;

        const intervalId = setInterval(update, UPDATE_INTERVAL);
        return () => clearInterval(intervalId);
    }, [enabled, update]);

    if (!enabled) return null;

    return (
        <div className="fixed top-40 right-4 z-50 pointer-events-none">
            <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-xl px-4 py-2 min-w-[100px]">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">DPS</div>
                <div className="text-2xl font-black text-cyan-400 tabular-nums">
                    {dps.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                    Peak: <span className="text-orange-400 font-bold">{peak.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export default DpsMeter;
