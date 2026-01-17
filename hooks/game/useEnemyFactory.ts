/**
 * useEnemyFactory Hook
 * Provides enemy and boss creation functions using the EnemyFactory.
 * 
 * Responsibilities:
 * - createEnemy: Create regular enemies with tier/level scaling
 * - spawnBoss: Create boss enemies at spawn position
 */

import React, { useCallback } from 'react';
import { Vector2D } from '../../types';
import { EnemyType, EnemyTier, IEnemy } from '../../types/enemies';
import { enemyFactory } from '../../core/factories/EnemyFactory';
import { isSpawnableEnemy } from '../../data/enemies';
import { WORLD_SIZE } from '../../constants';

export interface EnemyFactoryOutput {
    createEnemy: (
        enemyType: EnemyType,
        x: number,
        y: number,
        gameMinutes: number,
        difficultyMultiplier: number,
        levelBonus: number,
        isEliteOverride?: boolean,
        isLegendaryOverride?: boolean,
        isMinibossOverride?: boolean
    ) => IEnemy | null;

    spawnBoss: (
        bossType: EnemyType.BOSS_DREADNOUGHT | EnemyType.BOSS_DESTROYER,
        difficultyMultiplier: number,
        levelBonus: number,
        currentTime: number,
        waveIndex?: number,
        bossTierOverride?: 'NORMAL' | 'ELITE' | 'LEGENDARY'
    ) => IEnemy;
}

export const useEnemyFactory = (
    playerPosRef: React.MutableRefObject<Vector2D>,
    spawnSpawnFlash: (pos: Vector2D) => void
): EnemyFactoryOutput => {

    const createEnemy = useCallback((
        enemyType: EnemyType,
        x: number,
        y: number,
        gameMinutes: number,
        difficultyMultiplier: number,
        levelBonus: number,
        isEliteOverride?: boolean,
        isLegendaryOverride?: boolean,
        isMinibossOverride?: boolean
    ): IEnemy | null => {
        // Validate enemy type (regular enemies only, not bosses/asteroids)
        if (!isSpawnableEnemy(enemyType)) {
            console.warn(`createEnemy called with invalid type: ${enemyType}. Use spawnBoss for boss types.`);
            return null;
        }

        // Determine tier
        let tier: EnemyTier | undefined = undefined;
        if (isMinibossOverride) tier = EnemyTier.MINIBOSS;
        else if (isLegendaryOverride) tier = EnemyTier.LEGENDARY;
        else if (isEliteOverride) tier = EnemyTier.ELITE;

        // Create using factory
        const enemy = enemyFactory.create(enemyType, {
            x,
            y,
            tier,
            difficultyMult: difficultyMultiplier,
            levelBonus,
            isEliteOverride,
            isLegendaryOverride,
            isMinibossOverride,
        });

        // Spawn Flash Check
        const distToPlayer = Math.hypot(x - playerPosRef.current.x, y - playerPosRef.current.y);
        if (distToPlayer < 1300) {
            spawnSpawnFlash({ x, y });
        }

        return enemy;
    }, [playerPosRef, spawnSpawnFlash]);

    const spawnBoss = useCallback((
        bossType: EnemyType.BOSS_DREADNOUGHT | EnemyType.BOSS_DESTROYER,
        difficultyMultiplier: number,
        levelBonus: number,
        currentTime: number,
        waveIndex: number = 0,
        bossTierOverride?: 'NORMAL' | 'ELITE' | 'LEGENDARY'
    ): IEnemy => {
        const a = Math.random() * Math.PI * 2;
        const d = 1100;
        const x = Math.max(100, Math.min(WORLD_SIZE - 100, playerPosRef.current.x + Math.cos(a) * d));
        const y = Math.max(100, Math.min(WORLD_SIZE - 100, playerPosRef.current.y + Math.sin(a) * d));

        // Create boss using factory
        const boss = enemyFactory.createBoss(
            bossType,
            x,
            y,
            difficultyMultiplier,
            levelBonus,
            currentTime,
            waveIndex,
            bossTierOverride
        );

        spawnSpawnFlash({ x, y });
        return boss;
    }, [playerPosRef, spawnSpawnFlash]);

    return { createEnemy, spawnBoss };
};
