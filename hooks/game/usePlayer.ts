
import { useState, useRef, useCallback, useEffect } from 'react';
import { PlayerStats, Vector2D, Upgrade, PersistentData, WeaponType, ShipType, GameState, Entity, EntityType, UpgradeType, ModuleType } from '../../types';
import { INITIAL_STATS, WORLD_SIZE, SHIPS, WEAPON_BASE_STATS, CAMERA_LERP, UPGRADES } from '../../constants';
import { isBuffActive } from '../../systems/PowerUpSystem';

export const usePlayer = (
    gameState: GameState,
    persistentData: PersistentData,
    isPaused: boolean
) => {
    const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
    const playerPosRef = useRef<Vector2D>({ x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 });
    const cameraPosRef = useRef<Vector2D>({ x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 });
    const statsRef = useRef<PlayerStats>(INITIAL_STATS);
    const joystickDirRef = useRef<Vector2D>({ x: 0, y: 0 });
    const lastPlayerHitTimeRef = useRef(0);

    useEffect(() => { statsRef.current = stats; }, [stats]);

    // Calculates ONLY Base Stats + Meta Upgrades (Permanent progression)
    // Does NOT handle in-game upgrades.
    const calculateStats = useCallback((data: PersistentData) => {
        const shipConfig = SHIPS.find(s => s.type === data.equippedShip) || SHIPS[0];
        const weapon = data.equippedWeapon || WeaponType.PLASMA;
        const module = data.equippedModule || ModuleType.NONE;
        const baseWStats = WEAPON_BASE_STATS[weapon];

        // Meta Levels
        const hpL = data.metaLevels['meta_hp'] || 0;
        const dmgL = data.metaLevels['meta_dmg'] || 0;
        const magL = data.metaLevels['meta_magnet'] || 0;
        const spdL = data.metaLevels['meta_speed'] || 0;
        const shL = data.metaLevels['meta_shield'] || 0;
        const regenL = data.metaLevels['meta_regen'] || 0;
        const critChL = data.metaLevels['meta_crit_chance'] || 0;
        const critDmgL = data.metaLevels['meta_crit_dmg'] || 0;
        const salvageL = data.metaLevels['meta_salvage'] || 0;

        // Weapon Specific Meta Levels
        const plasDmgL = data.metaLevels['meta_plas_dmg'] || 0;
        const plasSpdL = data.metaLevels['meta_plas_speed'] || 0;
        const plasCountL = data.metaLevels['meta_plas_count'] || 0; 
        const plasRateL = data.metaLevels['meta_plas_rate'] || 0;
        
        const mslDmgL = data.metaLevels['meta_msl_dmg'] || 0;
        const mslRelL = data.metaLevels['meta_msl_reload'] || 0;
        const mslRadL = data.metaLevels['meta_msl_rad'] || 0;
        
        const lsrDmgL = data.metaLevels['meta_lsr_dmg'] || 0;
        const lsrDurL = data.metaLevels['meta_lsr_duration'] || 0;
        
        const swarmCountL = data.metaLevels['meta_swarm_count'] || 0;
        const swarmAgilityL = data.metaLevels['meta_swarm_agility'] || 0;
        const swarmDmgL = data.metaLevels['meta_swarm_dmg'] || 0;
        const swarmCdL = data.metaLevels['meta_swarm_cd'] || 0;

        // Module Specific Metas (Afterburner)
        const abDurL = data.metaLevels['meta_ab_dur'] || 0;
        const abCdL = data.metaLevels['meta_ab_cd'] || 0;
        const abSpdL = data.metaLevels['meta_ab_spd'] || 0;

        // Weapon Specific Metas
        let bCount = (shipConfig.baseStats.bulletCount || 1);
        let bSpeed = baseWStats.bulletSpeed;
        let bDamageMult = 1.0;
        let bPierce = 1;
        let fRate = baseWStats.fireRate;
        let mRadius = 195; // Updated Base Radius (was 150)
        let lDuration = 0.3;
        
        // Swarm defaults
        let sCount = 3; // Base 3
        let sAgility = 1.5; // Reduced Base Agility

        if (weapon === WeaponType.PLASMA) {
            bDamageMult *= (1 + plasDmgL * 0.05);
            bSpeed *= (1 + plasSpdL * 0.08);
            bCount += plasCountL; 
            fRate *= (1 + plasRateL * 0.05); // +5% per level, max level 10 = +50% (4.0 -> 6.0)
        } else if (weapon === WeaponType.MISSILE) {
            bDamageMult *= (1 + mslDmgL * 0.05);
            fRate *= (1 + mslRelL * 0.05);
            mRadius = 195 * (1 + mslRadL * 0.10); // 150 -> 195
        } else if (weapon === WeaponType.LASER) {
             bDamageMult *= (1 + lsrDmgL * 0.05);
             fRate *= (1 + (data.metaLevels['meta_lsr_recharge'] || 0) * 0.1); 
             lDuration = 0.3 * (1 + lsrDurL * 0.10); // +10% duration per level
             bPierce = 999; 
        } else if (weapon === WeaponType.SWARM_LAUNCHER) {
             bDamageMult *= (1 + swarmDmgL * 0.05);
             sCount = 3 + swarmCountL; // 3 base + upgrades (up to 20 total)
             sAgility = 1.5 * (1 + swarmAgilityL * 0.15); // +15% per level to catch up to old values
             fRate *= (1 + swarmCdL * 0.05); // CD reduction
        }

        // Module Stats Calculation
        let mDur = 0;
        let mCd = 0;
        let mPwr = 0;

        if (module === ModuleType.AFTERBURNER) {
            mDur = 10000 + (abDurL * 1000); // 10s base + 1s per level
            mCd = Math.max(5000, 60000 - (abCdL * 2000)); // 60s base - 2s per level (min 5s)
            mPwr = 2.0 * (1 + abSpdL * 0.10); // 2x base speed * upgrades
        }

        const finalMaxHP = (shipConfig.baseStats.maxHealth || 100) * (1 + hpL * 0.10);
        const finalMaxShield = (shipConfig.baseStats.maxShield || 20) * (1 + shL * 0.15);
        const finalShieldRegen = (shipConfig.baseStats.shieldRegen || 3) * (1 + regenL * 0.10);
        
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
            
            speed: (shipConfig.baseStats.speed || 240) * (1 + spdL * 0.02),
            damage: baseWStats.damage * (1 + dmgL * 0.05) * bDamageMult,
            fireRate: fRate,
            magnetRange: INITIAL_STATS.magnetRange * (1 + magL * 0.05), // Updated to 5% per level
            bulletCount: bCount,
            bulletSpeed: bSpeed,
            pierceCount: bPierce,
            missileRadius: mRadius,
            laserDuration: lDuration,
            swarmCount: sCount,
            swarmAgility: sAgility,
            
            moduleType: module,
            moduleCooldownMax: mCd,
            moduleDuration: mDur,
            modulePower: mPwr,
            moduleReadyTime: 0,
            moduleActiveUntil: 0,
            
            critChance: (shipConfig.baseStats.critChance || 0.05) + (critChL * 0.01),
            critMultiplier: 1.5 + (critDmgL * 0.05),
            creditMultiplier: 1.0 + (salvageL * 0.05),

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
            // Only apply STAT upgrades (Consumables are instant and shouldn't persist in stats via this list)
            if (upg && upg.type === UpgradeType.STAT && upg.effect) {
                newStats = upg.effect(newStats);
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

    const activateModule = useCallback(() => {
        setStats(prev => {
            const now = performance.now();
            if (prev.moduleType === ModuleType.NONE) return prev;
            if (now < prev.moduleReadyTime) return prev; // Cooldown not ready
            if (now < prev.moduleActiveUntil) return prev; // Already active

            return {
                ...prev,
                moduleActiveUntil: now + prev.moduleDuration,
                moduleReadyTime: now + prev.moduleCooldownMax
            };
        });
    }, []);

    const updatePlayer = useCallback((dt: number, time: number) => {
        if (gameState !== GameState.PLAYING || isPaused) {
             // Drifting when dying or paused (no input control)
             if (gameState === GameState.DYING) {
                 playerPosRef.current.x += joystickDirRef.current.x * 20 * dt; 
                 playerPosRef.current.y += joystickDirRef.current.y * 20 * dt;
             }
             return;
        }
        
        const pStats = statsRef.current;
        let moveSpeed = pStats.speed;
        
        // Speed Buffs
        if (isBuffActive(pStats, 'SPEED', time)) {
             moveSpeed *= 1.5; 
        }
        // Module Boost
        if (time < pStats.moduleActiveUntil) {
            moveSpeed *= pStats.modulePower;
        }

        playerPosRef.current.x += joystickDirRef.current.x * moveSpeed * dt;
        playerPosRef.current.y += joystickDirRef.current.y * moveSpeed * dt;
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
            
            // Only apply effect if it's a STAT upgrade and has an effect function
            if (upgrade.type === UpgradeType.STAT && upgrade.effect) {
                newStats = upgrade.effect(newStats);
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
                if (source.type === EntityType.ENEMY_SCOUT) sourceName = "Void Scout";
                else if (source.type === EntityType.ENEMY_STRIKER) sourceName = "Crimson Striker";
                else if (source.type === EntityType.ENEMY_LASER_SCOUT) sourceName = "Sniper Drone";
                else if (source.type === EntityType.ENEMY_KAMIKAZE) sourceName = "Kamikaze Drone";
                else if (source.type === EntityType.ENEMY_BOSS) sourceName = "Dreadnought";
                else if (source.type === EntityType.ENEMY_BOSS_DESTROYER) sourceName = "Imperial Destroyer";
                else if (source.type === EntityType.ENEMY_BULLET) sourceName = "Enemy Fire";
                
                if (source.isElite) sourceName = `Elite ${sourceName}`;
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
        stats, setStats, statsRef, playerPosRef, cameraPosRef, joystickDirRef, lastPlayerHitTimeRef,
        initPlayer, updatePlayer, handleShieldRegen, addUpgrade, triggerPlayerHit, syncWithPersistentData,
        activateModule
    };
};
