
import { useState, useRef, useCallback, useEffect } from 'react';
import { PlayerStats, Vector2D, Upgrade, PersistentData, WeaponType, ShipType, GameState } from '../../types';
import { INITIAL_STATS, WORLD_SIZE, SHIPS, WEAPON_BASE_STATS, CAMERA_LERP } from '../../constants';
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

    const calculateStats = useCallback((data: PersistentData) => {
        const shipConfig = SHIPS.find(s => s.type === data.equippedShip) || SHIPS[0];
        const weapon = data.equippedWeapon || WeaponType.PLASMA;
        const baseWStats = WEAPON_BASE_STATS[weapon];

        // Meta Levels
        const hpL = data.metaLevels['meta_hp'] || 0;
        const dmgL = data.metaLevels['meta_dmg'] || 0;
        const magL = data.metaLevels['meta_magnet'] || 0;
        const shL = data.metaLevels['meta_shield'] || 0;
        const regenL = data.metaLevels['meta_regen'] || 0;
        const critChL = data.metaLevels['meta_crit_chance'] || 0;
        const critDmgL = data.metaLevels['meta_crit_dmg'] || 0;
        const salvageL = data.metaLevels['meta_salvage'] || 0;

        // Weapon Specific Meta Levels
        const plasDmgL = data.metaLevels['meta_plas_dmg'] || 0;
        const plasSpdL = data.metaLevels['meta_plas_speed'] || 0;
        const plasCountL = data.metaLevels['meta_plas_count'] || 0; // New Meta
        
        const mslDmgL = data.metaLevels['meta_msl_dmg'] || 0;
        const mslRelL = data.metaLevels['meta_msl_reload'] || 0;
        const lsrDmgL = data.metaLevels['meta_lsr_dmg'] || 0;

        // Weapon Specific Metas
        let bCount = (shipConfig.baseStats.bulletCount || 1);
        let bSpeed = baseWStats.bulletSpeed;
        let bDamageMult = 1.0;
        let bPierce = 1;
        let fRate = baseWStats.fireRate;

        if (weapon === WeaponType.PLASMA) {
            bDamageMult *= (1 + plasDmgL * 0.05);
            bSpeed *= (1 + plasSpdL * 0.08);
            bCount += plasCountL; // Apply Split Chamber Meta
        } else if (weapon === WeaponType.MISSILE) {
            bDamageMult *= (1 + mslDmgL * 0.05);
            fRate *= (1 + mslRelL * 0.05);
             // Warhead yield (radius) handled in collision
        } else if (weapon === WeaponType.LASER) {
             bDamageMult *= (1 + lsrDmgL * 0.05);
             fRate *= (1 + (data.metaLevels['meta_lsr_recharge'] || 0) * 0.1); 
             bPierce = 999; // Railgun
        }

        const finalMaxHP = (shipConfig.baseStats.maxHealth || 100) * (1 + hpL * 0.10);
        const finalMaxShield = (shipConfig.baseStats.maxShield || 20) * (1 + shL * 0.15);
        const finalShieldRegen = (shipConfig.baseStats.shieldRegen || 3) * (1 + regenL * 0.10);
        
        // Base stats from ship config + Meta scaling
        const metaStats: PlayerStats = {
            ...INITIAL_STATS,
            ...shipConfig.baseStats, // Apply ship overrides
            shipType: data.equippedShip,
            weaponType: weapon,
            maxHealth: finalMaxHP,
            currentHealth: finalMaxHP, // Full health on init
            maxShield: finalMaxShield,
            currentShield: finalMaxShield,
            shieldRegen: finalShieldRegen,
            
            damage: baseWStats.damage * (1 + dmgL * 0.05) * bDamageMult,
            fireRate: fRate,
            magnetRange: INITIAL_STATS.magnetRange * (1 + magL * 0.15),
            bulletCount: bCount,
            bulletSpeed: bSpeed,
            pierceCount: bPierce,
            
            critChance: (shipConfig.baseStats.critChance || 0.05) + (critChL * 0.01),
            critMultiplier: 1.5 + (critDmgL * 0.05),
            creditMultiplier: 1.0 + (salvageL * 0.05),

            invulnerableUntil: 0,
            activeBuffs: {}
        };

        return metaStats;
    }, []);

    const initPlayer = useCallback(() => {
        const newStats = calculateStats(persistentData);
        playerPosRef.current = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
        cameraPosRef.current = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
        setStats(newStats);
        lastPlayerHitTimeRef.current = 0;
    }, [persistentData, calculateStats]);

    const updatePlayer = useCallback((dt: number, time: number) => {
        if (gameState !== GameState.PLAYING || isPaused) return;
        const pStats = statsRef.current;
        
        let moveSpeed = pStats.speed;
        if (isBuffActive(pStats, 'SPEED', time)) {
             moveSpeed *= 1.5; // 50% Speed Boost
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
            const newStats = upgrade.effect(p);
            return { ...newStats, acquiredUpgrades: [...p.acquiredUpgrades, upgrade] };
        });
    }, []);

    const triggerPlayerHit = useCallback((time: number, damage: number) => {
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
            return { ...prev, currentShield: newShield, currentHealth: newHealth, lastShieldHitTime: time, invulnerableUntil: time + 300 };
        });
    }, []);

    const syncWithPersistentData = useCallback((newData: PersistentData) => {
        const baseStats = calculateStats(newData);
        setStats(current => {
            // Re-apply in-game upgrades to the new base stats
            let finalStats = { ...baseStats };
            
            // Preserve current health/shield state ratios or values logic
            // Actually, keep current HP but clamp to new Max
            const hpRatio = current.maxHealth > 0 ? current.currentHealth / current.maxHealth : 1;
            const shieldRatio = current.maxShield > 0 ? current.currentShield / current.maxShield : 1;

            current.acquiredUpgrades.forEach(upg => { finalStats = upg.effect(finalStats); });

            finalStats.currentHealth = Math.min(finalStats.maxHealth, finalStats.maxHealth * hpRatio);
            finalStats.currentShield = Math.min(finalStats.maxShield, finalStats.maxShield * shieldRatio);
            
            // Preserve in-game currency
            finalStats.credits = current.credits;
            finalStats.xp = current.xp;
            finalStats.level = current.level;
            finalStats.xpToNextLevel = current.xpToNextLevel;
            finalStats.acquiredUpgrades = current.acquiredUpgrades;
            finalStats.activeBuffs = current.activeBuffs; // Preserve active buffs

            return finalStats;
        });
    }, [calculateStats]);

    return {
        stats, setStats, statsRef, playerPosRef, cameraPosRef, joystickDirRef, lastPlayerHitTimeRef,
        initPlayer, updatePlayer, handleShieldRegen, addUpgrade, triggerPlayerHit, syncWithPersistentData
    };
};
