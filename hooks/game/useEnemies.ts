/**
 * useEnemies Hook - Refactored for Phase 1.5
 * 
 * Key changes:
 * - Stores IEnemy instances directly instead of legacy Entity objects
 * - Delegates update logic to enemy class methods
 * - Converts to legacy Entity only for rendering
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { Entity, EntityType, Vector2D, DifficultyConfig, GameMode, DebugConfig } from '../../types';
import { WORLD_SIZE } from '../../constants';
import { EnemyType, EnemyTier, IEnemy } from '../../types/enemies';
import { UpdateContext, IProjectileSpawn, IEnemySpawn } from '../../types/entities';
import { enemyFactory } from '../../core/factories/EnemyFactory';
import { projectileIdGen } from '../../core/utils/IdGenerator';
import { BaseEnemy } from '../../core/entities/enemies/BaseEnemy';
import { WaveManager, SpawnDecision } from '../../core/systems/WaveManager';
import { DEFAULT_WAVE_CONFIG } from '../../data/spawning/waveConfig';

export const useEnemies = (
    playerPosRef: React.MutableRefObject<Vector2D>,
    difficulty: DifficultyConfig,
    spawnSpawnFlash: (pos: Vector2D) => void,
    gameMode: GameMode = GameMode.STANDARD,
    debugConfig: DebugConfig | null = null
) => {
    // Store actual IEnemy instances
    const enemiesRef = useRef<IEnemy[]>([]);

    // Wave Manager for spawn decisions
    const waveManager = useMemo(() => new WaveManager(DEFAULT_WAVE_CONFIG, difficulty), [difficulty]);

    const spawnTimerRef = useRef(0);
    const debugRespawnTimerRef = useRef(0);

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

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

    // =========================================================================
    // HELPER: Sync IEnemy to Legacy Entity for rendering
    // =========================================================================



    // =========================================================================
    // ENEMY CREATION
    // =========================================================================

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
        // Validate enemy type (regular enemies only, not bosses)
        const validTypes = [EnemyType.SCOUT, EnemyType.STRIKER, EnemyType.LASER_SCOUT, EnemyType.KAMIKAZE, EnemyType.ASTEROID];
        if (!validTypes.includes(enemyType)) {
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

    // =========================================================================
    // BOSS SPAWNING
    // =========================================================================

    const spawnBoss = useCallback((
        bossType: EnemyType.BOSS_DREADNOUGHT | EnemyType.BOSS_DESTROYER,
        difficultyMultiplier: number,
        levelBonus: number,
        currentTime: number,
        waveIndex: number = 0,
        bossTierOverride?: 'NORMAL' | 'ELITE' | 'LEGENDARY'
    ) => {
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

        enemiesRef.current.push(boss);
        spawnSpawnFlash({ x, y });
    }, [playerPosRef, spawnSpawnFlash]);

    // =========================================================================
    // SPAWN DECISION PROCESSING (uses WaveManager)
    // =========================================================================

    const processSpawnDecision = useCallback((decision: SpawnDecision, gameTime: number, currentTime: number) => {
        const difficultyMultiplier = waveManager.getDifficultyMultiplier(gameTime);
        const levelBonus = difficulty.enemyLevelBonus;
        const gameMinutes = gameTime / 60;

        switch (decision.type) {
            case 'boss':
                if (decision.bossType && decision.waveIndex !== undefined) {
                    waveManager.markBossSpawned(decision.waveIndex);
                    spawnBoss(decision.bossType, difficultyMultiplier, levelBonus, currentTime, decision.waveIndex);
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

    // =========================================================================
    // UPDATE LOOP - Delegated to Enemy Classes
    // =========================================================================

    const updateEnemies = useCallback((dt: number, time: number, gameTime: number) => {

        // --- SPAWNING LOGIC (via WaveManager) ---
        if (gameMode === GameMode.STANDARD) {
            spawnTimerRef.current += dt;

            const decision = waveManager.getSpawnDecision(gameTime, spawnTimerRef.current);

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
                    // TODO: Boss tier support (normal/elite/legendary) could be added to spawnBoss
                    spawnBoss(bossType, debugConfig.level * 0.2, debugConfig.level, time, 0, debugConfig.tier !== 'MINIBOSS' ? debugConfig.tier : 'NORMAL');
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
        };

        for (const enemy of enemiesRef.current) {
            // Call the enemy's own update method
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
                    damage: bullet.damage,  // Pass through calculated damage
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

            // Collect enemies to spawn (e.g., kamikaze drones from Destroyer)
            for (const spawn of result.enemiesToSpawn) {
                const newEnemy = createEnemy(
                    EnemyType.KAMIKAZE, // For now only Kamikaze spawning is supported
                    spawn.pos.x,
                    spawn.pos.y,
                    gameTime / 60,
                    spawn.difficultyMult ?? 1,
                    difficulty.enemyLevelBonus
                );
                if (newEnemy) {
                    // Apply initial velocity if provided
                    if (spawn.vel) {
                        newEnemy.vel.x = spawn.vel.x;
                        newEnemy.vel.y = spawn.vel.y;
                    }
                    enemiesToSpawn.push(newEnemy);
                }
            }

            // Keep alive enemies
            if (enemy.isAlive) {
                nextEnemies.push(enemy);
            }
        }

        // Add newly spawned enemies
        nextEnemies.push(...enemiesToSpawn);

        // Update refs
        enemiesRef.current = nextEnemies;



        return { enemyBulletsToSpawn };
    }, [processSpawnDecision, waveManager, playerPosRef, difficulty, createEnemy, spawnBoss, gameMode, debugConfig]);

    // Return both IEnemy ref and legacy ref for compatibility
    return {
        enemiesRef: enemiesRef,  // Now returning proper IEnemy[]
        initEnemies,
        updateEnemies
    };
};
