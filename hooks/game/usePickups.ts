/**
 * usePickups Hook
 * Simplified pickup management using PowerUpManager
 */

import React, { useRef, useCallback } from 'react';
import { Entity, Vector2D, PlayerStats, DifficultyConfig } from '../../types';
import { IEnemy } from '../../types/enemies';
import { powerUpManager } from '../../core/systems/PowerUpManager';

export const usePickups = (
    playerPosRef: React.MutableRefObject<Vector2D>,
    statsRef: React.MutableRefObject<PlayerStats>,
    difficulty: DifficultyConfig
) => {
    const pickupsRef = useRef<Entity[]>([]);

    const initPickups = useCallback(() => {
        pickupsRef.current = [];
    }, []);

    /**
     * Spawn drops for a killed enemy
     * Delegates to PowerUpManager for drop calculation
     */
    const spawnDrops = useCallback((enemy: Entity): number => {
        // Cast to IEnemy for PowerUpManager
        const enemyData = enemy as unknown as IEnemy;

        const { drops, score } = powerUpManager.calculateDrops(enemyData, difficulty);
        pickupsRef.current.push(...drops);

        return score;
    }, [difficulty]);

    /**
     * Update pickups - apply magnet pull physics
     */
    const updatePickups = useCallback((dt: number) => {
        const pStats = statsRef.current;
        const playerPos = playerPosRef.current;
        const nextPickups: Entity[] = [];

        for (const e of pickupsRef.current) {
            if (e.health <= 0) continue;

            // Magnet pull
            const d = Math.hypot(e.pos.x - playerPos.x, e.pos.y - playerPos.y);
            if (d < pStats.magnetRange && d > 0) {
                const pullSpeed = 1800;
                e.vel.x = ((playerPos.x - e.pos.x) / d) * pullSpeed;
                e.vel.y = ((playerPos.y - e.pos.y) / d) * pullSpeed;
                e.pos.x += e.vel.x * dt;
                e.pos.y += e.vel.y * dt;
            }

            nextPickups.push(e);
        }

        pickupsRef.current = nextPickups;
        return [];
    }, [playerPosRef, statsRef]);

    return { pickupsRef, initPickups, spawnDrops, updatePickups };
};
