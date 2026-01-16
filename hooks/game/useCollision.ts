/**
 * useCollision Hook
 * Simplified collision detection using CollisionManager
 * All collision logic delegated to handler classes
 */

import React, { useCallback, useRef } from 'react';
import { Entity, PlayerStats, PersistentData, Vector2D } from '../../types';
import { IEnemy } from '../../types/enemies';
import { IProjectile } from '../../types/projectiles';
import { SpatialHashGrid } from '../../core/utils/SpatialHashGrid';
import { collisionManager, CollisionContext, CollisionCallbacks } from '../../core/systems/collision';

export const useCollision = (
    enemiesRef: React.MutableRefObject<IEnemy[]>,
    projectilesRef: React.MutableRefObject<IProjectile[]>,
    pickupsRef: React.MutableRefObject<Entity[]>,
    playerPosRef: React.MutableRefObject<Vector2D>,
    statsRef: React.MutableRefObject<PlayerStats>,
    triggerPlayerHit: (time: number, damage: number, source: Entity | string) => void,
    spawnDrops: (enemy: IEnemy) => number,
    spawnDamageText: (pos: Vector2D, dmg: number, color: string) => void,
    spawnExplosion: (pos: Vector2D, radius: number, color: string) => void,
    addParticles: (p: Entity[]) => void,
    setScore: React.Dispatch<React.SetStateAction<number>>,
    setStats: React.Dispatch<React.SetStateAction<PlayerStats>>,
    setOfferedUpgrades: (u: any[]) => void,
    persistentData: PersistentData,
    onEnemyHit: () => void,
    onEnemyKilled: () => void,
    onCreditCollected: (amount: number) => void
) => {
    const gridRef = useRef<SpatialHashGrid<IEnemy>>(new SpatialHashGrid<IEnemy>(250));

    const checkCollisions = useCallback((time: number, dt: number) => {
        const grid = gridRef.current;
        grid.clear();

        const enemies = enemiesRef.current;
        const projectiles = projectilesRef.current;
        const pickups = pickupsRef.current;
        const playerPos = playerPosRef.current;
        const playerStats = statsRef.current;

        // Insert enemies into spatial grid
        for (const e of enemies) {
            if (e.isAlive) grid.insert(e);
        }

        // Build callbacks
        const callbacks: CollisionCallbacks = {
            onEnemyHit,
            onEnemyKilled,
            onCreditCollected,
            triggerPlayerHit,
            spawnDamageText,
            spawnExplosion,
            setStats,
            setScore,
        };

        // Build context
        const ctx: CollisionContext = {
            time,
            dt,
            playerPos,
            playerStats,
            enemies,
            projectiles,
            pickups,
            grid,
            persistentData,
            callbacks,
        };

        // Process all collision types via manager
        collisionManager.processAll(ctx);

        // Handle drops and score for dead enemies
        // Track processed enemy IDs to avoid double-processing (since isAlive is a getter)
        for (const e of enemies) {
            // Check health <= 0 and that we haven't processed this death yet
            // Use a simple flag on the enemy object to track
            if (e.health <= 0 && !(e as any).__deathProcessed) {
                (e as any).__deathProcessed = true;
                const scoreAdd = spawnDrops(e);
                setScore(s => s + scoreAdd);
            }
        }

    }, [
        gridRef,
        onCreditCollected,
        onEnemyHit,
        onEnemyKilled,
        triggerPlayerHit,
        spawnDrops,
        spawnDamageText,
        spawnExplosion,
        setScore,
        setStats,
        persistentData
    ]);

    return { checkCollisions };
};
