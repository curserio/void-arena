
import { useState, useRef, useCallback, useEffect } from 'react';
import { PlayerStats, Vector2D, Upgrade, PersistentData, WeaponType, ShipType, GameState, Entity, EntityType, UpgradeType, ModuleType } from '../../types';
import { EnemyType } from '../../types/enemies';
import { INITIAL_STATS, WORLD_SIZE, SHIPS, WEAPON_BASE_STATS, CAMERA_LERP, UPGRADES } from '../../constants';
import { powerUpManager } from '../../core/systems/PowerUpManager';
import { inputManager } from '../../core/systems/input';
import { calculateWeaponModifiers, calculateModuleModifiers, calculateGeneralModifiers, applyInGameUpgrade } from '../../core/systems/upgrades';

export const usePlayer = (
    gameState: GameState,
    persistentData: PersistentData,
    isPaused: boolean
) => {
    const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
    const playerPosRef = useRef<Vector2D>({ x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 });
    const cameraPosRef = useRef<Vector2D>({ x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 });
    const statsRef = useRef<PlayerStats>(INITIAL_STATS);
    const lastPlayerHitTimeRef = useRef(0);

    useEffect(() => { statsRef.current = stats; }, [stats]);

    // Calculates ONLY Base Stats + Meta Upgrades (Permanent progression)
    // Does NOT handle in-game upgrades.
    const calculateStats = useCallback((data: PersistentData) => {
        const shipConfig = SHIPS.find(s => s.type === data.equippedShip) || SHIPS[0];
        const weapon = data.equippedWeapon || WeaponType.PLASMA;
        const equippedModules = data.equippedModules || [];
        const baseWStats = WEAPON_BASE_STATS[weapon];

        // Use UpgradeCalculator for general player modifiers
        const generalMods = calculateGeneralModifiers(data.metaLevels);

        // Use UpgradeCalculator for weapon modifiers
        const weaponMods = calculateWeaponModifiers(weapon, data.metaLevels);

        // Base weapon stats with calculator modifiers applied
        let bCount = (shipConfig.baseStats.bulletCount || 1) + weaponMods.bulletCount;
        let bSpeed = baseWStats.bulletSpeed * weaponMods.bulletSpeed;
        let bDamageMult = weaponMods.damageMult;
        let bPierce = weaponMods.pierceCount;
        let fRate = baseWStats.fireRate * weaponMods.fireRate;
        let aSize = baseWStats.areaSize * weaponMods.explosionRadius; // Generic Area Size
        let pDuration = (baseWStats.duration || 2000) * weaponMods.duration; // Generic Duration
        let lDuration = 0.3 * weaponMods.laserDuration;
        const cRange = 250 * weaponMods.chainRange; // Base 250

        // Swarm defaults + calculator
        let sCount = 3 + weaponMods.swarmCount;
        let sAgility = 1.5 * weaponMods.swarmAgility;

        // Weapon-specific defaults and special handling
        if (weapon === WeaponType.LASER) {
            bPierce = 999; // Always infinite pierce for laser
        } else if (weapon === WeaponType.RAILGUN) {
            bPierce = 999; // Always infinite pierce for railgun
            // Note: Hypervelocity +2% damage is now handled declaratively via effects[]
        } else if (weapon === WeaponType.FLAK_CANNON) {
            // Base pellet count is 8, not ship bulletCount
            bCount = 8 + weaponMods.bulletCount;
        }

        // Build module slots from equipped modules using calculator
        const buildModuleSlot = (moduleType: ModuleType): import('../../types').ModuleSlot => {
            const moduleMods = calculateModuleModifiers(moduleType, data.metaLevels);
            let duration = 0, cooldown = 0, power = 0;

            if (moduleType === ModuleType.AFTERBURNER) {
                // Base: 10s duration, 60s CD, 2.0 power
                duration = 10000 + moduleMods.duration;
                cooldown = Math.max(5000, 60000 + moduleMods.cooldown);
                power = 2.0 * moduleMods.power;
            } else if (moduleType === ModuleType.SHIELD_BURST) {
                // Base: 0.5s invuln, 20s CD
                duration = 500 + moduleMods.duration;
                cooldown = Math.max(15000, 20000 + moduleMods.cooldown);
                power = 0; // Shield Burst doesn't use power for heal anymore
            } else if (moduleType === ModuleType.PHASE_SHIFT) {
                // Base: 2s invuln, 25s CD — pure evasion, no upgrades yet
                duration = 2000;
                cooldown = 25000;
                power = 0;
            } else if (moduleType === ModuleType.TIME_WARP) {
                // Base: 4s duration, 40s CD, 0.5 slow power (50%)
                duration = 4000 + moduleMods.duration;
                cooldown = Math.max(15000, 40000 + moduleMods.cooldown);
                power = 0.5 + moduleMods.power; // 0.5 base + upgrades (e.g. +0.05 = 0.55 slow factor? No, power is applied as speed multiplier usually. Or slow strength?)
                // If power is "Speed Multiplier": 0.5 means half speed.
                // Upgrades usually ADD to power. "Viscosity" adds 0.05.
                // If we want stronger slow, we need LOWER multiplier?
                // Or we define power as "Slow Amount". 0.5 = 50% slow. 0.55 = 55% slow.
                // Then speedMult = 1.0 - power.
            }

            return {
                type: moduleType,
                cooldownMax: cooldown,
                duration: duration,
                power: power,
                readyTime: 0,
                activeUntil: 0
            };
        };

        const moduleSlots = equippedModules
            .filter(m => m !== ModuleType.NONE)
            .map(buildModuleSlot);

        // Apply general modifiers using calculator
        const finalMaxHP = (shipConfig.baseStats.maxHealth || 100) * generalMods.maxHealth;
        const finalMaxShield = (shipConfig.baseStats.maxShield || 20) * generalMods.maxShield;
        const finalShieldRegen = (shipConfig.baseStats.shieldRegen || 3) * generalMods.shieldRegen;

        // Base stats from ship config + Meta scaling
        let metaStats: PlayerStats = {
            ...INITIAL_STATS,
            ...shipConfig.baseStats,
            shipType: data.equippedShip,
            weaponType: weapon,
            maxHealth: finalMaxHP,
            currentHealth: finalMaxHP,
            maxShield: finalMaxShield,
            currentShield: finalMaxShield,
            shieldRegen: finalShieldRegen,

            speed: (shipConfig.baseStats.speed || 240) * generalMods.speed,
            damage: baseWStats.damage * generalMods.baseDamage * bDamageMult,
            fireRate: fRate,
            magnetRange: INITIAL_STATS.magnetRange * generalMods.magnetRange,
            bulletCount: bCount,
            bulletSpeed: bSpeed,
            pierceCount: bPierce,
            chainRange: cRange,
            areaSize: aSize,
            duration: pDuration,
            laserDuration: lDuration,
            swarmCount: sCount,
            swarmAgility: sAgility,

            moduleSlots: moduleSlots,

            critChance: (shipConfig.baseStats.critChance || 0.05) + generalMods.critChance,
            critMultiplier: 1.5 * generalMods.critDamage,
            creditMultiplier: generalMods.salvageBonus,

            // RPG Persistence Loading (Just basics, upgrade reconstruction happens in sync)
            level: data.currentLevel || 1,
            xp: data.currentXp || 0,
            xpToNextLevel: data.xpToNextLevel || 250,

            credits: 0, // Reset session credits (bank is in persistentData)

            invulnerableUntil: 0,
            activeBuffs: {},
            acquiredUpgrades: [],

            combatLog: []
        };

        return metaStats;
    }, []);

    const initPlayer = useCallback(() => {
        // 1. Calculate Base Stats (Ship + Meta)
        let newStats = calculateStats(persistentData);

        // 2. Hydrate saved "Level Up" rewards to make them permanent RPG style
        const savedIds = persistentData.acquiredUpgradeIds || [];
        const hydratedUpgrades: Upgrade[] = [];

        savedIds.forEach(id => {
            const upg = UPGRADES.find(u => u.id === id);
            // Only apply STAT upgrades with declarative effects
            if (upg && upg.type === UpgradeType.STAT && upg.effects) {
                newStats = applyInGameUpgrade(newStats, upg);
                hydratedUpgrades.push(upg);
            }
        });

        // Store the full objects so the UI and logic can see what we have
        newStats.acquiredUpgrades = hydratedUpgrades;

        // 3. Reset Position
        playerPosRef.current = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
        cameraPosRef.current = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };

        // 4. Full Heal on Mission Start
        newStats.currentHealth = newStats.maxHealth;
        newStats.currentShield = newStats.maxShield;

        setStats(newStats);
        lastPlayerHitTimeRef.current = 0;
    }, [persistentData, calculateStats]);

    /**
     * Activate a specific module by slot index (0, 1, or 2)
     */
    const activateModule = useCallback((slotIndex: number) => {
        setStats(prev => {
            const now = performance.now();
            const slot = prev.moduleSlots[slotIndex];

            // Validate slot exists
            if (!slot || slot.type === ModuleType.NONE) return prev;
            if (now < slot.readyTime) return prev; // Cooldown not ready
            if (now < slot.activeUntil) return prev; // Already active

            // Update the slot in the array
            const newSlots = [...prev.moduleSlots];
            newSlots[slotIndex] = {
                ...slot,
                activeUntil: now + slot.duration,
                readyTime: now + slot.cooldownMax
            };

            let newStats: PlayerStats = {
                ...prev,
                moduleSlots: newSlots
            };

            // Module-specific activation effects
            if (slot.type === ModuleType.SHIELD_BURST) {
                // Instantly restore shield to max
                newStats.currentShield = newStats.maxShield;
                // Grant invulnerability for duration
                newStats.invulnerableUntil = now + slot.duration;
            } else if (slot.type === ModuleType.PHASE_SHIFT) {
                // Pure invulnerability - no shield restore
                newStats.invulnerableUntil = now + slot.duration;
            }

            return newStats;
        });
    }, []);

    const updatePlayer = useCallback((dt: number, time: number) => {
        const movement = inputManager.getMovement();

        if (gameState !== GameState.PLAYING || isPaused) {
            // Drifting when dying or paused (no input control)
            if (gameState === GameState.DYING) {
                playerPosRef.current.x += movement.x * 20 * dt;
                playerPosRef.current.y += movement.y * 20 * dt;
            }
            return;
        }

        const pStats = statsRef.current;
        let moveSpeed = pStats.speed;

        // Speed Buffs
        if (powerUpManager.isBuffActive(pStats, 'SPEED', time)) {
            moveSpeed *= 1.5;
        }
        // Afterburner Module Boost (check slots for active Afterburner)
        const afterburnerSlot = pStats.moduleSlots.find(s => s.type === ModuleType.AFTERBURNER);
        if (afterburnerSlot && time < afterburnerSlot.activeUntil) {
            moveSpeed *= afterburnerSlot.power;
        }

        playerPosRef.current.x += movement.x * moveSpeed * dt;
        playerPosRef.current.y += movement.y * moveSpeed * dt;
        playerPosRef.current.x = Math.max(30, Math.min(WORLD_SIZE - 30, playerPosRef.current.x));
        playerPosRef.current.y = Math.max(30, Math.min(WORLD_SIZE - 30, playerPosRef.current.y));
        cameraPosRef.current.x += (playerPosRef.current.x - cameraPosRef.current.x) * CAMERA_LERP;
        cameraPosRef.current.y += (playerPosRef.current.y - cameraPosRef.current.y) * CAMERA_LERP;
    }, [gameState, isPaused]);

    const handleShieldRegen = useCallback((dt: number, time: number) => {
        const pStats = statsRef.current;
        if (time - pStats.lastShieldHitTime > 3000 && pStats.currentShield < pStats.maxShield) {
            const newShield = Math.min(pStats.maxShield, pStats.currentShield + pStats.shieldRegen * dt);
            setStats(p => ({ ...p, currentShield: newShield }));
        }
    }, []);

    const addUpgrade = useCallback((upgrade: Upgrade) => {
        setStats(p => {
            let newStats = { ...p };

            // Only apply declarative effects for STAT upgrades
            if (upgrade.type === UpgradeType.STAT && upgrade.effects) {
                newStats = applyInGameUpgrade(newStats, upgrade);
                newStats.acquiredUpgrades = [...p.acquiredUpgrades, upgrade];
            }

            return {
                ...newStats,
                pendingLevelUps: Math.max(0, p.pendingLevelUps - 1)
            };
        });
    }, []);

    const triggerPlayerHit = useCallback((time: number, damage: number, source: Entity | string) => {
        const p = statsRef.current;
        if (time < p.invulnerableUntil) return;

        lastPlayerHitTimeRef.current = time;
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);

        setStats(prev => {
            let remainingDmg = damage;
            let newShield = prev.currentShield;
            let newHealth = prev.currentHealth;
            if (newShield > 0) {
                const shieldDamage = Math.min(newShield, remainingDmg);
                newShield -= shieldDamage;
                remainingDmg -= shieldDamage;
            }
            if (remainingDmg > 0) newHealth = Math.max(0, newHealth - remainingDmg);

            // Log entry
            let sourceName = "Unknown Hazard";
            let enemyLevel: number | undefined = undefined;

            if (typeof source === 'string') {
                sourceName = source;
            } else {
                // Check enemyType first (new system), fall back to type (legacy)
                const enemyType = 'enemyType' in source ? (source as any).enemyType : undefined;
                if (enemyType) {
                    if (enemyType === EnemyType.SCOUT) sourceName = "Void Scout";
                    else if (enemyType === EnemyType.STRIKER) sourceName = "Crimson Striker";
                    else if (enemyType === EnemyType.LASER_SCOUT) sourceName = "Sniper Drone";
                    else if (enemyType === EnemyType.KAMIKAZE) sourceName = "Kamikaze Drone";
                    else if (enemyType === EnemyType.BOSS_DREADNOUGHT) sourceName = "Dreadnought";
                    else if (enemyType === EnemyType.BOSS_DESTROYER) sourceName = "Imperial Destroyer";
                    else sourceName = "Enemy Fire";
                } else {
                    // Legacy fallback
                    if (source.type === EntityType.ENEMY_BULLET) sourceName = "Enemy Fire";
                    else if (source.id === 'environment') sourceName = "Environment";
                }

                if (source.isLegendary) sourceName = `Legendary ${sourceName}`;
                else if (source.isElite) sourceName = `Elite ${sourceName}`;
                if (source.isMiniboss) sourceName = `Giant ${sourceName}`;
                if (source.level) enemyLevel = source.level;
            }

            const logEntry = {
                timestamp: Date.now(),
                damage: damage,
                source: sourceName,
                isFatal: newHealth <= 0,
                enemyLevel
            };

            // Keep last 5 entries
            const newLog = [...prev.combatLog, logEntry].slice(-6);

            return {
                ...prev,
                currentShield: newShield,
                currentHealth: newHealth,
                lastShieldHitTime: time,
                invulnerableUntil: time + 300,
                combatLog: newLog
            };
        });
    }, []);

    const syncWithPersistentData = useCallback((newData: PersistentData) => {
        // 1. Calculate base stats from NEW persistent data (Meta Upgrades)
        const freshBaseStats = calculateStats(newData);

        setStats(current => {
            // 2. Determine current health/shield ratios relative to the OLD max
            // This ensures we preserve damage state when max values change
            const hpRatio = current.maxHealth > 0 ? current.currentHealth / current.maxHealth : 1;
            const shieldRatio = current.maxShield > 0 ? current.currentShield / current.maxShield : 1;

            // 3. Re-apply ALL current session upgrades to the FRESH base stats
            // This stacks Meta upgrades (in freshBase) with Session upgrades (in current.acquiredUpgrades)
            let rehydratedStats = { ...freshBaseStats };

            if (current.acquiredUpgrades && current.acquiredUpgrades.length > 0) {
                current.acquiredUpgrades.forEach(u => {
                    if (u.effect) {
                        rehydratedStats = u.effect(rehydratedStats);
                    }
                });
                rehydratedStats.acquiredUpgrades = current.acquiredUpgrades;
            }

            // 4. Restore preserved state fields (Level, XP, Credits, Buffs, etc.)
            rehydratedStats.level = current.level;
            rehydratedStats.xp = current.xp;
            rehydratedStats.xpToNextLevel = current.xpToNextLevel;
            rehydratedStats.pendingLevelUps = current.pendingLevelUps;
            rehydratedStats.credits = current.credits;
            rehydratedStats.activeBuffs = current.activeBuffs;
            rehydratedStats.combatLog = current.combatLog;

            // Restore Module State times to prevent reset exploit
            rehydratedStats.moduleReadyTime = current.moduleReadyTime;
            rehydratedStats.moduleActiveUntil = current.moduleActiveUntil;

            // 5. Apply the Health/Shield ratios to the NEW fully calculated Max values
            rehydratedStats.currentHealth = Math.min(rehydratedStats.maxHealth, rehydratedStats.maxHealth * hpRatio);
            rehydratedStats.currentShield = Math.min(rehydratedStats.maxShield, rehydratedStats.maxShield * shieldRatio);

            return rehydratedStats;
        });
    }, [calculateStats]);

    return {
        stats, setStats, statsRef, playerPosRef, cameraPosRef, lastPlayerHitTimeRef,
        initPlayer, updatePlayer, handleShieldRegen, addUpgrade, triggerPlayerHit, syncWithPersistentData,
        activateModule
    };
};
