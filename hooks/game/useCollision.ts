import React, { useCallback } from 'react';
import React, { Entity, EntityType, PlayerStats, WeaponType, PowerUpType, PersistentData, Upgrade, GameState } from '../../types';
import React, { UPGRADES } from '../../constants';

// Helper for circular collision
const checkCircleCollision = (a: Entity, b: Entity) => {
    const dx = a.pos.x - b.pos.x;
    const dy = a.pos.y - b.pos.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.radius + b.radius;
};

export const useCollision = (
    enemiesRef: React.MutableRefObject<Entity[]>,
    projectilesRef: React.MutableRefObject<Entity[]>,
    pickupsRef: React.MutableRefObject<Entity[]>,
    playerPosRef: React.MutableRefObject<{ x: number, y: number }>,
    statsRef: React.MutableRefObject<PlayerStats>,
    triggerPlayerHit: (time: number, damage: number) => void,
    spawnDrops: (enemy: Entity) => number, // Returns score
    spawnDamageText: (pos: { x: number, y: number }, damage: number, color?: string) => void,
    addParticles: (particles: Entity[]) => void,
    setScore: React.Dispatch<React.SetStateAction<number>>,
    setStats: React.Dispatch<React.SetStateAction<PlayerStats>>,
    setOfferedUpgrades: (u: Upgrade[]) => void,
    setGameState: (s: GameState) => void,
    persistentData: PersistentData
) => {

    const checkCollisions = useCallback((time: number, dt: number) => {
        const pStats = statsRef.current;
        const enemies = enemiesRef.current;
        const projectiles = projectilesRef.current;
        const pickups = pickupsRef.current;

        // 1. Projectiles vs Enemies
        // Optimization: Spatial Partitioning would go here. For now: O(N*M)
        projectiles.forEach(p => {
            if (p.type === EntityType.BULLET && !p.isCharging) {
                // Optimization: Only check valid targets
                for (const e of enemies) {
                    if (e.health <= 0) continue; // Skip dead enemies

                    // Hit Check
                    if (checkCircleCollision(p, e)) {
                        // Apply Damage
                        let damage = pStats.damage;
                        let isShieldHit = false;

                        // Enemy Shield Logic
                        if (e.shield && e.shield > 0) {
                            const shieldHit = Math.min(e.shield, damage);
                            e.shield -= shieldHit;
                            damage -= shieldHit;
                            e.lastShieldHitTime = time;
                            isShieldHit = true;
                        }

                        if (damage > 0) {
                            e.health -= damage;
                        }
                        e.lastHitTime = time;
                        spawnDamageText(e.pos, pStats.damage, isShieldHit && damage <= 0 ? '#06fdfd' : '#ffffff');

                        // Handle Death
                        if (e.health <= 0) {
                            const scoreGain = spawnDrops(e);
                            setScore(s => s + scoreGain);
                        }

                        // Bullet interaction
                        if (p.weaponType === WeaponType.MISSILE) {
                            p.health = 0; // Destroy missile
                            // AOE Logic
                            const mRad = 110 * (1 + (persistentData.metaLevels['meta_msl_rad'] || 0) * 0.3);
                            const aoeDmg = pStats.damage * 0.5;
                            addParticles([{
                                id: Math.random().toString(36), type: EntityType.EXPLOSION, pos: { ...p.pos },
                                vel: { x: 0, y: 0 }, radius: mRad, health: 1, maxHealth: 1, color: '#fb923c',
                                duration: 0, maxDuration: 0.6
                            }]);

                            // Hits interaction
                            enemies.forEach(other => {
                                if (other.id !== e.id && other.health > 0) {
                                    const dist = Math.hypot(other.pos.x - p.pos.x, other.pos.y - p.pos.y);
                                    if (dist < mRad) {
                                        // Apply AOE
                                        let ad = aoeDmg;
                                        if (other.shield && other.shield > 0) {
                                            const sd = Math.min(other.shield, ad);
                                            other.shield -= sd;
                                            ad -= sd;
                                            other.lastShieldHitTime = time;
                                        }
                                        if (ad > 0) other.health -= ad;
                                        other.lastHitTime = time;
                                        spawnDamageText(other.pos, aoeDmg, '#fb923c');
                                        if (other.health <= 0) {
                                            const sg = spawnDrops(other);
                                            setScore(s => s + sg);
                                        }
                                    }
                                }
                            });
                        } else {
                            // Plasma/Laser pierce logic
                            if (p.pierceCount && p.pierceCount > 1) {
                                p.pierceCount--;
                            } else {
                                p.health = 0; // Destroy bullet
                            }
                        }
                        break; // Bullet hit something, break inner loop unless we want multihit (usually separate logic)
                    }
                }
            }
        });

        // 2. Enemy Attacks vs Player
        enemies.forEach(e => {
            if (e.health <= 0) return;

            // Melee
            if (e.isMelee) {
                const dist = Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y);
                if (dist < e.radius + 20) {
                    if (time - (e.lastMeleeHitTime || 0) > 150) {
                        e.lastMeleeHitTime = time;
                        triggerPlayerHit(time, 1.2 + (e.level || 1) * 0.4);
                    }
                }
            }

            // Laser Scout Beam
            if (e.type === EntityType.ENEMY_LASER_SCOUT && e.isFiring) {
                // Check angle logic from original
                const dx = playerPosRef.current.x - e.pos.x;
                const dy = playerPosRef.current.y - e.pos.y;
                const dist = Math.hypot(dx, dy);
                const playerAngle = Math.atan2(dy, dx);
                const beamAngle = e.angle || 0;
                let angleDiff = Math.abs(beamAngle - playerAngle);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                if (angleDiff < 0.1 && dist < 700) {
                    triggerPlayerHit(time, 0.5 + (e.level || 1) * 0.15);
                }
            }
        });

        // 3. Enemy Bullets vs Player
        projectiles.forEach(p => {
            if (p.type === EntityType.ENEMY_BULLET) {
                const dist = Math.hypot(p.pos.x - playerPosRef.current.x, p.pos.y - playerPosRef.current.y);
                if (dist < 22 + p.radius) { // Player radius approx 22
                    p.health = 0;
                    triggerPlayerHit(time, 8 + (p.level || 1) * 2);
                }
            }
        });

        // 4. Pickups vs Player
        pickups.forEach(p => {
            if (p.health <= 0) return; // Already picked
            const dist = Math.hypot(p.pos.x - playerPosRef.current.x, p.pos.y - playerPosRef.current.y);
            if (dist < 50) {
                p.health = 0; // Mark for removal
                if (p.type === EntityType.POWERUP) {
                    if (p.powerUpType === PowerUpType.OVERDRIVE) setStats(st => ({ ...st, buffs: { ...st.buffs, overdriveUntil: time + 8000 } }));
                    else if (p.powerUpType === PowerUpType.OMNI_SHOT) setStats(st => ({ ...st, buffs: { ...st.buffs, omniUntil: time + 10000 } }));
                    else if (p.powerUpType === PowerUpType.SUPER_PIERCE) setStats(st => ({ ...st, buffs: { ...st.buffs, pierceUntil: time + 7000 } }));
                } else if (p.type === EntityType.XP_GEM) {
                    setStats(st => {
                        const nx = st.xp + (p.value || 0);
                        if (nx >= st.xpToNextLevel) {
                            // Level Up!
                            // We need to defer this slightly or handle it in main loop to show menu
                            // The original code did setTimeout 0
                            setTimeout(() => {
                                setOfferedUpgrades([...UPGRADES].sort(() => 0.5 - Math.random()).slice(0, 3));
                                setGameState(GameState.LEVELING);
                            }, 0);
                            return { ...st, xp: 0, level: st.level + 1, xpToNextLevel: Math.floor(st.xpToNextLevel * 1.5) };
                        }
                        return { ...st, xp: nx };
                    });
                } else if (p.type === EntityType.CREDIT) {
                    setStats(st => ({ ...st, credits: st.credits + (p.value || 0) }));
                } else if (p.type === EntityType.HEAL_PICKUP) {
                    setStats(st => ({ ...st, currentHealth: Math.min(st.maxHealth, st.currentHealth + (p.value || 0)) }));
                }
            }
        });

    }, []);

    return { checkCollisions };
};
