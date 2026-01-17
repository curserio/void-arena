/**
 * useEnemies Hook - Refactored
 * 
 * Composes:
 * - useEnemyFactory: createEnemy, spawnBoss
 * - useEnemySpawner: initEnemies, processSpawnDecision
 * - Contains: updateEnemies (core update loop)
 */

import React, { useCallback, useMemo } from 'react';
import { Entity, EntityType, Vector2D, DifficultyConfig, GameMode, DebugConfig } from '../../types';
import { WORLD_SIZE } from '../../constants';
import { EnemyType, EnemyTier, IEnemy } from '../../types/enemies';
import { UpdateContext } from '../../types/entities';
import { projectileIdGen } from '../../core/utils/IdGenerator';
import { BaseEnemy } from '../../core/entities/enemies/BaseEnemy';
import { SHIELD_AURA_RADIUS } from '../../core/entities/enemies/Shielder';
import { WaveManager } from '../../core/systems/WaveManager';
import { DEFAULT_WAVE_CONFIG } from '../../data/spawning/waveConfig';

import { useEnemyFactory } from './useEnemyFactory';
import { useEnemySpawner } from './useEnemySpawner';

export const useEnemies = (
    playerPosRef: React.MutableRefObject<Vector2D>,
    difficulty: DifficultyConfig,
    spawnSpawnFlash: (pos: Vector2D) => void,
    gameMode: GameMode = GameMode.STANDARD,
    debugConfig: DebugConfig | null = null
) => {
    // Wave Manager for spawn decisions
    const waveManager = useMemo(() => new WaveManager(DEFAULT_WAVE_CONFIG, difficulty), [difficulty]);

    // Compose sub-hooks
    const factory = useEnemyFactory(playerPosRef, spawnSpawnFlash);
    const { createEnemy, spawnBoss } = factory;

    const spawner = useEnemySpawner(
        playerPosRef,
        difficulty,
        gameMode,
        waveManager,
        factory
    );
    const { enemiesRef, spawnTimerRef, debugRespawnTimerRef, initEnemies, processSpawnDecision } = spawner;

    // =========================================================================
    // UPDATE LOOP - Core game loop for enemies
    // =========================================================================

    const updateEnemies = useCallback((dt: number, time: number, gameTime: number) => {

        // --- SPAWNING LOGIC (via WaveManager) ---
        if (gameMode === GameMode.STANDARD) {
            spawnTimerRef.current += dt;

            // Count current shielders for spawn limit
            const shielderCount = enemiesRef.current.filter(
                e => e.isAlive && e.enemyType === EnemyType.SHIELDER
            ).length;

            // Count current carriers for spawn limit
            const carrierCount = enemiesRef.current.filter(
                e => e.isAlive && e.enemyType === EnemyType.CARRIER
            ).length;

            const decision = waveManager.getSpawnDecision(gameTime, spawnTimerRef.current, shielderCount, carrierCount);

            if (decision.shouldSpawn) {
                processSpawnDecision(decision, gameTime, time);
                spawnTimerRef.current = 0;
            }
        } else if (gameMode === GameMode.DEBUG && debugConfig) {
            const currentCount = enemiesRef.current.filter(e => e.enemyType !== EnemyType.ASTEROID).length;

            if (debugRespawnTimerRef.current > 0) {
                debugRespawnTimerRef.current -= dt;
            }

            if (currentCount < debugConfig.count && debugRespawnTimerRef.current <= 0) {
                // Determine tier overrides from debug config
                const isEliteOverride = debugConfig.tier === 'ELITE';
                const isLegendaryOverride = debugConfig.tier === 'LEGENDARY';
                const isMinibossOverride = debugConfig.tier === 'MINIBOSS';

                if (debugConfig.enemyType === EnemyType.BOSS_DREADNOUGHT || debugConfig.enemyType === EnemyType.BOSS_DESTROYER) {
                    const bossType = debugConfig.enemyType;
                    const boss = spawnBoss(bossType, debugConfig.level * 0.2, debugConfig.level, time, 0, debugConfig.tier !== 'MINIBOSS' ? debugConfig.tier : 'NORMAL');
                    enemiesRef.current.push(boss);
                } else {
                    const a = Math.random() * Math.PI * 2;
                    const d = 900;
                    const x = Math.max(100, Math.min(WORLD_SIZE - 100, playerPosRef.current.x + Math.cos(a) * d));
                    const y = Math.max(100, Math.min(WORLD_SIZE - 100, playerPosRef.current.y + Math.sin(a) * d));
                    const diffMult = debugConfig.level * 0.2;
                    const e = createEnemy(
                        debugConfig.enemyType, x, y, 0, diffMult, debugConfig.level,
                        isEliteOverride, isLegendaryOverride, isMinibossOverride
                    );
                    if (e) enemiesRef.current.push(e);
                }
                debugRespawnTimerRef.current = 0.2;
            }
        }

        // --- UPDATE LOOP: Delegate to enemy class methods ---
        const nextEnemies: IEnemy[] = [];
        const enemyBulletsToSpawn: Entity[] = [];
        const enemiesToSpawn: IEnemy[] = [];

        const updateContext: UpdateContext = {
            dt,
            time,
            gameTime,
            playerPos: playerPosRef.current,
            enemies: enemiesRef.current,
        };

        // --- UPDATE SHIELDED STATUS (once per frame, before damage) ---
        const shielders = enemiesRef.current.filter(
            e => e.isAlive && e.enemyType === EnemyType.SHIELDER
        );

        for (const enemy of enemiesRef.current) {
            if (!enemy.isAlive) continue;

            let inAura = false;
            for (const shielder of shielders) {
                const dx = enemy.pos.x - shielder.pos.x;
                const dy = enemy.pos.y - shielder.pos.y;
                const dist = Math.hypot(dx, dy);
                if (dist <= SHIELD_AURA_RADIUS) {
                    inAura = true;
                    break;
                }
            }
            (enemy as BaseEnemy).isShielded = inAura;
        }

        for (const enemy of enemiesRef.current) {
            const result = enemy.update(updateContext);

            // Collect bullets to spawn
            for (const bullet of result.bulletsToSpawn) {
                enemyBulletsToSpawn.push({
                    id: projectileIdGen.next(),
                    type: EntityType.ENEMY_BULLET,
                    pos: { ...bullet.pos },
                    vel: { ...bullet.vel },
                    radius: bullet.radius,
                    health: 1,
                    maxHealth: 1,
                    color: bullet.color,
                    damage: bullet.damage,
                    level: bullet.level,
                    isElite: bullet.isElite,
                    isLegendary: bullet.isLegendary,
                    isHoming: bullet.isHoming,
                    turnRate: bullet.turnRate,
                    duration: 0,
                    maxDuration: bullet.maxDuration,
                    isAlive: true
                } as Entity);
            }

            // Collect enemies to spawn (from bosses, carriers, etc.)
            for (const spawn of result.enemiesToSpawn) {
                const newEnemy = createEnemy(
                    spawn.type,
                    spawn.pos.x,
                    spawn.pos.y,
                    gameTime / 60,
                    spawn.difficultyMult ?? 1,
                    spawn.level ?? difficulty.enemyLevelBonus,
                    spawn.tier === EnemyTier.ELITE,
                    spawn.tier === EnemyTier.LEGENDARY,
                    spawn.tier === EnemyTier.MINIBOSS
                );
                if (newEnemy) {
                    if (spawn.vel) {
                        newEnemy.vel.x = spawn.vel.x;
                        newEnemy.vel.y = spawn.vel.y;
                    }
                    enemiesToSpawn.push(newEnemy);
                }
            }

            if (enemy.isAlive) {
                nextEnemies.push(enemy);
            }
        }

        nextEnemies.push(...enemiesToSpawn);
        enemiesRef.current = nextEnemies;

        return { enemyBulletsToSpawn };
    }, [processSpawnDecision, waveManager, playerPosRef, difficulty, createEnemy, spawnBoss, gameMode, debugConfig, enemiesRef, spawnTimerRef, debugRespawnTimerRef]);

    return {
        enemiesRef,
        initEnemies,
        updateEnemies
    };
};
