
import { useRef, useCallback, useState, useEffect } from 'react';
import {
    GameState, PlayerStats, PersistentData, GameDifficulty, Upgrade, UpgradeType, EntityType, GameMode, DebugConfig
} from '../types';
import { INITIAL_STATS, WORLD_SIZE, DIFFICULTY_CONFIGS, UPGRADES } from '../constants';
import { usePlayer } from './game/usePlayer';
import { useEnemies } from './game/useEnemies';
import { useProjectiles } from './game/useProjectiles';
import { usePickups } from './game/usePickups';
import { useParticles } from './game/useParticles';
import { useCollision } from './game/useCollision';
import { powerUpManager } from '../core/systems/PowerUpManager';
import { inputManager } from '../core/systems/input';
import { UpgradeManager } from '../core/systems/UpgradeManager';
import { CONSUMABLE_EFFECTS } from '../core/registries/ConsumableRegistry';

export const useGameLogic = (
    gameState: GameState,
    setGameState: (s: GameState) => void,
    persistentData: PersistentData,
    setOfferedUpgrades: (u: any[]) => void,
    isPaused: boolean,
    selectedDifficulty: GameDifficulty,
    gameMode: GameMode,
    debugConfig: DebugConfig | null
) => {
    const [score, setScore] = useState(0);
    const gameTimeRef = useRef(0);

    // RUN STATS
    const runMetricsRef = useRef({
        shotsFired: 0,
        shotsHit: 0,
        enemiesKilled: 0,
        creditsEarned: 0
    });

    const difficultyConfig = DIFFICULTY_CONFIGS[selectedDifficulty];

    const {
        stats, setStats, statsRef, playerPosRef, cameraPosRef,
        lastPlayerHitTimeRef, initPlayer, updatePlayer, handleShieldRegen,
        addUpgrade, triggerPlayerHit, syncWithPersistentData, activateModule
    } = usePlayer(gameState, persistentData, isPaused);

    const { particlesRef, initParticles, spawnDamageText, spawnExplosion, spawnSpawnFlash, spawnLightning, updateParticles, addParticles } = useParticles();

    const { enemiesRef, initEnemies, updateEnemies } = useEnemies(
        playerPosRef,
        difficultyConfig,
        spawnSpawnFlash,
        gameMode,
        debugConfig
    );

    const handleShotFired = useCallback(() => {
        runMetricsRef.current.shotsFired++;
    }, []);

    const { projectilesRef, autoAttack, setAutoAttack, initProjectiles, fireWeapon, updateProjectiles, addProjectiles } = useProjectiles(playerPosRef, statsRef, handleShotFired);
    const { pickupsRef, initPickups, spawnDrops, updatePickups } = usePickups(playerPosRef, statsRef, difficultyConfig);

    const handleEnemyHit = useCallback(() => {
        runMetricsRef.current.shotsHit++;
    }, []);

    const handleEnemyKilled = useCallback(() => {
        runMetricsRef.current.enemiesKilled++;
    }, []);

    const handleCreditCollected = useCallback((amount: number) => {
        runMetricsRef.current.creditsEarned += amount;
    }, []);

    const { checkCollisions } = useCollision(
        enemiesRef, projectilesRef, pickupsRef, playerPosRef, statsRef,
        triggerPlayerHit, spawnDrops, spawnDamageText, spawnExplosion, spawnLightning, addParticles,
        setScore, setStats, setOfferedUpgrades, persistentData,
        handleEnemyHit, handleEnemyKilled, handleCreditCollected
    );

    // Manual Level Up Trigger (for HUD)
    const triggerManualLevelUp = useCallback(() => {
        if (statsRef.current.pendingLevelUps > 0) {
            setGameState(GameState.LEVELING);
        }
    }, [setGameState]);

    // AUTO LEVEL UP TRIGGER
    // Watches for changes in pendingLevelUps. If > 0 and auto-show is enabled, trigger state change.
    useEffect(() => {
        const autoShow = persistentData.settings.autoShowLevelUp ?? true;
        if (gameState === GameState.PLAYING && stats.pendingLevelUps > 0 && autoShow) {
            setGameState(GameState.LEVELING);
        }
    }, [stats.pendingLevelUps, gameState, persistentData.settings.autoShowLevelUp, setGameState]);


    // Effect to manage Upgrade Generation loop
    const [hasGeneratedOffers, setHasGeneratedOffers] = useState(false);

    useEffect(() => {
        if (gameState === GameState.LEVELING) {
            const currentPending = stats.pendingLevelUps;

            if (currentPending > 0 && !hasGeneratedOffers) {
                // Use UpgradeManager to generate offers
                const selection = UpgradeManager.generateOffers(stats.acquiredUpgrades);
                setOfferedUpgrades(selection);
                setHasGeneratedOffers(true);
            }
        } else {
            setHasGeneratedOffers(false);
        }
    }, [gameState, hasGeneratedOffers, stats.pendingLevelUps, stats.acquiredUpgrades, setGameState, setOfferedUpgrades]);

    // Handle Upgrade Selection (Consumable Effects vs Stat Application)
    const onUpgradeSelected = useCallback((upgrade: Upgrade) => {

        // 1. Handle Consumables (Logic-based)
        if (upgrade.type === UpgradeType.CONSUMABLE) {
            const effect = CONSUMABLE_EFFECTS[upgrade.id];
            if (effect) {
                effect({
                    setStats,
                    playerPos: playerPosRef.current,
                    enemies: enemiesRef.current,
                    projectiles: projectilesRef.current,
                    setProjectiles: (p) => { projectilesRef.current = p; }, // Direct ref update wrapper
                    setScore,
                    spawnSpawnFlash,
                    spawnDamageText,
                    spawnExplosion
                });
            }

            // Manually decrement level since we aren't calling addUpgrade for consumables
            setStats(p => ({ ...p, pendingLevelUps: Math.max(0, p.pendingLevelUps - 1) }));
        }
        // 2. Handle Stat/Permanent Upgrades
        else {
            UpgradeManager.applyUpgrade(upgrade, addUpgrade);
        }

        // Check if we need to close menu or stay open
        const prevPending = stats.pendingLevelUps;
        const nextPending = Math.max(0, prevPending - 1);

        if (nextPending <= 0) {
            setGameState(GameState.PLAYING);
        }

        setOfferedUpgrades([]);
        setHasGeneratedOffers(false);
    }, [setGameState, addUpgrade, setStats, setScore, spawnExplosion, spawnSpawnFlash, spawnDamageText, stats.pendingLevelUps]);


    // Initialize Game
    const initGame = useCallback((modeOverride?: GameMode) => {
        initPlayer();
        initEnemies(modeOverride);
        initProjectiles();
        initPickups();
        initParticles();
        setScore(0);
        gameTimeRef.current = 0;
        // Reset Run Metrics
        runMetricsRef.current = { shotsFired: 0, shotsHit: 0, enemiesKilled: 0, creditsEarned: 0 };
        setGameState(GameState.PLAYING);
    }, [initPlayer, initEnemies, initProjectiles, initPickups, initParticles, setGameState]);

    // Main Update Loop
    const update = useCallback((time: number, dt: number) => {
        if (gameState !== GameState.PLAYING || isPaused) return;

        // --- TIME WARP LOGIC ---
        // Check if Time Warp is active in any slot
        // Power = "Slow Factor" directly (e.g. 0.5 = 50% speed). No, let's assume power is "Multiplier". 
        // Logic in usePlayer: "power = 0.5". Upgrades add to power.
        // If power 0.5 = half speed. If power 0.6 = 60% speed? 
        // Wait, typical "Slow" means "Speed reduced BY X%". 
        // If power is 0.5, speed should be 0.5.
        // If upgrade adds 0.05, power becomes 0.55. Speed should be 0.55? Or 0.45?
        // Let's assume 'Power' is speed multiplier. 0.5 is default.
        // Wait, upgrades description: "-5% Enemy Speed (Stronger Slow)". 
        // So we want result to go LOWER.
        // usePlayer logic: "power = 0.5 + moduleMods.power". 
        // If upgrade adds 0.05, power = 0.55. 
        // If we treat power as "Time Scale", then 0.55 is FASTER than 0.5. That's wrong.
        // So upgrades should subtract from Time Scale? or Add to "Slow Amount".
        // Let's interpret Power as "Time Scale". 
        // Upgrade needs to REDUCE Time Scale. "operation: 'add', perLevel: -0.05".
        // Let's verify upgrades.ts.
        // "perLevel: 0.05". 
        // So I'll treat 'Power' as "Slow Amount" (0.5 = 50% slow). 
        // TimeScale = 1.0 - Power. (1.0 - 0.5 = 0.5).
        // If upgrade adds 0.05 -> Power = 0.55. TimeScale = 0.45. Perfect.

        let enemyTimeScale = 1.0;
        const timeWarpSlot = statsRef.current.moduleSlots.find(s => s.type === 'TIME_WARP' as any && time < s.activeUntil);
        if (timeWarpSlot) {
            enemyTimeScale = Math.max(0.1, 1.0 - timeWarpSlot.power);
        }

        const enemyDt = dt * enemyTimeScale;

        gameTimeRef.current += enemyDt; // Slow down game time too? Yes, for spawning pacing.

        // 1. Update Player (Player moves at normal speed always)
        updatePlayer(dt, time);
        handleShieldRegen(dt, time);

        // 2. Firing Logic (Player shoots at normal speed)
        const isOverdrive = powerUpManager.isBuffActive(statsRef.current, 'OVERDRIVE', time);
        const isOmni = powerUpManager.isBuffActive(statsRef.current, 'OMNI', time);
        const isPierce = powerUpManager.isBuffActive(statsRef.current, 'PIERCE', time);

        // Pass aim and trigger from inputManager
        const aimDir = inputManager.getAim();
        const isFiring = inputManager.isFiring();
        fireWeapon(time, isOverdrive, isOmni, isPierce, enemiesRef.current, aimDir, isFiring);

        // 3. Update Sub-systems
        // Update Enemies with SCALED DT
        const { enemyBulletsToSpawn } = updateEnemies(enemyDt, time, gameTimeRef.current);
        if (enemyBulletsToSpawn.length > 0) addProjectiles(enemyBulletsToSpawn);

        // Pass aim to updateProjectiles so lasers can rotate while charging
        // Pass enemyTimeScale to updateProjectiles so it can slow enemy bullets
        const { newExplosions } = updateProjectiles(dt, time, enemiesRef.current, aimDir, enemyTimeScale);
        // Handle expirations/timeouts from projectiles (e.g. Swarm Missiles timing out)
        if (newExplosions && newExplosions.length > 0) {
            newExplosions.forEach(exp => spawnExplosion(exp.pos, exp.radius, exp.color));
        }

        updatePickups(dt); // Pickups animate normally? Yes, keeps UX fluid.
        updateParticles(dt);

        // 4. Collisions
        checkCollisions(time, dt); // Collision checks happen at full speed (physics step), but entities moved less. Correct.

    }, [gameState, isPaused, updatePlayer, handleShieldRegen, fireWeapon, updateEnemies, addProjectiles, updateProjectiles, updatePickups, updateParticles, checkCollisions, spawnExplosion]);

    return {
        stats, score, playerPosRef, cameraPosRef,
        initGame, update, setStats, addUpgrade, statsRef, lastPlayerHitTime: lastPlayerHitTimeRef,
        syncWithPersistentData, autoAttack, setAutoAttack,
        // Expose split refs for the renderer
        enemiesRef, projectilesRef, pickupsRef, particlesRef,
        runMetricsRef,
        triggerManualLevelUp,
        onUpgradeSelected,
        activateModule,
        gameTime: gameTimeRef.current // Export current game duration
    };
};
