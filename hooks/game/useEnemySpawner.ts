/**
 * useEnemySpawner Hook
 * Handles enemy spawning logic and initialization.
 * 
 * Responsibilities:
 * - initEnemies: Reset and initialize enemy state
 * - processSpawnDecision: Handle spawn decisions from WaveManager
 */

import React, { useRef, useCallback } from 'react';
import { Vector2D, DifficultyConfig, GameMode } from '../../types';
import { WORLD_SIZE } from '../../constants';
import { EnemyType, IEnemy } from '../../types/enemies';
import { enemyFactory } from '../../core/factories/EnemyFactory';
import { WaveManager, SpawnDecision } from '../../core/systems/WaveManager';
import { EnemyFactoryOutput } from './useEnemyFactory';

export interface EnemySpawnerOutput {
    enemiesRef: React.MutableRefObject<IEnemy[]>;
    spawnTimerRef: React.MutableRefObject<number>;
    debugRespawnTimerRef: React.MutableRefObject<number>;
    waveManager: WaveManager;
    initEnemies: (modeOverride?: GameMode) => void;
    processSpawnDecision: (decision: SpawnDecision, gameTime: number, currentTime: number) => void;
}

export const useEnemySpawner = (
    playerPosRef: React.MutableRefObject<Vector2D>,
    difficulty: DifficultyConfig,
    gameMode: GameMode,
    waveManager: WaveManager,
    factory: EnemyFactoryOutput
): EnemySpawnerOutput => {
    const enemiesRef = useRef<IEnemy[]>([]);
    const spawnTimerRef = useRef(0);
    const debugRespawnTimerRef = useRef(0);

    const { createEnemy, spawnBoss } = factory;

    const initEnemies = useCallback((modeOverride?: GameMode) => {
        const currentMode = modeOverride ?? gameMode;
        enemiesRef.current = [];
        spawnTimerRef.current = 0;
        debugRespawnTimerRef.current = 0;
        waveManager.reset();

        // In DEBUG mode, do not spawn initial asteroid belt
        if (currentMode === GameMode.STANDARD) {
            // Initial asteroid belt - using factory
            for (let i = 0; i < 35; i++) {
                const asteroid = enemyFactory.createAsteroid(
                    Math.random() * WORLD_SIZE,
                    Math.random() * WORLD_SIZE,
                    difficulty.statMultiplier
                );
                enemiesRef.current.push(asteroid);
            }
        }
    }, [difficulty, gameMode, waveManager]);

    const processSpawnDecision = useCallback((decision: SpawnDecision, gameTime: number, currentTime: number) => {
        const difficultyMultiplier = waveManager.getDifficultyMultiplier(gameTime);
        const levelBonus = difficulty.enemyLevelBonus;
        const gameMinutes = gameTime / 60;

        switch (decision.type) {
            case 'boss':
                if (decision.bossType && decision.waveIndex !== undefined) {
                    waveManager.markBossSpawned(decision.waveIndex);
                    const bossType = decision.bossType as EnemyType.BOSS_DREADNOUGHT | EnemyType.BOSS_DESTROYER;
                    const boss = spawnBoss(bossType, difficultyMultiplier, levelBonus, currentTime, decision.waveIndex);
                    enemiesRef.current.push(boss);
                }
                break;

            case 'kamikaze_wave':
                waveManager.markKamikazeSpawned(gameTime);
                const angle = Math.random() * Math.PI * 2;
                const dist = 1200 + Math.random() * 400;
                const baseX = Math.max(40, Math.min(WORLD_SIZE - 40, playerPosRef.current.x + Math.cos(angle) * dist));
                const baseY = Math.max(40, Math.min(WORLD_SIZE - 40, playerPosRef.current.y + Math.sin(angle) * dist));

                if (decision.isEliteWave) {
                    const e = createEnemy(EnemyType.KAMIKAZE, baseX, baseY, gameMinutes, difficultyMultiplier, levelBonus, true);
                    if (e) enemiesRef.current.push(e);
                } else {
                    for (let i = 0; i < (decision.count || 3); i++) {
                        const offsetX = (Math.random() - 0.5) * 100;
                        const offsetY = (Math.random() - 0.5) * 100;
                        const e = createEnemy(EnemyType.KAMIKAZE, baseX + offsetX, baseY + offsetY, gameMinutes, difficultyMultiplier, levelBonus);
                        if (e) enemiesRef.current.push(e);
                    }
                }
                break;

            case 'enemy':
            case 'lull_enemy':
                if (decision.enemyType) {
                    const a = Math.random() * Math.PI * 2;
                    const d = decision.type === 'lull_enemy' ? 1200 : (1000 + Math.random() * 400);
                    const x = Math.max(40, Math.min(WORLD_SIZE - 40, playerPosRef.current.x + Math.cos(a) * d));
                    const y = Math.max(40, Math.min(WORLD_SIZE - 40, playerPosRef.current.y + Math.sin(a) * d));
                    const e = createEnemy(decision.enemyType, x, y, gameMinutes, difficultyMultiplier, levelBonus);
                    if (e) enemiesRef.current.push(e);
                }
                break;
        }
    }, [waveManager, difficulty, playerPosRef, createEnemy, spawnBoss]);

    return {
        enemiesRef,
        spawnTimerRef,
        debugRespawnTimerRef,
        waveManager,
        initEnemies,
        processSpawnDecision,
    };
};
