import { useState, useRef, useCallback, useEffect } from 'react';
import { PlayerStats, Vector2D, Upgrade, PersistentData, WeaponType, ShipType, GameState } from '../../types';
import { INITIAL_STATS, WORLD_SIZE, SHIPS, WEAPON_BASE_STATS, CAMERA_LERP } from '../../constants';

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

    // Sync ref with state for performance in loops
    useEffect(() => { statsRef.current = stats; }, [stats]);

    const initPlayer = useCallback(() => {
        const shipConfig = SHIPS.find(s => s.type === persistentData.equippedShip) || SHIPS[0];
        const weapon = persistentData.equippedWeapon || WeaponType.PLASMA;
        const baseWStats = WEAPON_BASE_STATS[weapon];

        const hpL = persistentData.metaLevels['meta_hp'] || 0;
        const dmgL = persistentData.metaLevels['meta_dmg'] || 0;
        const magL = persistentData.metaLevels['meta_magnet'] || 0;
        const spdL = persistentData.metaLevels['meta_speed'] || 0;
        const shL = persistentData.metaLevels['meta_shield_max'] || 0;

        let bCount = 1;
        let bSpeed = baseWStats.bulletSpeed;
        let bDamageMult = 1.0;
        let bPierce = 1;

        if (weapon === WeaponType.PLASMA) {
            bCount = 1 + (persistentData.metaLevels['meta_plas_count'] || 0);
            bSpeed *= (1 + (persistentData.metaLevels['meta_plas_spd'] || 0) * 0.15);
            bDamageMult *= (1 + (persistentData.metaLevels['meta_plas_dmg'] || 0) * 0.15);
        } else if (weapon === WeaponType.MISSILE) {
            bDamageMult *= (1 + (persistentData.metaLevels['meta_msl_dmg'] || 0) * 0.2);
        } else if (weapon === WeaponType.LASER) {
            bDamageMult *= (1 + (persistentData.metaLevels['meta_lsr_burn'] || 0) * 0.25);
            bPierce = 2 + (persistentData.metaLevels['meta_lsr_pierce'] || 0);
        }

        const finalMaxHP = (shipConfig.baseStats.maxHealth || 100) * (1 + hpL * 0.15);
        const finalMaxShield = (shipConfig.baseStats.maxShield || 20) * (1 + shL * 0.20);
        const finalSpeed = (shipConfig.baseStats.speed || 230) * (1 + spdL * 0.10);

        const metaStats: PlayerStats = {
            ...INITIAL_STATS,
            ...shipConfig.baseStats,
            shipType: persistentData.equippedShip,
            weaponType: weapon,
            maxHealth: finalMaxHP,
            currentHealth: finalMaxHP,
            maxShield: finalMaxShield,
            currentShield: finalMaxShield,
            speed: finalSpeed,
            damage: baseWStats.damage * (1 + dmgL * 0.10) * bDamageMult,
            fireRate: baseWStats.fireRate,
            magnetRange: INITIAL_STATS.magnetRange * (1 + magL * 0.25),
            bulletCount: bCount,
            bulletSpeed: bSpeed,
            pierceCount: bPierce
        };

        playerPosRef.current = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
        cameraPosRef.current = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
        setStats(metaStats);
        lastPlayerHitTimeRef.current = 0;
    }, [persistentData]);

    const updatePlayer = useCallback((dt: number, time: number) => {
        if (gameState !== GameState.PLAYING || isPaused) return;

        const pStats = statsRef.current;

        // Movement
        playerPosRef.current.x += joystickDirRef.current.x * pStats.speed * dt;
        playerPosRef.current.y += joystickDirRef.current.y * pStats.speed * dt;

        // Boundary check
        playerPosRef.current.x = Math.max(30, Math.min(WORLD_SIZE - 30, playerPosRef.current.x));
        playerPosRef.current.y = Math.max(30, Math.min(WORLD_SIZE - 30, playerPosRef.current.y));

        // Camera follow
        cameraPosRef.current.x += (playerPosRef.current.x - cameraPosRef.current.x) * CAMERA_LERP;
        cameraPosRef.current.y += (playerPosRef.current.y - cameraPosRef.current.y) * CAMERA_LERP;

        // Shield Regen
        if (time - pStats.lastShieldHitTime > 3000 && pStats.currentShield < pStats.maxShield) {
            // We use setStats functional update in the main loop OR we can mutate a ref backup?
            // React state updates in a loop (60fps) can be heavy if not batched.
            // However, the original code did `setStats` for shield regen.
            // To optimize, maybe only update React state on significant changes or throttle.
            // For now, I'll keep the logic but consider optimizing later.
            // I'll return a delta or flag to let the main loop know to update state? 
            // Actually, passing `setStats` here is fine if it matches original behavior.
        }
    }, [gameState, isPaused]);

    // Shield Regen Logic needs to be exposed or handled. 
    // I will expose a function to handle shield regen that returns the new stats or null
    const handleShieldRegen = useCallback((dt: number, time: number) => {
        const pStats = statsRef.current;
        if (time - pStats.lastShieldHitTime > 3000 && pStats.currentShield < pStats.maxShield) {
            const newShield = Math.min(pStats.maxShield, pStats.currentShield + pStats.shieldRegen * dt);
            setStats(p => ({ ...p, currentShield: newShield }));
        }
    }, []);

    const addUpgrade = useCallback((upgrade: Upgrade) => {
        setStats(p => {
            const newStats = upgrade.effect(p);
            return { ...newStats, acquiredUpgrades: [...p.acquiredUpgrades, upgrade] };
        });
    }, []);

    const triggerPlayerHit = useCallback((time: number, damage: number) => {
        lastPlayerHitTimeRef.current = time;
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
        setStats(p => {
            let remainingDmg = damage;
            let newShield = p.currentShield;
            let newHealth = p.currentHealth;
            if (newShield > 0) {
                const shieldDamage = Math.min(newShield, remainingDmg);
                newShield -= shieldDamage;
                remainingDmg -= shieldDamage;
            }
            if (remainingDmg > 0) newHealth = Math.max(0, newHealth - remainingDmg);
            return { ...p, currentShield: newShield, currentHealth: newHealth, lastShieldHitTime: time };
        });
    }, []);

    const syncWithPersistentData = useCallback((newData: PersistentData) => {
        // Re-run init logic basically, but preserving health if needed? 
        // The original code calculated levels and applied them.
        // I will copy the logic from original useGameLogic.
        // ... (Logic is same as initPlayer but applying to 'current' state)
        setStats(current => {
            const shipConfig = SHIPS.find(s => s.type === newData.equippedShip) || SHIPS[0];
            const weapon = newData.equippedWeapon || WeaponType.PLASMA;
            const baseWStats = WEAPON_BASE_STATS[weapon];

            const hpL = newData.metaLevels['meta_hp'] || 0;
            const dmgL = newData.metaLevels['meta_dmg'] || 0;
            const magL = newData.metaLevels['meta_magnet'] || 0;
            const spdL = newData.metaLevels['meta_speed'] || 0;
            const shL = newData.metaLevels['meta_shield_max'] || 0;

            let bCount = 1;
            let bSpeed = baseWStats.bulletSpeed;
            let bDamageMult = 1.0;
            let bPierce = 1;

            if (weapon === WeaponType.PLASMA) {
                bCount = 1 + (newData.metaLevels['meta_plas_count'] || 0);
                bSpeed *= (1 + (newData.metaLevels['meta_plas_spd'] || 0) * 0.15);
                bDamageMult *= (1 + (newData.metaLevels['meta_plas_dmg'] || 0) * 0.15);
            } else if (weapon === WeaponType.MISSILE) {
                bDamageMult *= (1 + (newData.metaLevels['meta_msl_dmg'] || 0) * 0.2);
            } else if (weapon === WeaponType.LASER) {
                bDamageMult *= (1 + (newData.metaLevels['meta_lsr_burn'] || 0) * 0.25);
                bPierce = 2 + (newData.metaLevels['meta_lsr_pierce'] || 0);
            }

            let baseMaxHP = (shipConfig.baseStats.maxHealth || 100) * (1 + hpL * 0.15);
            let baseMaxShield = (shipConfig.baseStats.maxShield || 25) * (1 + shL * 0.20);
            let baseDamage = (baseWStats.damage) * (1 + dmgL * 0.10) * bDamageMult;
            let baseMagnet = (INITIAL_STATS.magnetRange) * (1 + magL * 0.25);
            let baseSpeed = (shipConfig.baseStats.speed || 230) * (1 + spdL * 0.10);

            let finalStats: PlayerStats = {
                ...current,
                shipType: newData.equippedShip,
                weaponType: weapon,
                maxHealth: baseMaxHP,
                maxShield: baseMaxShield,
                shieldRegen: shipConfig.baseStats.shieldRegen || 2.5,
                speed: baseSpeed,
                damage: baseDamage,
                fireRate: baseWStats.fireRate,
                magnetRange: baseMagnet,
                bulletCount: bCount,
                bulletSpeed: bSpeed,
                pierceCount: bPierce
            };

            current.acquiredUpgrades.forEach(upg => { finalStats = upg.effect(finalStats); });
            finalStats.currentHealth = Math.min(finalStats.maxHealth, current.currentHealth);
            finalStats.currentShield = Math.min(finalStats.maxShield, current.currentShield);
            return finalStats;
        });
    }, []);

    return {
        stats,
        setStats,
        statsRef,
        playerPosRef,
        cameraPosRef,
        joystickDirRef,
        lastPlayerHitTimeRef,
        initPlayer,
        updatePlayer,
        handleShieldRegen,
        addUpgrade,
        triggerPlayerHit,
        syncWithPersistentData
    };
};
