
import { useCallback } from 'react';
import { Entity, EntityType, PlayerStats, WeaponType, PowerUpType, PersistentData, Upgrade, GameState } from '../../types';
import { UPGRADES } from '../../constants';

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
    spawnDrops: (enemy: Entity) => number, 
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
        const isInvulnerable = time < pStats.invulnerableUntil;

        // 1. Projectiles vs Enemies
        projectiles.forEach(p => {
            if (p.type === EntityType.BULLET && !p.isCharging && p.health > 0) {
                for (const e of enemies) {
                    if (e.health <= 0) continue; 
                    if (checkCircleCollision(p, e)) {
                        let damage = pStats.damage;
                        let isShieldHit = false;
                        if (e.shield && e.shield > 0) {
                            const shieldHit = Math.min(e.shield, damage);
                            e.shield -= shieldHit;
                            damage -= shieldHit;
                            e.lastShieldHitTime = time;
                            isShieldHit = true;
                        }
                        if (damage > 0) e.health -= damage;
                        e.lastHitTime = time;
                        spawnDamageText(e.pos, pStats.damage, isShieldHit && damage <= 0 ? '#06fdfd' : '#ffffff');

                        if (e.health <= 0) {
                            const scoreGain = spawnDrops(e);
                            setScore(s => s + scoreGain);
                        }

                        // Projectile Consumption Logic
                        if (p.weaponType === WeaponType.MISSILE) {
                            p.health = 0; // Missiles always explode
                            const mRad = 110 * (1 + (persistentData.metaLevels['meta_msl_rad'] || 0) * 0.3);
                            const aoeDmg = pStats.damage * 0.5;
                            addParticles([{
                                id: Math.random().toString(36), type: EntityType.EXPLOSION, pos: { ...p.pos },
                                vel: { x: 0, y: 0 }, radius: mRad, health: 1, maxHealth: 1, color: '#fb923c',
                                duration: 0, maxDuration: 0.6
                            }]);
                            enemies.forEach(other => {
                                if (other.id !== e.id && other.health > 0) {
                                    const dist = Math.hypot(other.pos.x - p.pos.x, other.pos.y - p.pos.y);
                                    if (dist < mRad) {
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
                            // Non-missile bullets (Plasma, Laser)
                            if (p.pierceCount && p.pierceCount > 1) {
                                p.pierceCount--; // Subtract one pierce
                            } else {
                                p.health = 0; // Bullet is consumed
                            }
                        }
                        break; // Stop checking other enemies for this bullet in this frame
                    }
                }
            }
        });

        // 2. Enemy Attacks vs Player
        if (!isInvulnerable) {
            enemies.forEach(e => {
                if (e.health <= 0) return;
                if (e.isMelee) {
                    const dist = Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y);
                    if (dist < e.radius + 20) {
                        if (time - (e.lastMeleeHitTime || 0) > 500) {
                            e.lastMeleeHitTime = time;
                            triggerPlayerHit(time, 15 + (e.level || 1) * 3);
                        }
                    }
                }
                if (e.type === EntityType.ENEMY_LASER_SCOUT && e.isFiring) {
                    const dx = playerPosRef.current.x - e.pos.x;
                    const dy = playerPosRef.current.y - e.pos.y;
                    const dist = Math.hypot(dx, dy);
                    const playerAngle = Math.atan2(dy, dx);
                    const beamAngle = e.angle || 0;
                    let angleDiff = Math.abs(beamAngle - playerAngle);
                    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                    if (angleDiff < 0.1 && dist < 700) {
                        triggerPlayerHit(time, 10 + (e.level || 1) * 2);
                    }
                }
            });

            // 3. Enemy Bullets vs Player
            projectiles.forEach(p => {
                if (p.type === EntityType.ENEMY_BULLET && p.health > 0) {
                    const dist = Math.hypot(p.pos.x - playerPosRef.current.x, p.pos.y - playerPosRef.current.y);
                    if (dist < 22 + p.radius) { 
                        p.health = 0;
                        triggerPlayerHit(time, 8 + (p.level || 1) * 2);
                    }
                }
            });
        }

        // 4. Pickups vs Player
        pickups.forEach(p => {
            if (p.health <= 0) return; 
            const dist = Math.hypot(p.pos.x - playerPosRef.current.x, p.pos.y - playerPosRef.current.y);
            if (dist < 50) {
                p.health = 0; 
                if (p.type === EntityType.POWERUP) {
                    if (p.powerUpType === PowerUpType.OVERDRIVE) setStats(st => ({ ...st, buffs: { ...st.buffs, overdriveUntil: time + 8000 } }));
                    else if (p.powerUpType === PowerUpType.OMNI_SHOT) setStats(st => ({ ...st, buffs: { ...st.buffs, omniUntil: time + 10000 } }));
                    else if (p.powerUpType === PowerUpType.SUPER_PIERCE) setStats(st => ({ ...st, buffs: { ...st.buffs, pierceUntil: time + 7000 } }));
                } else if (p.type === EntityType.XP_GEM) {
                    setStats(st => {
                        const nx = st.xp + (p.value || 0);
                        if (nx >= st.xpToNextLevel) {
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

    }, [enemiesRef, projectilesRef, pickupsRef, playerPosRef, statsRef, triggerPlayerHit, spawnDrops, spawnDamageText, addParticles, setScore, setStats, setOfferedUpgrades, setGameState, persistentData]);

    return { checkCollisions };
};
